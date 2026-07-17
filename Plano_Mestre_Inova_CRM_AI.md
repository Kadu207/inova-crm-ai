# Plano Mestre — Inova CRM AI

**Versão:** 1.1  
**Data:** 2026-07-14  
**Status:** Fase 0 — Fundação em progresso

---

## Objetivo

Construir uma plataforma **CRM SaaS multi-tenant** da Inova TI, com atendimento omnichannel (Chatwoot dedicado), automação (n8n dedicado), arquitetura event-driven e IA especializada — governada por Spec Kit, TDD e **Quality Gate hard-stop**.

---

## Decisões estruturais (v1.1)

| Decisão      | Escolha                                                        |
| ------------ | -------------------------------------------------------------- |
| Multi-tenant | **Desde o dia 1** — `tenantId` + RLS (não Fase 7)              |
| Portas VPS   | Bloco reservado **9400–9419**                                  |
| Quality Gate | Hard-stop — nenhuma task/fase avança com lint/testes vermelhos |
| Chatwoot     | Instância **dedicada** `chat-crm` — único ponto de canais      |
| n8n          | Instância **dedicada** `n8n-crm` — **orquestrador only**       |
| MinIO        | Storage **dedicado** CRM (`s3-crm` / `storage-crm`)            |
| Redis        | Cache, sessão, rate-limit, filas n8n                           |
| RabbitMQ     | Eventos de domínio (outbox → workers)                          |
| Roteamento   | Cloudflare Tunnel (sem nginx/Caddy na 80 do host)              |
| Deploy       | VPS Hetzner `/opt/inova-crm-ai`                                |

ADRs: `docs/adr/001`–`004`.

---

## Stack

| Camada      | Tecnologia                                                        |
| ----------- | ----------------------------------------------------------------- |
| Frontend    | Next.js, TypeScript, Tailwind, shadcn/ui                          |
| Backend     | NestJS, Prisma, PostgreSQL + RLS                                  |
| Workers     | NestJS consumers RabbitMQ                                         |
| IA          | FastAPI, OpenAI/OpenRouter, RAG                                   |
| Mensageria  | RabbitMQ (eventos), Redis (cache/filas n8n)                       |
| Storage     | MinIO dedicado                                                    |
| Atendimento | Chatwoot dedicado                                                 |
| Automação   | n8n dedicado (sem regra de negócio em Function/IF)                |
| Infra       | Docker Compose, Cloudflare Tunnel, Grafana/Prometheus/Loki/Sentry |

---

## Hostnames e portas (resumo)

| Serviço  | URL                           | Porta host  |
| -------- | ----------------------------- | ----------- |
| CRM      | `crm.inovatitech.com.br`      | 9400        |
| API      | `api-crm.inovatitech.com.br`  | 9401        |
| AI       | `ai-crm.inovatitech.com.br`   | 9402        |
| Chatwoot | `chat-crm.inovatitech.com.br` | 9403        |
| n8n      | `n8n-crm.inovatitech.com.br`  | 9404        |
| MinIO    | `s3-crm` / `storage-crm`      | 9405 / 9406 |

Mapa completo: [docs/ports.md](docs/ports.md).

---

## Módulos do CRM

Dashboard · Empresas · Contatos · Leads · Funil Kanban · Oportunidades · Agenda · Tarefas · Produtos · Serviços · Propostas · Contratos · Financeiro · Cobrança · Atendimento · Relatórios · Configurações · Usuários · Permissões · Auditoria

Regras de negócio: **backend only** — [docs/regras-negocio-crm.md](docs/regras-negocio-crm.md).

---

## Arquitetura (resumo)

```
Cloudflare Tunnel → Frontend / API / AI / Chatwoot / n8n
Frontend → API NestJS → PostgreSQL + Redis + RabbitMQ + MinIO
Chatwoot → webhook → n8n → API
API → outbox → RabbitMQ → Workers → (AI)
```

Eventos: [docs/events/catalog-v0.md](docs/events/catalog-v0.md) (`lead.*`, `contact.*`, `opportunity.*`, `conversation.*`, `invoice.*`, `ai.*`).

---

## Estrutura de pastas

```
inova-crm-ai/
  .specify/          # Spec Kit (constitution, templates, workflows)
  .cursor/rules/     # Regras Cursor (gate, ports, tenant, n8n, events)
  docs/              # Pacote corporativo (~20 volumes + ADRs)
  specs/             # Features SDD (NNN-slug)
  frontend/
  backend/
  workers/
  ai-services/
  infrastructure/
  n8n/
  chatwoot/
```

---

## Governança

- **Constitution:** `.specify/memory/constitution.md`
- **Fluxo SDD:** specify → plan → tasks → implement
- **TDD** por bounded context
- **EDD:** catálogo de eventos antes de publisher
- **Quality Gate:** `npm run gate` — ver `.cursor/rules/quality-gate.mdc`
- **Squads:** Governança → Build → QA (gate owner) → Delivery

---

## Roadmap (sequencial)

| Fase  | Entrega                               | Gate               |
| ----- | ------------------------------------- | ------------------ |
| **0** | Spec Kit, docs, ADRs, tokens, portas  | Fundação completa  |
| **1** | Docker: PG, Redis, RabbitMQ, MinIO    | compose healthy    |
| **2** | Chatwoot dedicado + webhooks          | smoke ingest       |
| **3** | n8n dedicado + workflows orquestração | smoke API call     |
| **4** | CRM MVP (leads, funil, tenant)        | E2E + gate         |
| **5** | Financeiro / cobrança                 | invoice.* events   |
| **6** | IA (FastAPI, RAG, agentes)            | qualificação smoke |
| **7** | Produção SaaS (deploy, backup, obs)   | gate pós-deploy    |

Detalhe: [docs/roadmap.md](docs/roadmap.md).

---

## Regras de engenharia

- Clean Architecture + DDD + SOLID
- Tenant-first + LGPD + auditoria
- OpenAPI documentado
- Event-driven (RabbitMQ)
- Observabilidade estruturada
- CI/CD com gate obrigatório
- Design Inova TI (flame/dark) — não defaults AI purple/cream

---

## Critérios de aceite (por fase)

- Quality Gate 100% PASS
- Cobertura testes ≥ 70% nos contextos tocados
- APIs documentadas (OpenAPI)
- Logs com `tenantId` + `correlationId`
- Backups validados (Fase 7)
- Baseline atualizada (`.specify/memory/baseline.md`)

---

## Prompt para agentes (Cursor / Claude Code)

```
Implemente o Inova CRM AI seguindo Plano Mestre v1.1, constitution e docs/.
Clean Architecture, DDD, SOLID, TDD, Event Driven, tenant-first (tenantId + RLS).
Stack: PostgreSQL, Redis (cache/filas n8n), RabbitMQ (eventos), MinIO, Next.js, NestJS, FastAPI.
Chatwoot e n8n dedicados. n8n SOMENTE orquestrador — regras no backend.
Portas 9400–9419. Quality Gate obrigatório antes de marcar task DONE.
Design: marca Inova TI (flame #fb640a) — não purple/cream AI.
```

Guias: [docs/guia-cursor.md](docs/guia-cursor.md) · [docs/guia-claude-code.md](docs/guia-claude-code.md)
