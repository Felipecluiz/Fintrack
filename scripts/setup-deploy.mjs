#!/usr/bin/env node
/**
 * npm run setup:deploy — configura, UMA vez, tudo que o deploy automático precisa.
 *
 *  1. Confere Node, GitHub CLI, git e o remote do repositório
 *  2. Garante os workflows em .github/workflows
 *  3. Valida o token da Cloudflare e testa CADA permissão necessária
 *  4. Garante D1 e projeto Pages, descobre as URLs da API e do front
 *  5. Garante o JWT_SECRET no Worker de produção (gerado aqui, nunca exibido)
 *  6. Cadastra os secrets e a variável no GitHub
 *  7. Opcional: seed da conta demo e commit + push para disparar o deploy
 *
 * Idempotente: rodar de novo só confere o que já existe.
 * Flags: --dry-run (só mostra o que faria) · --yes (aceita tudo) · --rotate-secrets · --seed
 * Variáveis opcionais: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
 *
 * Adaptado do script de setup do outro protótipo do FinTrack (pasta Portifolio).
 */
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { argv, cwd, env, exit, platform, stdin, stdout, versions } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------- configuração do projeto
const PROJECT = {
  name: 'Fintrack',
  branch: 'master',
  /** `wrangler deploy --env production` publica como `<name>-production`. */
  worker: 'fintrack-api-production',
  d1: 'fintrack-db',
  pages: 'fintrack-web',
  wranglerToml: 'apps/api/wrangler.toml',
  /** Segredos do Worker gerados por este script (nunca vão para o GitHub). */
  workerSecrets: ['JWT_SECRET'],
};

/** Cada permissão é testada com uma chamada real à API antes de qualquer mudança. */
const PERMISSION_CHECKS = [
  { label: 'Account · Workers Scripts · Edit', path: (id) => `/accounts/${id}/workers/scripts` },
  { label: 'Account · D1 · Edit', path: (id) => `/accounts/${id}/d1/database?per_page=1` },
  { label: 'Account · Cloudflare Pages · Edit', path: (id) => `/accounts/${id}/pages/projects` },
];

const TOKEN_PERMISSIONS = [
  ...PERMISSION_CHECKS.map((check) => check.label),
  'Account · Account Settings · Read',
  'User · User Details · Read',
  'User · Memberships · Read',
];

const CF_API = env.CF_API_BASE ?? 'https://api.cloudflare.com/client/v4';
const GH = env.GH_BIN ?? 'gh';
const NPM = platform === 'win32' ? 'npm.cmd' : 'npm';
const DRY_RUN = argv.includes('--dry-run');
const ASSUME_YES = argv.includes('--yes');
const ROTATE = argv.includes('--rotate-secrets');
const SEED = argv.includes('--seed');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- saída no terminal
const color = (code) => (text) => (stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const bold = color('1');
const green = color('32');
const yellow = color('33');
const red = color('31');
const dim = color('2');

const step = (title) => console.log(`\n${bold('▸ ' + title)}`);
const ok = (msg) => console.log(`  ${green('✔')} ${msg}`);
/** Confirma uma mudança real; no dry-run a linha "○" já descreveu o que aconteceria. */
const applied = (msg) => (DRY_RUN ? undefined : ok(msg));
const info = (msg) => console.log(`  ${dim('·')} ${msg}`);
const warn = (msg) => console.log(`  ${yellow('!')} ${msg}`);
const planned = (msg) => console.log(`  ${yellow('○')} ${dim('[dry-run]')} ${msg}`);

class SetupError extends Error {}
const fail = (msg) => {
  throw new SetupError(msg);
};

// ---------------------------------------------------------------- prompts
async function confirm(question, defaultYes = true) {
  if (ASSUME_YES) return true;
  if (!stdin.isTTY) return defaultYes;
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question(`  ${question} ${dim(defaultYes ? '(S/n)' : '(s/N)')} `))
    .trim()
    .toLowerCase();
  rl.close();
  return answer === '' ? defaultYes : ['s', 'sim', 'y', 'yes'].includes(answer);
}

async function ask(question) {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(`  ${question} `);
  rl.close();
  return answer.trim();
}

