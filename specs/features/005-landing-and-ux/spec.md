# 005 — Página inicial e experiência de uso

## Contexto
Quem chega pelo link precisa entender a proposta **antes** de criar conta, e
quem usa o app precisa de uma interface confortável no desktop e no celular.

## Histórias de usuário
- **US-501** — Como visitante, quero ver como o app funciona com dados de
  exemplo, sem precisar me cadastrar.
- **US-502** — Como visitante, quero testar o app de verdade com uma conta demo.
- **US-503** — Como usuário, quero usar o app no celular e escolher tema claro
  ou escuro.

## Critérios de aceite
- **AC-501** (UI) — `/` é pública e mostra a proposta, um dashboard com dados
  fictícios (identificados como tal) e chamadas para criar conta ou entrar.
- **AC-502** (UI) — O botão "Testar com conta demo" entra direto no app com a
  conta de demonstração.
- **AC-503** (UI) — O app fica em `/app`; sem sessão, qualquer rota de `/app`
  leva para `/login` e, após entrar, volta para onde o usuário estava.
- **AC-504** (UI) — Sessão expirada ou inválida (401) desloga e leva ao login.
- **AC-505** (UI) — O tema alterna entre sistema, claro e escuro, e a escolha
  persiste entre visitas.
- **AC-506** (UI) — Ações de salvar/excluir confirmam com uma notificação
  (toast) anunciada a leitores de tela.
- **AC-507** (UI) — O dashboard mostra placeholders (skeleton) enquanto carrega.
- **AC-508** (UI) — Abaixo de 640 px, a tabela de transações vira uma lista de
  cartões legível.
- **AC-509** (UI) — O Pages envia cabeçalhos de segurança (CSP, nosniff,
  frame-ancestors).

## Fora de escopo
- Internacionalização (o app é só em português).
