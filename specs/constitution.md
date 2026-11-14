# Constituição do projeto

Princípios que valem para todas as features. Um plano que viole algum deles
precisa justificar a exceção por escrito no próprio `plan.md`.

## I. Spec primeiro

Nenhum comportamento é implementado sem um critério de aceite (`AC-xx`) que o
descreva. Bugs viram um AC novo antes de virarem código.

## II. Regra de dependência (Clean Architecture)

As dependências apontam sempre para dentro:

```
presentation ─► application ─► domain
infrastructure ─► application ─► domain
```

- `domain` não importa nada de fora dele (nem Hono, nem D1, nem Zod).
- `application` conhece apenas o domínio e **portas** (interfaces) que ela
  própria define.
- `infrastructure` implementa as portas (D1, relógio, gerador de IDs).
- `presentation` traduz HTTP ⇄ casos de uso. Não contém regra de negócio.
- A composição acontece em um único lugar: `apps/api/src/main/container.ts`.

## III. Invariantes no domínio

Entidades nunca existem em estado inválido. Validação de formato (tipo, campo
obrigatório) acontece na borda com Zod; validação de **regra de negócio**
acontece no domínio. A duplicação é intencional: a borda protege o transporte,
o domínio protege o modelo.

## IV. Dinheiro é inteiro

Valores monetários são sempre centavos inteiros (`amountCents`). Nunca `float`.

## V. Contratos compartilhados

O formato de entrada e saída da API vive em `packages/contracts` e é usado
pelo Worker e pelo front. Mudou o contrato, os dois quebram na compilação.

## VI. Testes

- Domínio e casos de uso: testes unitários com repositórios em memória.
- HTTP: testes que sobem o app Hono com dependências falsas.
- Todo teste referencia um AC.

## VII. Clean Code

- Nomes revelam intenção; sem abreviações obscuras.
- Funções pequenas, um nível de abstração por função.
- Um caso de uso por arquivo, com um único método público `execute`.
- Erros de domínio são tipados (`ValidationError`, `NotFoundError`,
  `ConflictError`, `BusinessRuleError`) e mapeados para HTTP em um só lugar.