/** Lê um segredo sem ecoar no terminal. */
function askHidden(question) {
  return new Promise((resolvePromise) => {
    stdout.write(`  ${question} `);
    if (!stdin.isTTY) {
      let data = '';
      stdin.setEncoding('utf8');
      stdin.on('data', (chunk) => (data += chunk));
      stdin.on('end', () => resolvePromise(data.trim()));
      return;
    }
    let value = '';
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          return resolvePromise(value.trim());
        }
        if (char === '\u0003') exit(130); // Ctrl+C
        value = char === '\u007f' || char === '\b' ? value.slice(0, -1) : value + char;
      }
    };
    stdin.on('data', onData);
  });
}

// ---------------------------------------------------------------- processos (gh, git, npm)
function run(cmd, args, { input, allowFailure = false, mutates = false, extraEnv, inherit = false } = {}) {
  if (mutates && DRY_RUN) {
    planned(`${cmd} ${args.join(' ')}`);
    return '';
  }
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    input,
    encoding: 'utf8',
    shell: platform === 'win32',
    env: { ...env, ...extraEnv },
    stdio: inherit ? 'inherit' : undefined,
  });
  if (result.error && result.error.code === 'ENOENT') fail(`"${cmd}" não encontrado no PATH.`);
  if (result.status !== 0 && !allowFailure) {
    fail(`${cmd} ${args.join(' ')} falhou:\n${((result.stderr || result.stdout) ?? '').trim()}`);
  }
  return result.status === 0 ? (result.stdout ?? '').trim() : null;
}

const gh = (args, opts) => run(GH, args, opts);
const git = (args, opts) => run('git', args, opts);

// ---------------------------------------------------------------- API da Cloudflare
let cfToken = '';

