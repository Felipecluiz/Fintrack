# 001 — Plano técnico

## Onde cada regra vive

| Regra  | Camada      | Arquivo                                                                                                   |
| ------ | ----------- | --------------------------------------------------------------------------------------------------------- |
| BR-101 | domain      | `domain/category/Category.ts` (`normalizeName`)                                                           |
| BR-102 | application | `CreateCategory`, `RenameCategory` (consulta `findByName`) + índice único no banco como rede de segurança |
| BR-103 | domain      | `Category` não expõe método para trocar o tipo                                                            |
| BR-104 | application | `DeleteCategory` (consulta `TransactionRepository.countByCategory`) + `ON DELETE RESTRICT` no banco       |

## Contrato de API

| Método | Rota                  | Entrada               | Saída             | Erros         |
| ------ | --------------------- | --------------------- | ----------------- | ------------- |
| GET    | `/api/categories`     | —                     | `CategoryDTO[]`   | —             |
| POST   | `/api/categories`     | `CreateCategoryInput` | `CategoryDTO` 201 | 400, 409      |
| PATCH  | `/api/categories/:id` | `UpdateCategoryInput` | `CategoryDTO`     | 400, 404, 409 |
| DELETE | `/api/categories/:id` | —                     | 204               | 404, 422      |

Schemas em `packages/contracts/src/category.ts`.

## Banco de dados

`migrations/0001_init.sql` — tabela `categories` e índice único
`(name COLLATE NOCASE, type)`.

## Decisões

- **Unicidade checada em dois lugares.** O caso de uso dá uma mensagem de erro
  clara; o índice único garante consistência em caso de concorrência.
- **IDs gerados pela aplicação** (UUID v4 via porta `IdGenerator`), o que
  mantém o domínio testável e independente do banco.
