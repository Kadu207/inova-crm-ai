# Histórico de versões — Inova CRM AI

**Produto:** Inova CRM AI  
**Versão atual do sistema:** **1.1.1** (2026-08-03)  
**Plano Mestre:** 1.2  
**Fonte de verdade operacional:** [`.specify/memory/baseline.md`](../.specify/memory/baseline.md)

Convenção SemVer do produto:

| Parte     | Significado                                                      |
| --------- | ---------------------------------------------------------------- |
| **MAJOR** | Corte de plataforma (ex.: Fases 0–7 fechadas + produção estável) |
| **MINOR** | Onda Spec Kit / capacidade comercial relevante                   |
| **PATCH** | Fix, docs, ops, hardening sem feature nova                       |

---

## Linha do tempo (resumo)

```
2026-07-14  v0.1.x  Fundação + ADRs + Plano Mestre 1.1
     │
     ├─ Fases 1–3   Infra · Chatwoot · n8n
     ├─ Fases 4–6   CRM MVP · Financeiro · IA
     ├─ Fase 7      SaaS / deploy / backup
     │
2026-07-20  v0.9.x  Atendimento + Evolution WhatsApp (Meta BLOCKED)
     │
2026-07-23  v0.9→1  Specs 019–025 (paridade Zoho onda 1)
     │
2026-07-26  v1.0.0  CI images + swap + Gate PASS · baseline alinhada
     │
2026-07-26  v1.1.0  Spec 026 Zoho Blueprint/COQL
2026-08-03  v1.1.1  Spec 028 Relatórios comerciais   ← ATUAL
depois      v1.2.0  Spec 027 Meta Cloud API (WABA) ← FILA (BLOCKED)
```

---

## Changelog

### [1.1.1] — 2026-08-03 — Spec 028 Relatórios comerciais / funil

- API `GET /api/v1/reports/{pipeline,lead-conversion,revenue,sla}` + export CSV
- UI `/relatorios` com período, 4 cards e download CSV
- Docs: `docs/architecture/spec-028-commercial-reports.md`, OpenAPI módulos
- Gate PASS: `reports/quality-gate/2026-08-03T01-57-06-714Z.md`
- Nota: 1.1.1 (patch) enquanto Spec 027 Meta reserva **1.2.0**

### [1.1.0] — 2026-07-26 — Spec 026 Zoho Blueprint / filtros / COQL

- Blueprint light (`blueprint_transitions`) opt-in no move de oportunidades
- FilterEngine + `POST /leads|contacts|opportunities/search`
- COQL read-only `POST /coql/query` (AST → Prisma, sem SQL livre)
- UI: Configurações Blueprint + painel filtro avançado (Leads/Oportunidades)
- Docs: `docs/architecture/spec-026-query-blueprint.md`, RN-OPP-BP-01

### [1.0.0] — 2026-07-26 — Release de plataforma

**Status:** atual · Gate PASS (`reports/quality-gate/2026-07-26T02-01-09-701Z-ci-images-swap.md`)

- Fases **0–7 + Delivery** encerradas (não há Fase 8 numerada).
- Deploy API/FE via GitHub Actions → artifact → `load-ci-images-vps.sh` (sem build na VPS).
- Swap `/swapfile-inova` (4G) ativo.
- Produto Specs **019–025** + Admin SaaS + Bulk UI + RAM guard — DONE.
- Plano Mestre / roadmap / README alinhados ao baseline (v1.2 docs).

### [0.9.0] — 2026-07-20 … 2026-07-24 — Atendimento, ops e paridade Zoho 1

| Spec / entrega | Resumo                                        |
| -------------- | --------------------------------------------- |
| 006            | Atendimento CRM (conversas enriquecidas, SLA) |
| 007            | Ops hardening (backup, Meta BLOCKED docs)     |
| 008–009        | Ember Studio rollout                          |
| 010            | Lead detail + funil DnD                       |
| 011            | Dashboard activity                            |
| 012            | Empresas / contatos create                    |
| 013            | CodeRabbit + security layers                  |
| 014            | Catálogo produtos/serviços/tarefas create     |
| 015            | Entity edit PATCH                             |
| 016            | Oportunidades CRUD                            |
| 017            | Delete confirm                                |
| 018            | Soft-delete + LGPD purge                      |
| **019**        | Nest cron nativo (SLA + LGPD)                 |
| **020**        | Campos de sistema (createdBy/updatedBy/owner) |
| **021**        | Related lists                                 |
| **022**        | Webhooks outbound HMAC                        |
| **023**        | Filtros / paginação                           |
| **024**        | Bulk export/import                            |
| **025**        | Custom fields JSONB                           |
| ADR 005        | WhatsApp Evolution transitório                |

### [0.8.0] — Fase 7 — SaaS e produção

Deploy Hetzner, Cloudflare Tunnel, backups, runbooks, multi-tenant SaaS packing, observabilidade base.

### [0.7.0] — Fase 6 — IA

FastAPI (`ai-services`), agentes (qualifier, summarizer, followup, SLA alerts), RAG stub por tenant, toolbelt Nest.

### [0.6.0] — Fase 5 — Financeiro

Propostas, contratos, cobrança, eventos `invoice.*` (Spec `005-financeiro`).

### [0.5.0] — Fase 4 — CRM MVP

NestJS + Prisma tenant-first + RLS, Next.js módulos core, OpenAPI, workers RabbitMQ (Spec `004-crm-mvp`).

### [0.4.0] — Fase 3 — n8n

Instância dedicada, fila Redis, workflows orquestração → API (boundary ADR 003).

### [0.3.0] — Fase 2 — Chatwoot

Instância dedicada `chat-crm`, webhooks HMAC, mapeamento account ↔ tenant.

### [0.2.0] — Fase 1 — Infraestrutura

Docker Compose: PostgreSQL, Redis, RabbitMQ, MinIO, scripts `check-ports` / quality-gate, bloco **9400–9419**.

### [0.1.0] — 2026-07-14 — Fase 0 — Fundação

Spec Kit (`.specify/`), constitution, regras Cursor, ADRs 001–004, docs corporativos skeleton, Plano Mestre **1.1**, design tokens Inova.

---

## Próximas versões (planejado)

### [1.1.0] — Spec 026 — Zoho Blueprint / filtros avançados / COQL

**DONE** — ver changelog acima.

### [1.2.0] — Spec 027 — Meta Cloud API (WABA)

- Cutover Evolution → WhatsApp Oficial no Chatwoot.
- **Pré-requisito:** credenciais WABA (App Meta, Phone Number ID, token).
- Ver [`specs/027-meta-cloud-api-waba/`](../specs/027-meta-cloud-api-waba/).

---

## Referências

- [Plano Mestre](../Plano_Mestre_Inova_CRM_AI.md)
- [Roadmap](./roadmap.md)
- [Baseline](../.specify/memory/baseline.md)
- [CI docker images](./operations/ci-docker-images.md)
- [WhatsApp setup](./chatwoot-whatsapp-setup.md)
