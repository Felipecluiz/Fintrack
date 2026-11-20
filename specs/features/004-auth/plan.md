# 004 — Plano técnico

## Onde cada regra vive
| Regra  | Camada         | Arquivo |
| ------ | -------------- | ------- |
| BR-401 | domain         | `domain/user/Email.ts` + índice único `ux_users_email` |
| BR-402 | domain         | `domain/user/passwordPolicy.ts` |
| BR-403 | infrastructure | `infrastructure/security/Pbkdf2PasswordHasher.ts` (porta `PasswordHasher`) |
| BR-404 | infrastructure | `infrastructure/security/HmacJwtTokenService.ts` (porta `TokenService`) |
| BR-405 | infrastructure | Repositórios D1 recebem `ownerId` no construtor: toda query tem `user_id = ?` |
| BR-406 | presentation   | `middleware/rateLimit.ts` (binding Rate Limiting do Workers) |
| BR-407 | application    | `LoginUser` (mesma mensagem + verificação "dummy" para igualar o tempo) |

## Decisão central: repositórios escopados pelo dono
Em vez de passar `userId` para cada caso de uso e cada método de repositório,
o composition root cria os repositórios **já presos a um usuário**:

```ts
buildUseCases(env, userId) // → new D1CategoryRepository(env.DB, userId), ...
```

- Os casos de uso e o domínio da 001–003 não mudaram: continuam sem saber que
  existem vários usuários.
- É impossível "esquecer o filtro" num caso de uso novo: o repositório que ele
  recebe só enxerga um dono.
- Os testes de integração (`test/integration`) provam o isolamento direto no SQL.

## Sessão: token Bearer (não cookie)
Front (`*.pages.dev`) e API (`*.workers.dev`) estão em sites diferentes; cookies
de terceiros são bloqueados pelos navegadores. O token vai no header
`Authorization` e fica no `localStorage`. Mitigações: CSP restritiva no Pages,
sem HTML vindo do usuário, expiração de 7 dias.

## Contrato de API
| Método | Rota                 | Auth | Entrada         | Saída                  | Erros         |
| ------ | -------------------- | ---- | --------------- | ---------------------- | ------------- |
| POST   | `/api/auth/register` | —    | `RegisterInput` + header `X-Turnstile-Token` | `AuthResponseDTO` 201  | 400, 403, 409, 429 |
| POST   | `/api/auth/login`    | —    | `LoginInput`    | `AuthResponseDTO`      | 400, 401, 429 |
| GET    | `/api/me`            | ✔︎   | —               | `UserDTO`              | 401           |
| *      | demais `/api/*`      | ✔︎   | —               | —                      | + 401         |

## Banco de dados
`0002_users.sql`: tabela `users`, coluna `user_id` em `categories` e
`transactions`, índice único de categoria passa a ser `(user_id, name, type)`.
Linhas antigas ficam com `user_id NULL` (invisíveis); o seed de demonstração
as adota para o usuário demo.

## Segredos
`JWT_SECRET` (≥ 32 caracteres). Em dev vem do `wrangler.toml`; em produção:
`npx wrangler secret put JWT_SECRET --env production`. Sem segredo, a API
recusa autenticar (falha fechada).

## Verificação anti-robô (Turnstile)
- **Porta** `HumanVerifier` na camada de aplicação; **adaptador**
  `TurnstileVerifier` na infraestrutura (POST para a Siteverify com segredo,
  token e IP; timeout de 5 s; falha fechada).
- **Middleware** `requireHuman('register')` só na rota de cadastro. O token
  vem no header `X-Turnstile-Token` (liberado no CORS), sem mexer no contrato.
- **Front**: widget carregado só na tela de cadastro, com `render=explicit`; o
  botão fica desabilitado até a verificação passar e o widget é reiniciado
  depois de um erro (cada token vale uma vez).
- **Chaves**: em dev e nos E2E, as chaves de teste públicas da Cloudflare
  (`.env.development` e `wrangler.toml`). Em produção, `VITE_TURNSTILE_SITE_KEY`
  (variável do GitHub) e `TURNSTILE_SECRET_KEY` (secret do Worker). Sem a chave
  secreta, a API não exige a verificação.
