---
name: spec-squad
description: Squad 0 Spec — Spec Kit specify/plan/tasks. Use when opening a new feature, clarifying requirements, or writing specs/plan/tasks before code.
---

# Squad Spec (0)

## Missão

Produzir artefatos SDD alinhados à constitution **antes** de qualquer implementação.

## Ordem

1. Ler `memory.md` → `docs/agents.md` → constitution → baseline
2. SK-02 specify → `specs/NNN-slug/spec.md`
3. SK-03 clarify se ambíguo
4. SK-04 plan → `plan.md`
5. SK-05 tasks → `tasks.md` (P0–P2)
6. SK-07 checklist

## Entradas

- Nome/número da feature
- Contexto do usuário
- Templates em `.specify/templates/`

## Saídas

- `spec.md` com critérios de aceite checáveis
- `plan.md` com fases e gate
- `tasks.md` com IDs

## Proibido

- Escrever código de produção nesta squad
- Ignorar tenant-first / n8n-boundary / Chatwoot-only channels
- Avançar Build sem spec aprovada (status da spec)
