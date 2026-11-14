# Guia para quem (humano ou IA) vai mexer no código

Este repositório segue **Spec-Driven Development**. Antes de escrever código:

1. Leia `specs/constitution.md`.
2. Ache a feature em `specs/features/`. Se o comportamento não está descrito
   lá, **atualize a spec primeiro** (novo `AC-xxx`), depois o `plan.md` e o
   `tasks.md`.
3. Escreva o teste citando o AC no nome: `it('AC-212: ...')`.
4. Implemente respeitando as camadas:
   - regra de negócio → `apps/api/src/domain`
   - orquestração → `apps/api/src/application` (um caso de uso por arquivo)
   - banco/sistema → `apps/api/src/infrastructure`
   - HTTP → `apps/api/src/presentation`
   - composição → `apps/api/src/main/container.ts`
5. Mudou o formato da API? Altere `packages/contracts` — front e back quebram
   juntos na compilação, e isso é proposital.
6. Rode `npm run check` antes de abrir o PR.

O ESLint bloqueia imports que violam a regra de dependência
(ex.: `domain` importando `hono` ou `infrastructure`).
