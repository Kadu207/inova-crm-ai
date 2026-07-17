# Inova CRM AI

Plataforma CRM SaaS da **Inova TI** — omnichannel (Chatwoot dedicado), automação (n8n dedicado), event-driven (RabbitMQ + Workers), multi-tenant desde o dia 1 e IA especializada.

**Versão do plano:** 1.1 · **Fases ativas:** 4 (frontend), 6 (AI), 7 (SaaS/deploy)

---

## Status

| Componente                   | Status         |
| ---------------------------- | -------------- |
| Spec Kit (`.specify/`)       | ✅ Fase 0      |
| Constitution + regras Cursor | ✅ Fase 0      |
| Docs corporativos (`docs/`)  | ✅ ativo       |
| Frontend Next.js             | ✅ Fase 4 MVP  |
| AI FastAPI                   | ✅ Fase 6 stub |
| Deploy Hetzner / SaaS docs   | ✅ Fase 7      |
| Backend NestJS               | ⏳ Fase 4+     |
| Quality Gate script          | ✅ Fase 1      |

---

## Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind (marca Inova flame/void)
- **Backend:** NestJS, Prisma, PostgreSQL + RLS
- **Workers:** NestJS consumers (RabbitMQ)
- **IA:** FastAPI, RAG stub, agentes (Fase 6)
- **Mensageria:** RabbitMQ (eventos) · Redis (cache, sessão, filas n8n)
- **Storage:** MinIO dedicado
- **Integrações:** Chatwoot + n8n dedicados
- **Infra:** Docker Compose, Cloudflare Tunnel, VPS Hetzner

---

## Domínios

| Serviço | URL                           | Porta |
| ------- | ----------------------------- | ----- |
| CRM     | `crm.inovatitech.com.br`      | 9400  |
| API     | `api-crm.inovatitech.com.br`  | 9401  |
| AI      | `ai-crm.inovatitech.com.br`   | 9402  |
| Chat    | `chat-crm.inovatitech.com.br` | 9403  |
| n8n     | `n8n-crm.inovatitech.com.br`  | 9404  |
| Ops     | `ops-crm.inovatitech.com.br`  | 9408  |

Mapa completo: [docs/ports.md](docs/ports.md)

---

## Estrutura do repositório

```
.specify/              # Spec Kit — constitution, templates, workflows
.cursor/rules/         # Regras Cursor (gate, tenant, ports, n8n, events)
docs/                  # Documentação corporativa
frontend/              # Next.js App Router (Fase 4)
backend/               # NestJS + Prisma (Fase 4+)
workers/               # Consumers RabbitMQ (Fase 4+)
ai-services/           # FastAPI (Fase 6)
infrastructure/        # Docker, scripts gate/ports/deploy
n8n/                   # Workflows orquestração (Fase 3+)
chatwoot/              # Config Chatwoot (Fase 2+)
DEPLOY-HETZNER.md      # Guia deploy VPS
```

---

## Comandos — raiz (monorepo)

```bash
npm install                  # workspaces: backend, frontend, workers, packages/*
npm run gate                 # Quality Gate completo (hard-stop)
npm run gate:soft            # Gate fase 0 (soft)
npm run ports                # Auditar portas 9400–9419
npm run smoke                # Health smoke scripts
npm run format               # Prettier write
npm run format:check         # Prettier check
npm run lint                 # ESLint monorepo
npm run typecheck            # tsc em todos workspaces
npm run test                 # testes em todos workspaces
npm run test:e2e             # Playwright (frontend)
npm run infra:config         # Validar compose dev
npm run infra:up             # Subir infra local (dev)
npm run infra:down           # Parar infra local
```

---

## Comandos — frontend (`frontend/`)

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL
npm install
npm run dev                  # http://localhost:9400
npm run build
npm run start                # produção porta 3000 (Docker → 9400)
npm run lint
npm run typecheck
npm run test                 # vitest
npm run test:e2e             # playwright smoke (/login, /)
```

Docker:

```bash
cd frontend
docker build -t inova-crm-frontend .
docker run --rm -p 9400:3000 inova-crm-frontend
```

---

## Comandos — AI services (`ai-services/`)

```bash
cd ai-services
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 9402
pytest -v
ruff check app tests
```

Docker:

```bash
cd ai-services
docker build -t inova-crm-ai .
docker run --rm -p 9402:8000 inova-crm-ai
curl http://localhost:9402/health
```

---

## Comandos — deploy VPS (Hetzner)

```bash
# Na VPS /opt/inova-crm-ai
bash infrastructure/scripts/check-ports.sh
bash infrastructure/scripts/backup.sh
docker compose \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  --env-file infrastructure/.env \
  up -d --build

# Da máquina local
bash infrastructure/scripts/deploy-vps.sh your-vps deploy
# Windows:
# .\infrastructure\scripts\deploy-vps.ps1 -VpsHost "your-vps" -VpsUser "deploy"
```

Guia completo: [DEPLOY-HETZNER.md](DEPLOY-HETZNER.md) · [docs/manual-implantacao-producao.md](docs/manual-implantacao-producao.md)

---

## Spec Kit (Fase 0)

```powershell
# Windows
.specify\scripts\ps\check-prerequisites.ps1
.specify\scripts\ps\create-new-feature.ps1 "Descrição da feature"
.specify\scripts\ps\setup-plan.ps1
.specify\scripts\ps\setup-tasks.ps1
```

```bash
# Linux / macOS / WSL
.specify/scripts/bash/check-prerequisites.sh
.specify/scripts/bash/create-new-feature.sh "Descrição da feature"
.specify/scripts/bash/setup-plan.sh
.specify/scripts/bash/setup-tasks.sh
```

---

## Fases do roadmap

| Fase | Nome                                                |
| ---- | --------------------------------------------------- |
| 0    | Fundação (Spec Kit, docs, ADRs)                     |
| 1    | Infraestrutura (Docker, PG, Redis, RabbitMQ, MinIO) |
| 2    | Chatwoot dedicado                                   |
| 3    | n8n dedicado                                        |
| 4    | CRM MVP (tenant-first) ← **frontend scaffold**      |
| 5    | Financeiro / cobrança                               |
| 6    | IA ← **ai-services scaffold**                       |
| 7    | SaaS produção ← **deploy docs**                     |

Detalhe: [docs/roadmap.md](docs/roadmap.md)

---

## Documentação

- [Plano Mestre v1.1](./Plano_Mestre_Inova_CRM_AI.md)
- [Deploy Hetzner](./DEPLOY-HETZNER.md)
- [Manual implantação produção](docs/manual-implantacao-producao.md)
- [Runbook SaaS](docs/runbook-saas.md)
- [Multi-tenant](docs/multi-tenant.md)
- [Visão geral](docs/00-visao-geral.md)
- [Constituição](.specify/memory/constitution.md)
- [Catálogo de eventos v0](docs/events/catalog-v0.md)
- [Design tokens Inova](docs/design/tokens.md)
- [AI services README](ai-services/README.md)

---

## Princípios inegociáveis

- **Tenant-first** — `tenantId` + RLS desde a primeira migration
- **Quality Gate hard-stop** — sem avanço com lint/testes vermelhos
- **n8n orquestrador** — regras de negócio no backend
- **Canais via Chatwoot** — sem bypass
- **RabbitMQ** para eventos · **Redis** para cache/sessão/filas n8n

---

## Owner

GitHub: [Kadu207](https://github.com/Kadu207)