async function cf(path, { method = 'GET', body, allow404 = false } = {}) {
  if (method !== 'GET' && DRY_RUN) {
    planned(`${method} ${path}`);
    return null;
  }
  const response = await fetch(`${CF_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (allow404 && response.status === 404) return null;
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    const errors = (json.errors ?? []).map((e) => `${e.code}: ${e.message}`).join('; ');
    const error = new SetupError(`Cloudflare ${method} ${path} → ${response.status} ${errors}`);
    error.status = response.status;
    error.codes = (json.errors ?? []).map((e) => e.code);
    throw error;
  }
  return json.result;
}

// ---------------------------------------------------------------- wrangler.toml
function readWranglerToml() {
  const file = join(ROOT, PROJECT.wranglerToml);
  if (!existsSync(file)) fail(`${PROJECT.wranglerToml} não encontrado.`);
  const text = readFileSync(file, 'utf8');
  const production = text.slice(text.indexOf('[env.production'));
  return {
    databaseIds: [...text.matchAll(/database_id\s*=\s*"([^"]+)"/g)].map((m) => m[1]),
    productionOrigins: (/ALLOWED_ORIGINS\s*=\s*"([^"]*)"/.exec(production)?.[1] ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}

// ---------------------------------------------------------------- etapas
async function checkPrerequisites() {
  step('Pré-requisitos');
  const [major] = versions.node.split('.').map(Number);
  if (major < 20) fail(`Node 20+ necessário (atual: ${versions.node}).`);
  ok(`Node ${versions.node}`);

  gh(['--version']);
  if (gh(['auth', 'status'], { allowFailure: true }) === null) {
    fail(`GitHub CLI sem login. Rode: ${bold('gh auth login')}`);
  }
  ok('GitHub CLI autenticado');

  if (git(['rev-parse', '--is-inside-work-tree'], { allowFailure: true }) !== 'true') {
    fail('Esta pasta não é um repositório git.');
  }
  const repo = gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], {
    allowFailure: true,
  });
  if (!repo) fail('Remote "origin" no GitHub não encontrado. Rode: gh repo create --source . --push');
  ok(`Repositório ${repo}`);
  return repo;
}

function ensureWorkflows() {
  step('Workflows');
  const target = join(ROOT, '.github/workflows');
  const parked = join(ROOT, 'workflows');
  // `workflows/` na raiz é a versão "estacionada" (quem gera arquivos remotamente
  // nem sempre pode escrever em .github): ela tem prioridade.
  if (existsSync(parked)) {
    for (const file of readdirSync(parked).filter((f) => f.endsWith('.yml'))) {
      if (DRY_RUN) planned(`mover workflows/${file} → .github/workflows/${file}`);
      else {
        mkdirSync(target, { recursive: true });
        renameSync(join(parked, file), join(target, file));
        ok(`Movido workflows/${file} → .github/workflows/${file}`);
      }
    }
    if (!DRY_RUN && readdirSync(parked).length === 0) rmdirSync(parked);
  }
  for (const file of ['ci.yml', 'deploy.yml']) {
    if (existsSync(join(target, file))) ok(`.github/workflows/${file}`);
    else if (!DRY_RUN) fail(`.github/workflows/${file} não encontrado.`);
  }
  if (existsSync(join(ROOT, 'package-lock.json'))) ok('package-lock.json (o CI usa npm ci)');
  else fail('package-lock.json não encontrado. Rode npm install e tente de novo.');
}

async function readCloudflareToken() {
  step('Token da Cloudflare');
  cfToken = env.CLOUDFLARE_API_TOKEN ?? '';
  if (!cfToken) {
    console.log(`  Crie um token em ${bold('https://dash.cloudflare.com/profile/api-tokens')}`);
    console.log(
      `  → ${bold('Create Token')} → modelo ${bold('Edit Cloudflare Workers')}, garantindo as permissões:`,
    );
    TOKEN_PERMISSIONS.forEach((p) => console.log(`      ${p}`));
    cfToken = await askHidden('Cole o token (não aparece na tela):');
  }
  if (!cfToken) fail('Token vazio.');
  const verified = await cf('/user/tokens/verify').catch(() => null);
  if (verified?.status !== 'active') fail('Token inválido ou inativo.');
  ok('Token válido');
}

async function selectAccount() {
  step('Conta Cloudflare');
  const accounts = await cf('/accounts?per_page=50');
  if (!accounts?.length) fail('Nenhuma conta visível. O token precisa de "Account Settings · Read".');

  let account = env.CLOUDFLARE_ACCOUNT_ID
    ? accounts.find((a) => a.id === env.CLOUDFLARE_ACCOUNT_ID)
    : accounts.length === 1
      ? accounts[0]
      : null;

  if (!account) {
    accounts.forEach((a, i) => console.log(`    ${i + 1}) ${a.name} ${dim(a.id)}`));
    const choice = Number(await ask(`Qual conta usar? (1-${accounts.length})`));
    account = accounts[choice - 1] ?? fail('Opção inválida.');
  }
  ok(`${account.name} ${dim(account.id)}`);
  return account.id;
}

/** Testa cada permissão com uma chamada real — falha cedo, antes de mudar algo. */
async function checkPermissions(accountId) {
  step('Permissões do token');
  const missing = [];
  for (const check of PERMISSION_CHECKS) {
    try {
      await cf(check.path(accountId));
      ok(check.label);
    } catch (error) {
      if (error.status === 403 || error.codes?.includes(10000) || error.codes?.includes(9109)) {
        console.log(`  ${red('✖')} ${check.label}`);
        missing.push(check.label);
      } else throw error;
    }
  }
  if (missing.length) {
    fail(
      `O token não tem: ${missing.join(', ')}.\n` +
        '  Edite o token em https://dash.cloudflare.com/profile/api-tokens (⋯ → Edit), ' +
        'acrescente as permissões e rode de novo. O valor do token não muda.',
    );
  }
}

async function ensureD1(accountId) {
  const list = await cf(`/accounts/${accountId}/d1/database?name=${encodeURIComponent(PROJECT.d1)}`);
  const found = list?.find((db) => db.name === PROJECT.d1);
  const { databaseIds } = readWranglerToml();

  if (found) {
    ok(`D1 ${PROJECT.d1} ${dim(found.uuid)}`);
    if (!databaseIds.every((id) => id === found.uuid)) {
      warn(`O database_id no ${PROJECT.wranglerToml} não bate com ${found.uuid}. Atualize-o.`);
    }
    return found.uuid;
  }
  const created = await cf(`/accounts/${accountId}/d1/database`, {
    method: 'POST',
    body: { name: PROJECT.d1 },
  });
  const id = created?.uuid ?? '<novo>';
  applied(`D1 ${PROJECT.d1} criado ${dim(id)}`);
  warn(`Coloque database_id = "${id}" nos dois blocos de ${PROJECT.wranglerToml}.`);
  return id;
}

async function ensurePages(accountId) {
  let project = await cf(`/accounts/${accountId}/pages/projects/${PROJECT.pages}`, {
    allow404: true,
  }).catch((e) => {
    if (e.codes?.includes(8000007)) return null; // projeto não existe
    throw e;
  });
  if (project) {
    ok(`Pages ${PROJECT.pages}`);
    if (project.production_branch !== PROJECT.branch) {
      info(
        `Branch de produção do Pages é "${project.production_branch}"; o deploy usa --branch ${PROJECT.branch}.`,
      );
    }
  } else {
    project = await cf(`/accounts/${accountId}/pages/projects`, {
      method: 'POST',
      body: { name: PROJECT.pages, production_branch: PROJECT.branch },
    });
    applied(`Pages ${PROJECT.pages} criado`);
  }
  // Se o nome estiver ocupado globalmente, a Cloudflare atribui um subdomínio com sufixo.
  return `https://${project?.subdomain ?? `${PROJECT.pages}.pages.dev`}`;
}

