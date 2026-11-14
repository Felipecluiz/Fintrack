# 001 — Categorias

## Contexto

Para entender para onde vai o dinheiro, cada transação precisa de uma
categoria. Categorias são de **receita** ou de **despesa**, e esse tipo
restringe quais transações podem usá-las.

## Histórias de usuário

- **US-101** — Como usuário, quero cadastrar categorias de receita e despesa
  para organizar minhas transações.
- **US-102** — Como usuário, quero renomear uma categoria sem perder o
  histórico das transações ligadas a ela.
- **US-103** — Como usuário, quero excluir categorias que não uso mais, sem
  correr o risco de deixar transações órfãs.

## Regras de negócio

- **BR-101** — O nome é obrigatório, tem espaços das pontas removidos e
  espaços internos repetidos colapsados; máximo de 50 caracteres.
- **BR-102** — O nome é único por tipo, sem diferenciar maiúsculas de
  minúsculas ("Mercado" e "mercado" são o mesmo nome).
- **BR-103** — O tipo (`income` ou `expense`) é definido na criação e não muda.
- **BR-104** — Uma categoria com transações não pode ser excluída.

## Critérios de aceite

- **AC-101** — Dado um nome válido e um tipo, quando crio a categoria, então
  recebo `201` com `id`, `name` normalizado, `type` e `createdAt`.
- **AC-102** — Dado um nome vazio ou só com espaços, quando crio, então recebo
  `400 VALIDATION_ERROR`.
- **AC-103** — Dado um nome com mais de 50 caracteres, quando crio, então
  recebo `400 VALIDATION_ERROR`.
- **AC-104** — Dado que existe "Mercado" do tipo despesa, quando crio
  "mercado" do tipo despesa, então recebo `409 CONFLICT`.
- **AC-105** — Dado que existe "Bônus" do tipo despesa, quando crio "Bônus"
  do tipo receita, então a criação é aceita.
- **AC-106** — Quando listo categorias, então recebo todas, ordenadas por tipo
  e depois por nome.
- **AC-107** — Quando renomeio uma categoria, então recebo `200` com o novo
  nome; se o nome já existe em outra categoria do mesmo tipo, recebo
  `409 CONFLICT`.
- **AC-108** — Dado um id inexistente, quando renomeio ou excluo, então recebo
  `404 NOT_FOUND`.
- **AC-109** — Dada uma categoria sem transações, quando excluo, então recebo
  `204`.
- **AC-110** — Dada uma categoria com transações, quando excluo, então recebo
  `422 BUSINESS_RULE_VIOLATION` e nada é removido.

## Fora de escopo

- Subcategorias.
- Cor/ícone escolhidos pelo usuário (o dashboard usa paleta fixa).
- Multiusuário (ver "Próximos passos" no README).
