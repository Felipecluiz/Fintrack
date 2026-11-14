# Specs — Spec-Driven Development

Neste projeto **a especificação é a fonte da verdade**. Código e testes derivam
dela, nunca o contrário. Toda mudança de comportamento começa aqui.

## Fluxo

```
constitution.md ──► spec.md ──► plan.md ──► tasks.md ──► código + testes
 (princípios)      (o quê/por quê) (como)   (passos)      (rastreáveis por AC)
```

1. **Spec** (`features/NNN-nome/spec.md`) — histórias de usuário, regras de
   negócio (`BR-xx`) e critérios de aceite (`AC-xx`) no formato Dado/Quando/Então.
   Não fala de tecnologia.
2. **Plan** (`plan.md`) — decisões técnicas: em qual camada cada regra vive,
   contratos de API, esquema de banco, riscos.
3. **Tasks** (`tasks.md`) — lista ordenada e verificável de passos de
   implementação. Cada task referencia os ACs que satisfaz.
4. **Implementação** — testes primeiro. Cada teste cita o AC no nome
   (ex.: `it('AC-03: rejeita valor zero ou negativo')`), o que garante
   rastreabilidade spec → teste → código.

## Rastreabilidade

```bash
# Quais ACs da feature 002 têm teste?
grep -rhoE "AC-2[0-9]{2}" apps/api/test | sort -u
```

Um AC sem teste é uma tarefa pendente. Um teste sem AC é um sinal de que a
spec ficou desatualizada.

## Features

| ID  | Feature                                         | Status       |
| --- | ----------------------------------------------- | ------------ |
| 001 | [Categorias](features/001-categories/spec.md)   | Implementada |
| 002 | [Transações](features/002-transactions/spec.md) | Implementada |
| 003 | [Dashboard](features/003-dashboard/spec.md)     | Implementada |

## Criando uma nova feature

```bash
cp -r specs/features/_template specs/features/004-minha-feature
```

Preencha `spec.md`, revise, só então escreva `plan.md` e `tasks.md`.
