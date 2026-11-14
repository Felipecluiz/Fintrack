# 002 — Plano técnico

## Onde cada regra vive

| Regra  | Camada      | Arquivo                                                                           |
| ------ | ----------- | --------------------------------------------------------------------------------- |
| BR-201 | domain      | `domain/shared/Money.ts` + `Transaction.assertPositive`                           |
| BR-202 | domain      | `Transaction.normalizeDescription`                                                |
| BR-203 | domain      | `domain/shared/CalendarDate.ts`                                                   |
| BR-204 | domain      | `Transaction.assertCategoryAccepts` (a entidade recebe a `Category`, não só o id) |
| BR-205 | application | `CreateTransaction` / `UpdateTransaction` (`CategoryRepository.findById`)         |

## Contrato de API

| Método | Rota                    | Entrada                  | Saída                       | Erros         |
| ------ | ----------------------- | ------------------------ | --------------------------- | ------------- |
| GET    | `/api/transactions`     | `ListTransactionsQuery`  | `Paginated<TransactionDTO>` | 400           |
| GET    | `/api/transactions/:id` | —                        | `TransactionDTO`            | 404           |
| POST   | `/api/transactions`     | `CreateTransactionInput` | `TransactionDTO` 201        | 400, 422      |
| PATCH  | `/api/transactions/:id` | `UpdateTransactionInput` | `TransactionDTO`            | 400, 404, 422 |
| DELETE | `/api/transactions/:id` | —                        | 204                         | 404           |

## Banco de dados

Tabela `transactions` em `0001_init.sql`, com `CHECK (amount_cents > 0)`,
`FOREIGN KEY ... ON DELETE RESTRICT` e índices em `occurred_on` e
`category_id`.

## Decisões

- **Por que categoria inexistente é 422 e não 404?** O recurso da URL
  (a transação) existe ou está sendo criado; o problema está numa referência
  dentro do corpo. 404 fica reservado para "a URL não aponta para nada".
- **Paginação por offset.** Simples e suficiente para o volume de uma pessoa.
  Cursor só se a listagem passar de dezenas de milhares de linhas.
