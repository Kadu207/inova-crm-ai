# Harness — Inova CRM AI

**Status:** ativo (2026-08-03)  
Índice do ciclo Spec Kit + squads Cursor.

## Artefatos

| Camada            | Path                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------- |
| Memória viva      | [`memory.md`](../memory.md)                                                             |
| Catálogo agentes  | [`agentes.md`](../agentes.md)                                                           |
| Front door Cursor | [`AGENTS.md`](../AGENTS.md)                                                             |
| Constitution      | [`.specify/memory/constitution.md`](../.specify/memory/constitution.md)                 |
| Baseline          | [`.specify/memory/baseline.md`](../.specify/memory/baseline.md)                         |
| Rule always-on    | [`.cursor/rules/inova-crm-harness.mdc`](../.cursor/rules/inova-crm-harness.mdc)         |
| Squads            | [`.cursor/agents/`](../.cursor/agents/)                                                 |
| Skills Spec Kit   | [`.cursor/skills/speckit-*/`](../.cursor/skills/)                                       |
| Workflow          | [`.specify/workflows/speckit/workflow.yml`](../.specify/workflows/speckit/workflow.yml) |

## Ciclo (resumo)

```text
memory → agentes → AGENTS → constitution → baseline
  → Spec Kit (SK-*) → Build (C-*) → QA (R-90 gate) → Delivery (EMB-*)
  → atualizar memory + baseline
```

Detalhe copiável: seção 2 de [`agentes.md`](../agentes.md).

## Ops ligados ao harness

- Chatwoot PID / Swarm: [`operations/vps-chatwoot-instances.md`](./operations/vps-chatwoot-instances.md)
- CI images: [`operations/ci-docker-images.md`](./operations/ci-docker-images.md)
- Quality Gate: [`operations/quality-gate.md`](./operations/quality-gate.md)

## Runtime AI (produto)

Não confundir com harness Cursor. Agentes de qualificação/RAG: [`agentes-ia.md`](./agentes-ia.md).
