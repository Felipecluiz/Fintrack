# 003 — Plano técnico

## Onde cada regra vive

| Regra  | Camada         | Arquivo                                                   |
| ------ | -------------- | --------------------------------------------------------- |
| BR-301 | application    | `GetDashboardSummary.resolvePeriod` (usa a porta `Clock`) |
| BR-302 | application    | `GetDashboardSummary.resolvePeriod`                       |
| BR-303 | application    | `GetDashboardSummary`                                     |
| BR-304 | application    | `application/dashboard/months.ts` (`monthsBetween`)       |
| BR-305 | infrastructure | `D1ReportReader.expensesByCategory` (`ORDER BY`)          |
| BR-306 | application    | `GetDashboardSummary.resolvePeriod`                       |

## Por que uma porta de leitura separada (`ReportReader`)?

Agregações devem rodar no banco (`SUM ... GROUP BY`), não carregando todas as
transações no Worker. Em vez de inflar o `TransactionRepository` (que serve ao
modelo de escrita), o dashboard tem uma porta própria de leitura — um CQRS
leve. O caso de uso continua testável com um `InMemoryReportReader`.

## Contrato de API

| Método | Rota                     | Entrada                   | Saída                 | Erros |
| ------ | ------------------------ | ------------------------- | --------------------- | ----- |
| GET    | `/api/dashboard/summary` | `?from=YYYY-MM-DD&to=...` | `DashboardSummaryDTO` | 400   |

## Front

- Três "stat tiles" (receitas, despesas, saldo).
- Barras agrupadas por mês: receita (azul) × despesa (laranja), legenda
  sempre visível, tooltip no hover, uma única escala Y.
- Ranking de categorias em barras horizontais de uma única cor (é magnitude,
  não identidade), com o valor escrito ao lado de cada barra.
- Gráficos em SVG puro, sem biblioteca, para manter o bundle pequeno.
