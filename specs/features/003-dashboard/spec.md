# 003 — Dashboard

## Contexto

O usuário precisa de uma visão rápida da saúde financeira: quanto entrou,
quanto saiu, para onde foi e como isso evolui mês a mês.

## Histórias de usuário

- **US-301** — Como usuário, quero ver total de receitas, despesas e saldo de
  um período.
- **US-302** — Como usuário, quero ver em quais categorias mais gasto.
- **US-303** — Como usuário, quero comparar receitas e despesas mês a mês.

## Regras de negócio

- **BR-301** — O período é inclusivo `[from, to]`. Sem parâmetros, o padrão é
  os últimos 6 meses: do 1º dia de 5 meses atrás até o último dia do mês atual.
- **BR-302** — `from` precisa ser menor ou igual a `to`.
- **BR-303** — Saldo = receitas − despesas (pode ser negativo).
- **BR-304** — A série mensal traz **todos** os meses do período, com zero onde
  não houve movimento.
- **BR-305** — O ranking por categoria considera só despesas, em ordem
  decrescente de valor.
- **BR-306** — O período máximo é de 24 meses.

## Critérios de aceite

- **AC-301** — Dadas receitas de 5.000,00 e despesas de 1.200,00 no período,
  então os totais são `incomeCents=500000`, `expenseCents=120000`,
  `balanceCents=380000`.
- **AC-302** — Dadas despesas maiores que receitas, então o saldo é negativo.
- **AC-303** — Dado um período de jan a mar sem transações em fevereiro, então
  a série tem 3 meses e fevereiro aparece zerado.
- **AC-304** — O ranking por categoria só contém despesas e vem ordenado do
  maior para o menor valor.
- **AC-305** — `from` depois de `to` → `400 VALIDATION_ERROR`.
- **AC-306** — Sem parâmetros, o período retornado cobre 6 meses terminando no
  mês atual.
- **AC-307** — Período maior que 24 meses → `400 VALIDATION_ERROR`.
- **AC-308** (UI) — O dashboard mostra os três totais em reais, um gráfico de
  barras mensal (receita × despesa, com legenda e tooltip) e o ranking de
  categorias.
- **AC-309** (UI) — O usuário escolhe o período entre 3, 6 e 12 meses.

## Fora de escopo

- Metas e orçamento por categoria.
- Exportação do dashboard.
