# Baseline — Inova CRM AI

**Última atualização:** 2026-07-20  
**Quality Gate:** ver `npm run gate` (lefthook pre-push)

## Estado por fase

| Fase     | Escopo                                                                          | Status                 |
| -------- | ------------------------------------------------------------------------------- | ---------------------- |
| 0        | Spec Kit, constitution, docs, ADRs, ports, events, design prompts, gate scripts | DONE                   |
| 1        | Docker Compose Postgres/Redis/RabbitMQ/MinIO, check-ports, env, VPS override    | DONE                   |
| 2        | Chatwoot dedicado (`chatwoot/`), tunnel `chat-crm`, webhooks HMAC               | DONE                   |
| 3        | n8n main+worker no compose, workflows orquestração                              | DONE                   |
| 4        | NestJS/Prisma tenant-aware, workers leads/pipeline, Next.js módulos, E2E smoke  | DONE                   |
| 5        | Propostas, Contratos, Financeiro, Cobrança, worker billing                      | DONE                   |
| 6        | FastAPI RAG/agentes, worker AI, toolbelt, guardrails                            | DONE                   |
| 7        | SaaS packing docs, admin UI stub, runbook, escala notes                         | DONE                   |
| QA       | Quality Gate unificado + CI + lefthook + waivers                                | DONE (hard-stop ativo) |
| Delivery | VPS `/opt/inova-crm-ai`, Tunnel hosts CRM/API/Chatwoot/n8n                      | DONE (ops contínuo)    |

## Operacional (2026-07-20)

- **WhatsApp dual-path:** Evolution API (QR/pareamento) atrás do Chatwoot; Meta Cloud API **BLOCKED** (sem WABA).
- **E2E:** WhatsApp → Evolution → Chatwoot → n8n → Lead + Conversa no CRM.
- **UI Ember Studio:** shell híbrido + Dashboard KPIs (`GET /dashboard/summary`) + Leads/Funil/Atendimento/Contatos/Oportunidades.
- **SLA funil (RN-OPP-03):** `stageEnteredAt` + check tenant + check-all platform.
- **Backup:** Postgres `crm` + restore-smoke + cron 03:00 em `/opt/inova-crm-ai/backups`.
- **RLS:** role `crm_app` + migration tenant RLS.

## Artefatos-chave

- Constitution: `.specify/memory/constitution.md`
- Spec atual: `specs/008-ember-studio-rollout/`
- Design: `docs/design/system.md` (Ember Studio)
- Ports: `docs/ports.md` (9400–9419; 9416 Evolution localhost)
- Events: `docs/events/catalog-v0.md`
- Gate: `npm run gate`

## Próximo passo

1. **Cutover Meta Cloud API** — BLOCKED até credenciais WABA
2. Spec 009 — rollout Ember nas demais rotas CrmPage (Empresas, Tarefas, …)
3. Opcional: `mc` MinIO no backup; detalhe/create lead; drag-and-drop funil
