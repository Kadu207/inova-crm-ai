# Harness — Inova CRM AI

**Status:** ativo (2026-08-03)  
Índice do ciclo Spec Kit + squads Cursor.

## Artefatos

| Camada            | Path                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------- |
| Memória viva      | [`memory.md`](../memory.md)                                                             |
| Catálogo agentes  | [`agents.md`](./agents.md)                                                              |
| Front door Cursor | [`AGENTS.md`](../AGENTS.md)                                                             |
| Constitution      | [`.specify/memory/constitution.md`](../.specify/memory/constitution.md)                 |
| Baseline          | [`.specify/memory/baseline.md`](../.specify/memory/baseline.md)                         |
| Rule always-on    | [`.cursor/rules/inova-crm-harness.mdc`](../.cursor/rules/inova-crm-harness.mdc)         |
| Squads            | [`.cursor/agents/`](../.cursor/agents/)                                                 |
| Skills Spec Kit   | [`.cursor/skills/speckit-*/`](../.cursor/skills/)                                       |
| Workflow          | [`.specify/workflows/speckit/workflow.yml`](../.specify/workflows/speckit/workflow.yml) |

## Ciclo (resumo)

```text
memory → docs/agents.md → AGENTS → constitution → baseline
  → Spec Kit (SK-*) → Build (C-*) → QA (R-90 gate) → Delivery (EMB-*)
  → atualizar memory + baseline
```

Detalhe copiável: seção 2 de [`agents.md`](./agents.md).

## Ops ligados ao harness

- Chatwoot PID / Swarm: [`operations/vps-chatwoot-instances.md`](./operations/vps-chatwoot-instances.md)
- Swarm vxlan → 1/1: [`operations/swarm-vxlan-chatwoot-fix.md`](./operations/swarm-vxlan-chatwoot-fix.md)
- SSH VPS (`:65022`): [`operations/vps-ssh.md`](./operations/vps-ssh.md)
- Ops abertos: [`operations/ops-open-items-2026-08-18.md`](./operations/ops-open-items-2026-08-18.md)
- CI images: [`operations/ci-docker-images.md`](./operations/ci-docker-images.md)
- Quality Gate: [`operations/quality-gate.md`](./operations/quality-gate.md)

## Runtime AI (produto)

Não confundir com harness Cursor. Agentes de qualificação/RAG: [`agentes-ia.md`](./agentes-ia.md).
