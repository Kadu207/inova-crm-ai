# Roadmap de Desenvolvimento — Inova CRM AI

**Volume:** 16  
**Versão:** 1.2  
**Status:** Fases 0–7 **DONE** · Pós-fase ativa = Spec **026** (Zoho) → **027** (Meta/WABA)  
**Baseline:** [`.specify/memory/baseline.md`](../.specify/memory/baseline.md)  
**Histórico:** [historico-versoes.md](./historico-versoes.md)

---

## Propósito

Cronograma sequencial de fases, entregáveis, critérios de aceite e fila pós-fase (produto contínuo via Spec Kit).

---

## Sumário

1. [Visão das fases](#visão-das-fases)
2. [Fases 0–7 — concluídas](#fases-07--concluídas)
3. [Pós-fase — produto contínuo](#pós-fase--produto-contínuo)
4. [Quality Gate](#quality-gate)

---

## Visão das fases

| Fase | Nome           | Gate para avançar               | Status |
| ---- | -------------- | ------------------------------- | ------ |
| 0    | Fundação       | Docs + Spec Kit + constitution  | DONE   |
| 1    | Infraestrutura | Compose healthy + check-ports   | DONE   |
| 2    | Chatwoot       | Webhook → API smoke             | DONE   |
| 3    | n8n            | Workflow orquestração smoke     | DONE   |
| 4    | CRM MVP        | Leads + funil + tenant E2E      | DONE   |
| 5    | Financeiro     | Faturamento + eventos invoice.* | DONE   |
| 6    | IA             | Qualificação + RAG smoke        | DONE   |
| 7    | SaaS produção  | Deploy + backup drill + gate    | DONE   |

Não há Fase 8 numerada. Após a Fase 7, o trabalho continua em **Specs Spec Kit** (`008+` histórico; agora `026+`).

---

## Fases 0–7 — concluídas

### Fase 0 — Fundação

Spec Kit, constitution, regras Cursor, docs skeleton, ADRs, design tokens, mapa de portas.

### Fase 1 — Infraestrutura

Postgres, Redis, RabbitMQ, MinIO, rede Docker, `.env.example`, quality-gate script.

### Fase 2 — Chatwoot

Instância dedicada, tunnel, webhooks assinados. WhatsApp transitório via Evolution (ADR 005) até Meta/WABA.

### Fase 3 — n8n

Main + worker + Redis queue, workflows orquestração only.

### Fase 4 — CRM MVP

NestJS + Next.js, Prisma tenant-first, módulos core, OpenAPI (Spec `004-crm-mvp` + onda Ember/CRUD `008–018`).

### Fase 5 — Financeiro

Propostas, contratos, cobrança, `invoice.*` events (Spec `005-financeiro`).

### Fase 6 — IA

FastAPI, worker-crm-ai, agentes, RAG por tenant.

### Fase 7 — SaaS e produção

Deploy Hetzner, backups, observabilidade, hardening LGPD, Admin SaaS, CI docker images → `docker load` na VPS.

---

## Pós-fase — produto contínuo

### Onda já entregue (paridade Zoho 1)

| Spec | Entrega                                       |
| ---- | --------------------------------------------- |
| 019  | Nest ScheduleModule (cron SLA + LGPD)         |
| 020  | Campos de sistema (createdBy/updatedBy/owner) |
| 021  | Related lists API + UI                        |
| 022  | Webhooks outbound HMAC                        |
| 023  | Filtros e paginação de listas                 |
| 024  | Bulk export/import (+ MinIO)                  |
| 025  | Custom fields JSONB                           |

### Fila ativa

| Ordem | Spec    | Entrega                                                                    | Status                                                      |
| ----- | ------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1     | **026** | Zoho Blueprint light + filtros avançados + COQL (read-only, tenant-scoped) | **DONE** (v1.1.0)                                           |
| 2     | **027** | Meta Cloud API — cutover WhatsApp oficial (WABA)                           | QUEUED · **BLOCKED** até App Meta / Phone Number ID / token |

Premissa Zoho: **não** clonar Zoho (Deluge completo, Multi-DC, OAuth apps marketplace). Usar referência pública como checklist e entregar valor comercial no Inova.

Premissa Meta: Evolution permanece operacional até cutover; CRM continua vendo `source=CHATWOOT`. Ver [`docs/chatwoot-whatsapp-setup.md`](./chatwoot-whatsapp-setup.md).

---

## Quality Gate

Nenhuma Spec marca DONE sem `GATE_PASS`. Baseline atualizada em `.specify/memory/baseline.md` **somente** após PASS.

Ver também [Plano Mestre](../Plano_Mestre_Inova_CRM_AI.md) · [operations/quality-gate.md](./operations/quality-gate.md).
