# 005 — Plano técnico

## Rotas
| Rota                | Acesso   | Conteúdo |
| ------------------- | -------- | -------- |
| `/`                 | público  | Landing com dashboard de dados fictícios |
| `/login`, `/register` | público | Formulários de autenticação |
| `/app`              | sessão   | Dashboard real |
| `/app/transactions` | sessão   | CRUD de transações |
| `/app/categories`   | sessão   | CRUD de categorias |

## Dados fictícios
`features/landing/demoData.ts` gera um `DashboardSummaryDTO` para os últimos
6 meses a partir da data atual, de forma determinística. A landing reaproveita
os mesmos componentes do dashboard real (`StatTiles`, `MonthlyChart`,
`CategoryRanking`): o que o visitante vê é exatamente o que vai usar.

## Sessão no front
- `features/auth/session.ts` — leitura/escrita do token no `localStorage`
  (com `try/catch`, que pode falhar em modo privado).
- `AuthProvider` — estado do usuário, `login`, `register`, `loginAsDemo`,
  `logout`; registra no `httpClient` o token e o tratamento de 401.
- `RequireAuth` — guarda de rota para `/app/*`.

## Tema
`data-theme` em `<html>` (`light` | `dark` | ausente = sistema). O CSS define os
tokens escuros para `[data-theme='dark']` e, via `prefers-color-scheme`, para
quando não há escolha explícita.

## Segurança do front
`public/_headers` (Pages): CSP `default-src 'self'`, `connect-src` limitado a
`*.workers.dev`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`.
