# Baseline — Inova CRM AI

**Última atualização:** 2026-07-15  
**Quality Gate:** `GATE_PASS` — `reports/quality-gate/2026-07-15T02-22-21-386Z-fase-completa.md`

## Estado por fase

| Fase     | Escopo                                                                          | Status                             |
| -------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| 0        | Spec Kit, constitution, docs, ADRs, ports, events, design prompts, gate scripts | DONE                               |
| 1        | Docker Compose Postgres/Redis/RabbitMQ/MinIO, check-ports, env, VPS override    | DONE                               |
| 2        | Chatwoot dedicado (`chatwoot/`), tunnel `chat-crm`, webhooks HMAC               | DONE                               |
| 3        | n8n main+worker no compose, workflows orquestração                              | DONE                               |
| 4        | NestJS/Prisma tenant-aware, workers leads/pipeline, Next.js módulos, E2E smoke  | DONE                               |
| 5        | Propostas, Contratos, Financeiro, Cobrança, worker billing                      | DONE                               |
| 6        | FastAPI RAG/agentes, worker AI, toolbelt, guardrails                            | DONE                               |
| 7        | SaaS packing docs, admin UI stub, runbook, escala notes                         | DONE                               |
| QA       | Quality Gate unificado + CI + lefthook + waivers                                | DONE (hard-stop ativo)             |
| Delivery | DEPLOY-HETZNER, tunnel ingress, backup/deploy scripts, manual produção          | DONE (Ship VPS aguarda SSH/Tunnel) |

## Artefatos-chave

- Constitution: `.specify/memory/constitution.md`
- Ports: `docs/ports.md` (9400–9419)
- Events: `docs/events/catalog-v0.md`
- Gate: `npm run gate` → `infrastructure/scripts/quality-gate.mjs`
- Deploy: `DEPLOY-HETZNER.md`, `/opt/inova-crm-ai`

## Próximo passo operacional

1. Subir infra local: `npm run infra:up`
2. `npx prisma migrate deploy` no backend
3. Configurar Tunnel Cloudflare com `infrastructure/cloudflare-tunnel-ingress.example.yml`
4. Ship VPS quando SSH disponível
