# AGENTS.md — Inova CRM AI

Front door para agentes Cursor. Detalhe: [`memory.md`](memory.md) · [`docs/agents.md`](docs/agents.md).

## O que é

CRM omnichannel multi-tenant (Inova TI): Next.js + NestJS/Prisma + FastAPI + workers, Chatwoot e n8n **dedicados**, RabbitMQ (eventos) + Redis (cache/filas n8n), MinIO, deploy VPS Hetzner via Cloudflare Tunnel (portas **9400–9419**).

Fases 0–7 **DONE**. Pós-fase: Spec Kit `026+`. Versão atual **1.1.1** (Spec 028–030 DONE; Spec 027 Meta **BLOCKED**).

## Antes de qualquer tarefa

1. Ler [`memory.md`](memory.md) (snapshot)
2. Ler [`docs/agents.md`](docs/agents.md) (squads SK/C/R/EMB)
3. Ler [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
4. Ler [`.specify/memory/baseline.md`](.specify/memory/baseline.md)
5. Se ops Chatwoot: PID rails ≥ 80% → recreate **antes** de feature (EMB-04)

## Fluxo SDD (ordem fixa)

Specify → Plan → Tasks → Implement + **Quality Gate PASS** → Delivery (CI images → VPS load).

Skills: `.cursor/skills/speckit-*` · Workflow: `.specify/workflows/speckit/workflow.yml`

## Comandos

```powershell
npm run gate          # hard-stop
npm run smoke
npm run format:check
```

Deploy imagens: [`docs/operations/ci-docker-images.md`](docs/operations/ci-docker-images.md)  
VPS: `gestaoti@128.140.77.31` · `/opt/inova-crm-ai`

## Hard rules

| Regra          | Detalhe                                                |
| -------------- | ------------------------------------------------------ |
| Tenant-first   | `tenantId` + RLS; zero query cross-tenant              |
| API/toolbelt   | Agentes e AI **não** acessam DB/MinIO/Rabbit direto    |
| n8n            | Só orquestra HTTP — sem regra CRM em Function/Code     |
| Canais         | Só via Chatwoot `chat-crm`                             |
| Mensageria     | RabbitMQ = domínio; Redis ≠ barramento                 |
| Gate           | Sem `GATE_PASS` não há DONE / baseline / merge de fase |
| Design         | Marca Inova (flame) — não purple/cream AI defaults     |
| Secrets        | Nunca commit `.env`                                    |
| Swarm Chatwoot | Sem scale 0 sem dono Inova-TI                          |

## Layout útil

```
backend/          NestJS API
frontend/         Next.js
workers/          consumers
ai-services/      FastAPI
chatwoot/         compose CRM Chatwoot
n8n/              workflows orquestração
infrastructure/   compose + scripts VPS
specs/            Spec Kit features
docs/             pacote corporativo
.cursor/rules/    always-on
.cursor/agents/   squads Spec/Build/QA/Delivery
```

## Squads

| Squad    | Arquivo                            |
| -------- | ---------------------------------- |
| Spec     | `.cursor/agents/spec-squad.md`     |
| Build    | `.cursor/agents/build-squad.md`    |
| QA       | `.cursor/agents/qa-squad.md`       |
| Delivery | `.cursor/agents/delivery-squad.md` |

## Próximo produto

Spec **027** Meta/WABA — checklist [`docs/operations/waba-credentials-checklist.md`](docs/operations/waba-credentials-checklist.md).  
Gatilho humano: “WABA pronto — executar Spec 027”.
