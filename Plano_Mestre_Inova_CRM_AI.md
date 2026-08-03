# Plano Mestre — Inova CRM AI

**Versão:** 1.2  
**Data:** 2026-07-26  
**Status:** Fases 0–7 + Delivery **DONE** · Etapa atual = **pós-fase** · Spec **027** (Meta BLOCKED) · **028** DONE (v1.1.1)  
**Baseline:** [`.specify/memory/baseline.md`](.specify/memory/baseline.md)  
**Histórico:** [`docs/historico-versoes.md`](docs/historico-versoes.md)

---

## Objetivo

Construir e operar uma plataforma **CRM SaaS multi-tenant** da Inova TI, com atendimento omnichannel (Chatwoot dedicado), automação (n8n dedicado), arquitetura event-driven e IA especializada — governada por Spec Kit, TDD e **Quality Gate hard-stop**.

---

## Estado atual (2026-07-26)

| Item                        | Status                                                    |
| --------------------------- | --------------------------------------------------------- |
| Fases 0–7 (Plano Mestre 1C) | **DONE**                                                  |
| Delivery / CI images → VPS  | **DONE**                                                  |
| Produto Specs 004–025       | **DONE**                                                  |
| Qualidade                   | Gate **PASS**                                             |
| Etapa ativa                 | **026 — Zoho Blueprint light / filtros avançados / COQL** |
| Próxima fila                | **027 — Meta Cloud API (WABA)** — aguarda credenciais     |
| Canal WhatsApp transitório  | Evolution (QR) — ADR 005                                  |

Não existe “Fase 8” numerada: trabalho pós-fase usa Specs Spec Kit (`026+`) com Quality Gate.

---

## Decisões estruturais (v1.2)

| Decisão      | Escolha                                                               |
| ------------ | --------------------------------------------------------------------- |
| Multi-tenant | **Desde o dia 1** — `tenantId` + RLS (não adiado)                     |
| Portas VPS   | Bloco reservado **9400–9419**                                         |
| Quality Gate | Hard-stop — nenhuma task/fase avança com lint/testes vermelhos        |
| Chatwoot     | Instância **dedicada** `chat-crm` — único ponto de canais             |
| n8n          | Instância **dedicada** `n8n-crm` — **orquestrador only**              |
| MinIO        | Storage **dedicado** CRM (`s3-crm` / `storage-crm`)                   |
| Redis        | Cache, sessão, rate-limit, filas n8n, locks de cron                   |
| RabbitMQ     | Eventos de domínio (outbox → workers)                                 |
| Roteamento   | Cloudflare Tunnel (sem nginx/Caddy na 80 do host)                     |
| Deploy       | VPS Hetzner `/opt/inova-crm-ai` — images CI (`:ci`), sem build na VPS |
| Cron crítico | Nest `@nestjs/schedule` (Spec 019); n8n = backup opcional             |
| WhatsApp     | Alvo = Meta Cloud API; transitório = Evolution até WABA               |

ADRs: `docs/adr/001`–`005`.

---

## Stack

| Camada      | Tecnologia                                                 |
| ----------- | ---------------------------------------------------------- |
| Frontend    | Next.js, TypeScript, Tailwind, Ember Studio (marca Inova)  |
| Backend     | NestJS, Prisma, PostgreSQL + RLS                           |
| Workers     | NestJS consumers RabbitMQ                                  |
| IA          | FastAPI, OpenAI/OpenRouter, RAG                            |
| Mensageria  | RabbitMQ (eventos), Redis (cache/filas n8n)                |
| Storage     | MinIO dedicado                                             |
| Atendimento | Chatwoot dedicado                                          |
| Automação   | n8n dedicado (sem regra de negócio em Function/IF)         |
| Infra       | Docker Compose, Cloudflare Tunnel, Grafana/Prometheus/Loki |

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

Dashboard · Empresas · Contatos · Leads · Funil Kanban · Oportunidades · Agenda · Tarefas · Produtos · Serviços · Propostas · Contratos · Financeiro · Cobrança · Atendimento · Relatórios · Configurações · Usuários · Permissões · Auditoria · Admin SaaS · Bulk import/export · Custom fields

