import { expect, test } from '@playwright/test';

/** E-mail único por execução: o D1 local persiste entre rodadas. */
const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}@e2e.test`;

test('AC-501: a landing apresenta o produto com dados fictícios', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('cada real');
  await expect(page.getByText('Dados fictícios')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Criar conta grátis' }).first()).toBeVisible();
});

test('AC-503: rotas do app exigem login', async ({ page }) => {
  await page.goto('/app/transactions');
  await expect(page).toHaveURL(/\/login$/);
});

test('fluxo completo: cadastro → categoria → transação → dashboard', async ({ page }) => {
  // Cadastro (AC-401)
  await page.goto('/register');
  await page.getByLabel('Nome').fill('Pessoa E2E');
  await page.getByLabel('E-mail').fill(uniqueEmail('fluxo'));
  await page.getByLabel('Senha').fill('segredo123');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/\/app\/categories$/);

  // Categoria (AC-101)
  await page.getByLabel('Nome').fill('Mercado');
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await expect(page.getByRole('status')).toContainText('Categoria "Mercado" criada');

  // Transação (AC-201)
  await page.getByRole('link', { name: 'Transações' }).click();
  await page.getByRole('button', { name: 'Nova transação' }).click();
  await page.getByLabel('Descrição').fill('Compras da semana');
  await page.getByLabel('Valor (R$)').fill('123,45');
  // Escopo no <form>: os filtros da página também têm um campo "Categoria".
  // Sem `exact`: o nome acessível do <select> inclui a opção selecionada.
  await page.locator('form').getByLabel('Categoria').selectOption({ label: 'Mercado' });
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Compras da semana')).toBeVisible();

  // Dashboard (AC-301)
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText(/R\$\s123,45/).first()).toBeVisible();
});

test('AC-409: um usuário não vê os dados de outro', async ({ browser }) => {
  const ana = await browser.newPage();
  await ana.goto('/register');
  await ana.getByLabel('Nome').fill('Ana');
  await ana.getByLabel('E-mail').fill(uniqueEmail('ana'));
  await ana.getByLabel('Senha').fill('segredo123');
  await ana.getByRole('button', { name: 'Criar conta' }).click();
  await expect(ana).toHaveURL(/\/app\/categories$/); // espera sair do cadastro
  await ana.getByLabel('Nome').fill('Categoria secreta da Ana');
  await ana.getByRole('button', { name: 'Adicionar' }).click();
  // `exact`: o toast "Categoria … criada" também contém esse texto.
  await expect(ana.getByText('Categoria secreta da Ana', { exact: true })).toBeVisible();

  const bia = await browser.newPage(); // contexto novo = sem a sessão da Ana
  await bia.goto('/register');
  await bia.getByLabel('Nome').fill('Bia');
  await bia.getByLabel('E-mail').fill(uniqueEmail('bia'));
  await bia.getByLabel('Senha').fill('segredo123');
  await bia.getByRole('button', { name: 'Criar conta' }).click();
  await expect(bia).toHaveURL(/\/app\/categories$/);
  await expect(bia.getByText('Categoria secreta da Ana', { exact: true })).toHaveCount(0);
});