async function resolveApiUrl(accountId) {
  const sub = await cf(`/accounts/${accountId}/workers/subdomain`).catch(() => null);
  if (!sub?.subdomain) {
    fail(
      'A conta ainda não tem subdomínio "workers.dev". Abra Cloudflare → Workers & Pages uma vez ' +
        '(ele é criado na primeira visita) e rode de novo.',
    );
  }
  return `https://${PROJECT.worker}.${sub.subdomain}.workers.dev`;
}

function checkCorsOrigins(webUrl) {
  const { productionOrigins } = readWranglerToml();
  const host = new URL(webUrl).host;
  const covered = productionOrigins.some(
    (origin) => origin === webUrl || origin === `https://*.${host}`,
  );
  if (covered) ok(`CORS libera ${webUrl}`);
  else {
    warn(`ALLOWED_ORIGINS de produção não inclui ${webUrl}. Acrescente em ${PROJECT.wranglerToml}:`);
    info(`ALLOWED_ORIGINS = "${webUrl},https://*.${host}"`);
  }
}

/** Segredos do Worker via API: gerados aqui, enviados direto, nunca exibidos. */
async function ensureWorkerSecrets(accountId) {
  step('Segredos do Worker');
  const base = `/accounts/${accountId}/workers/scripts/${PROJECT.worker}`;
  const existing = await cf(`${base}/secrets`, { allow404: true }).catch((e) => {
    if (e.codes?.includes(10007)) return null; // Worker ainda não existe
    throw e;
  });
  if (existing === null) {
    warn(
      `Worker ${PROJECT.worker} ainda não existe. Faça o primeiro deploy e rode este script de novo ` +
        'para criar o JWT_SECRET (sem ele o login em produção falha).',
    );
    return;
  }
  const names = existing.map((secret) => secret.name);
  for (const name of PROJECT.workerSecrets) {
    if (names.includes(name) && !ROTATE) {
      ok(`${name} já existe ${dim('(use --rotate-secrets para trocar)')}`);
      continue;
    }
    await cf(`${base}/secrets`, {
      method: 'PUT',
      body: { name, text: randomBytes(48).toString('base64'), type: 'secret_text' },
    });
    applied(`${name} ${names.includes(name) ? 'trocado (sessões antigas expiram)' : 'criado'}`);
  }
}

async function provisionCloudflare() {
  await readCloudflareToken();
  const accountId = await selectAccount();
  await checkPermissions(accountId);

  step('Recursos na Cloudflare');
  await ensureD1(accountId);
  const webUrl = await ensurePages(accountId);
  const apiUrl = await resolveApiUrl(accountId);
  ok(`API → ${apiUrl}`);
  ok(`Web → ${webUrl}`);
  checkCorsOrigins(webUrl);

  await ensureWorkerSecrets(accountId);
  return { accountId, apiUrl, webUrl };
}

