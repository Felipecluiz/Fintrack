# 004 — Tasks

- [x] T401 — `Email`, `passwordPolicy` e entidade `User` + testes (AC-402, AC-403)
- [x] T402 — Portas `UserRepository`, `PasswordHasher`, `TokenService`
- [x] T403 — Casos de uso `RegisterUser`, `LoginUser`, `GetCurrentUser` + testes (AC-401, AC-404…AC-406, AC-408)
- [x] T404 — `Pbkdf2PasswordHasher` e `HmacJwtTokenService` + testes (AC-407, AC-412)
- [x] T405 — Migration `0002_users.sql` e repositórios D1 escopados por dono
- [x] T406 — Middlewares `requireAuth` e `rateLimit`, rotas `/api/auth/*` e `/api/me`
- [x] T407 — Testes HTTP de isolamento e limite (AC-409…AC-411)
- [x] T408 — Testes de integração D1 do isolamento (AC-409)
- [x] T409 — Telas de login/cadastro, sessão e rotas protegidas no front
- [x] T410 — Porta `HumanVerifier`, `TurnstileVerifier` (Siteverify) e middleware `requireHuman` no cadastro + testes (AC-413, AC-414)
- [x] T411 — Widget do Turnstile na tela de cadastro, CSP liberando `challenges.cloudflare.com` e chaves de teste em dev
