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

- **WhatsApp dual-path:** Evolution API (QR/pareamento) atrás do Chatwoot; Meta Cloud API pronto (ADR 005).
- **E2E:** WhatsApp → Evolution → Chatwoot → n8n → Lead + Conversa no CRM.
- **Atendimento UI:** `/atendimento` lista conversas enriquecidas; resposta no Chatwoot.
- **SLA funil (RN-OPP-03):** `stageEnteredAt` + `POST /opportunities/sla/check` (24h MVP).
- **RLS:** role `crm_app` + migration tenant RLS.

## Artefatos-chave

- Constitution: `.specify/memory/constitution.md`
- Spec atual: `specs/006-atendimento-crm/`
- Ports: `docs/ports.md` (9400–9419; 9416 Evolution localhost)
- Events: `docs/events/catalog-v0.md`
- Gate: `npm run gate`
- Smoke atendimento: `docs/e2e-atendimento-crm.md`

## Próximo passo

1. Cutover Meta Cloud API quando credenciais WABA existirem (`docs/chatwoot-whatsapp-setup.md`)
2. Backup noturno validado em produção (`infrastructure/scripts/backup.sh`)
3. Multi-tenant SLA cron por todos os tenants (hoje demo via n8n env)