/** Os workflows usam secrets/variables no nível do repositório. */
function configureGitHub(repo, { accountId, apiUrl }) {
  step('GitHub: secrets e variável');
  const secrets = { CLOUDFLARE_API_TOKEN: cfToken, CLOUDFLARE_ACCOUNT_ID: accountId };
  for (const [name, value] of Object.entries(secrets)) {
    // valor via stdin: nunca aparece na lista de processos
    gh(['secret', 'set', name, '-R', repo], { input: value, mutates: true });
    applied(`secret ${name}`);
  }
  gh(['variable', 'set', 'VITE_API_URL', '-R', repo, '--body', apiUrl], { mutates: true });
  applied(`variable VITE_API_URL = ${apiUrl}`);
}

async function seedDemo(accountId) {
  if (!SEED && !(await confirm('Aplicar migrations e (re)criar a conta demo em produção agora?', false))) {
    info(`Quando quiser: ${bold('npm run db:seed:remote -w @fintrack/api')}`);
    return;
  }
  step('Banco de produção');
  const extraEnv = { CLOUDFLARE_API_TOKEN: cfToken, CLOUDFLARE_ACCOUNT_ID: accountId };
  run(NPM, ['run', 'db:migrate:remote', '-w', '@fintrack/api', '--', '--env', 'production'], {
    mutates: true,
    extraEnv,
    inherit: true,
  });
  run(NPM, ['run', 'db:seed:remote', '-w', '@fintrack/api'], { mutates: true, extraEnv, inherit: true });
  applied('Conta demo pronta: demo@fintrack.dev / demo1234');
}

async function firstDeploy(repo) {
  step('Deploy');
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { allowFailure: true }) ?? PROJECT.branch;
  if (branch !== PROJECT.branch) {
    warn(`Você está na branch "${branch}". O deploy roda a partir da ${PROJECT.branch}.`);
    return;
  }
  const dirty = git(['status', '--porcelain']) !== '';

  if (dirty) {
    if (!(await confirm(`Fazer commit de tudo e push para a ${PROJECT.branch} (dispara o deploy)?`, false))) {
      info(
        `Quando quiser: ${bold(`git add -A && git commit -m "chore: setup deploy" && git push origin ${PROJECT.branch}`)}`,
      );
      return;
    }
    git(['add', '-A'], { mutates: true });
    git(['commit', '-m', 'chore: configura deploy automático'], { mutates: true });
    git(['push', 'origin', PROJECT.branch], { mutates: true });
    applied('Push feito — o GitHub Actions já começou');
  } else if (await confirm('Nada para commitar. Disparar o deploy agora?', true)) {
    gh(['workflow', 'run', 'deploy.yml', '-R', repo, '--ref', PROJECT.branch], { mutates: true });
    applied('Workflow de deploy disparado');
  }
  info(`Acompanhe: ${bold(`gh run watch -R ${repo}`)}  ou  https://github.com/${repo}/actions`);
}

// ---------------------------------------------------------------- main
async function main() {
  console.log(bold(`\n${PROJECT.name} · configuração do deploy automático${DRY_RUN ? ' (dry-run)' : ''}`));
  if (resolve(cwd()) !== ROOT) info(`Usando o projeto em ${ROOT}`);

  const repo = await checkPrerequisites();
  ensureWorkflows();
  const cloudflare = await provisionCloudflare();
  configureGitHub(repo, cloudflare);
  await seedDemo(cloudflare.accountId);
  await firstDeploy(repo);

  console.log(
    `\n${green(bold('Pronto!'))} A partir de agora, todo push na ${PROJECT.branch} faz deploy sozinho.`,
  );
  console.log(`  Web: ${cloudflare.webUrl}\n  API: ${cloudflare.apiUrl}\n`);
}

main().catch((error) => {
  console.error(`\n  ${red('✖')} ${error instanceof SetupError ? error.message : error.stack}\n`);
  exit(1);
});
