---
name: build-squad
description: Squad 1 Build — implement exactly one Spec Kit task with TDD and stop. Use when a task is READY in tasks.md.
---

# Squad Build (1)

## Missão

Implementar **uma** task (ou bloco P0 atômico) com TDD e parar para QA.

## Ordem

1. Confirmar task READY em `tasks.md` e escopo no `plan.md`
2. Papéis C-\* relevantes em `agentes.md`
3. Vermelho → verde → refactor (backend/workers/AI/FE)
4. Sem marcar `[x]` até R-90 (QA)

## Entradas

- ID da task (ex. R-30, T-12)
- Spec + plan da feature

## Saídas

- Diff mínimo focado na task
- Testes no bounded context tocado
- Docs só se API/evento/porta mudou

## Proibido

- Implementar a Spec inteira de uma vez
- `eslint-disable` / `@ts-ignore` sem ADR
- Acesso DB direto de AI/n8n
- Commit sem pedido explícito do usuário