Regras de negócio: **backend only** — [docs/regras-negocio-crm.md](docs/regras-negocio-crm.md).

---

## Arquitetura (resumo)

```
Cloudflare Tunnel → Frontend / API / AI / Chatwoot / n8n
Frontend → API NestJS → PostgreSQL + Redis + RabbitMQ + MinIO
Chatwoot → webhook → n8n → API
API → outbox → RabbitMQ → Workers → (AI)
API → ScheduleModule → SLA + LGPD purge (cron nativo)
```

Eventos: [docs/events/catalog-v0.md](docs/events/catalog-v0.md).

---

## Estrutura de pastas

```
inova-crm-ai/
  .specify/          # Spec Kit (constitution, templates, workflows)
  .cursor/rules/     # Regras Cursor (gate, ports, tenant, n8n, events)
  docs/              # Pacote corporativo + ADRs + histórico
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
- **Baseline:** atualizar só após Gate PASS

---

## Roadmap — Fases 0–7 (concluídas)

| Fase  | Entrega                               | Status |
| ----- | ------------------------------------- | ------ |
| **0** | Spec Kit, docs, ADRs, tokens, portas  | DONE   |
| **1** | Docker: PG, Redis, RabbitMQ, MinIO    | DONE   |
| **2** | Chatwoot dedicado + webhooks          | DONE   |
| **3** | n8n dedicado + workflows orquestração | DONE   |
| **4** | CRM MVP (leads, funil, tenant)        | DONE   |
| **5** | Financeiro / cobrança                 | DONE   |
| **6** | IA (FastAPI, RAG, agentes)            | DONE   |
| **7** | Produção SaaS (deploy, backup, obs)   | DONE   |

Detalhe e pós-fase: [docs/roadmap.md](docs/roadmap.md) · [docs/historico-versoes.md](docs/historico-versoes.md).

---

## Roadmap — Pós-fase (ativo)

| Spec    | Entrega                                                                             | Status                           |
| ------- | ----------------------------------------------------------------------------------- | -------------------------------- |
| 019–025 | Paridade Zoho onda 1 (cron, audit, related, webhooks, filtros, bulk, custom fields) | DONE                             |
| **026** | **Zoho Blueprint light + filtros avançados + COQL (read-only)**                     | **DONE** (v1.1.0)                |
| **028** | Relatórios comerciais + métricas de funil (API + UI)                                | **DONE** (v1.1.1)                |
| **027** | Meta Cloud API cutover (WABA)                                                       | QUEUED (BLOCKED até credenciais) |

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

## Critérios de aceite (por Spec / entrega)

- Quality Gate 100% PASS
- Cobertura testes ≥ 70% nos contextos tocados
- APIs documentadas (OpenAPI)
- Logs com `tenantId` + `correlationId`
- Backups validados
- Baseline atualizada (`.specify/memory/baseline.md`)

---

## Prompt para agentes (Cursor / Claude Code)

```
Implemente o Inova CRM AI seguindo Plano Mestre v1.2, constitution e docs/.
Clean Architecture, DDD, SOLID, TDD, Event Driven, tenant-first (tenantId + RLS).
Stack: PostgreSQL, Redis (cache/filas n8n), RabbitMQ (eventos), MinIO, Next.js, NestJS, FastAPI.
Chatwoot e n8n dedicados. n8n SOMENTE orquestrador — regras no backend.
Portas 9400–9419. Quality Gate obrigatório antes de marcar task DONE.
Design: marca Inova TI (flame #fb640a) — não purple/cream AI.
Estado: Fases 0–7 DONE. Pós-fase ativa = Spec 027 Meta/WABA (BLOCKED até credenciais); Spec 028 relatórios DONE (v1.1.1).
```

Guias: [docs/guia-cursor.md](docs/guia-cursor.md) · [docs/guia-claude-code.md](docs/guia-claude-code.md)
