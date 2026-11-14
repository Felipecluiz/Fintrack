# 002 — Transações

## Contexto

A transação é o registro central do sistema: uma entrada ou saída de dinheiro
em uma data, ligada a uma categoria.

## Histórias de usuário

- **US-201** — Como usuário, quero registrar receitas e despesas com valor,
  data, descrição e categoria.
- **US-202** — Como usuário, quero listar e filtrar minhas transações por
  período, tipo e categoria.
- **US-203** — Como usuário, quero corrigir ou excluir uma transação lançada
  errado.

## Regras de negócio

- **BR-201** — O valor é um inteiro positivo em centavos. O sinal é dado pelo
  tipo (`income` soma, `expense` subtrai), nunca pelo valor.
- **BR-202** — A descrição é obrigatória, com no máximo 120 caracteres.
- **BR-203** — A data (`occurredOn`) é uma data de calendário válida no
  formato `YYYY-MM-DD`.
- **BR-204** — O tipo da transação precisa ser igual ao tipo da categoria.
- **BR-205** — A categoria precisa existir.

## Critérios de aceite

- **AC-201** — Dados válidos → `201` com a transação criada.
- **AC-202** — Valor zero ou negativo → `400 VALIDATION_ERROR`.
- **AC-203** — Data inexistente (ex.: `2026-02-30`) → `400 VALIDATION_ERROR`.
- **AC-204** — Transação `income` em categoria `expense` (ou vice-versa) →
  `422 BUSINESS_RULE_VIOLATION`.
- **AC-205** — Categoria inexistente → `422 BUSINESS_RULE_VIOLATION`.
- **AC-206** — A listagem é paginada (`page`, `pageSize` até 100), ordenada da
  data mais recente para a mais antiga, e informa `total`.
- **AC-207** — A listagem aceita os filtros `from`, `to` (inclusivos), `type`
  e `categoryId`, combináveis.
- **AC-208** — Buscar por id existente → `200`; inexistente → `404 NOT_FOUND`.
- **AC-209** — A atualização é parcial. Mudar o tipo sem informar uma categoria
  compatível → `422 BUSINESS_RULE_VIOLATION`.
- **AC-210** — Excluir existente → `204`; inexistente → `404 NOT_FOUND`.
- **AC-211** — Atualização com corpo vazio → `400 VALIDATION_ERROR`.

## Fora de escopo

- Transações recorrentes e parceladas.
- Múltiplas moedas (tudo em BRL).
- Importação de extrato (OFX/CSV).
