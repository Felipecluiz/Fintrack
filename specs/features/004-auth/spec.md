# 004 — Autenticação e multiusuário

## Contexto
Até aqui qualquer pessoa com o link via e editava todos os dados. Cada usuário
precisa de uma conta e enxergar **apenas** as próprias categorias, transações e
dashboard.

## Histórias de usuário
- **US-401** — Como visitante, quero criar uma conta com nome, e-mail e senha.
- **US-402** — Como usuário, quero entrar com e-mail e senha e continuar logado
  por alguns dias.
- **US-403** — Como usuário, quero ter certeza de que ninguém mais vê os meus
  dados.

## Regras de negócio
- **BR-401** — O e-mail é único (sem diferenciar maiúsculas/minúsculas) e é
  normalizado para minúsculas.
- **BR-402** — A senha tem de 8 a 128 caracteres e contém ao menos uma letra e
  um número.
- **BR-403** — A senha nunca é armazenada nem devolvida; guarda-se apenas um
  hash PBKDF2-SHA256 com salt aleatório.
- **BR-404** — A sessão é um token assinado (JWT HS256) válido por 7 dias.
- **BR-405** — Todo dado de negócio pertence a um usuário. Leituras e escritas
  são sempre filtradas pelo dono.
- **BR-406** — Login e cadastro aceitam no máximo 10 tentativas por minuto por
  IP.
- **BR-407** — Erro de login não revela se o e-mail existe.
- **BR-408** — O cadastro só é aceito depois da verificação anti-robô do
  Cloudflare Turnstile (ação `register`), validada no servidor pela API
  Siteverify. Erro de rede ou resposta inválida contam como reprovação. O
  login não exige a verificação (já tem BR-406), para não travar a conta demo.

## Critérios de aceite
- **AC-401** — Dados válidos no cadastro → `201` com `token`, `expiresAt` e
  `user` (sem hash de senha).
- **AC-402** — E-mail inválido no cadastro → `400 VALIDATION_ERROR`.
- **AC-403** — Senha fraca (curta, sem letra ou sem número) → `400 VALIDATION_ERROR`.
- **AC-404** — E-mail já cadastrado (inclusive com outra caixa) → `409 CONFLICT`.
- **AC-405** — Login com credenciais corretas → `200` com novo token.
- **AC-406** — Senha errada ou e-mail inexistente → `401 UNAUTHORIZED` com a
  mesma mensagem nos dois casos.
- **AC-407** — Rota protegida sem token, com token adulterado ou expirado →
  `401 UNAUTHORIZED`.
- **AC-408** — `GET /api/me` devolve o usuário do token.
- **AC-409** — O usuário B não lista, lê, altera nem exclui dados do usuário A
  (para B eles "não existem": `404`), e o dashboard de B não soma dados de A.
- **AC-410** — Criar transação apontando para categoria de outro usuário →
  `422 BUSINESS_RULE_VIOLATION`.
- **AC-411** — Excedido o limite de tentativas de login/cadastro → `429 RATE_LIMITED`.
- **AC-412** — O hash armazenado verifica a senha correta, rejeita a errada e
  muda a cada cadastro (salt).
- **AC-413** — Cadastro sem token do Turnstile ou com token recusado →
  `403 HUMAN_VERIFICATION_FAILED`, e nenhuma conta é criada.
- **AC-414** — Cadastro com token válido segue normalmente; o servidor confere
  a ação `register` e repassa o IP de quem pediu. O login não pede token.

## Fora de escopo
- Recuperação de senha por e-mail.
- Login social (Google/GitHub).
- Exclusão de conta.
