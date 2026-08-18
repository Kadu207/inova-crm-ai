# Memory — Inova CRM AI

**Índice vivo do projeto** (ler no início de toda sessão de agente).  
Atualizar após gate PASS, deploy VPS, ou mudança de Spec ativa.  
Detalhe estável: [`.specify/memory/baseline.md`](.specify/memory/baseline.md) · Constituição: [`.specify/memory/constitution.md`](.specify/memory/constitution.md) · Catálogo de agentes: [`docs/agents.md`](docs/agents.md)

**Última atualização:** 2026-08-18  
**Versão produto:** **1.1.1**  
**Harness:** ativo (`docs/agents.md` + `AGENTS.md` + `.cursor/agents` + rule `inova-crm-harness`)

---

## Snapshot operacional

| Item         | Valor                                                                                |
| ------------ | ------------------------------------------------------------------------------------ |
| Repo         | `https://github.com/Kadu207/inova-crm-ai` · branch `main`                            |
| VPS          | `gestaoti@128.140.77.31` · path `/opt/inova-crm-ai`                                  |
| Portas host  | **9400–9419** — [`docs/ports.md`](docs/ports.md)                                     |
| Gate         | PASS — `reports/quality-gate/2026-08-18T05-40-35-457Z.md` (Spec 030)                 |
| Images CI    | `inova-crm-api:ci` / `inova-crm-frontend:ci` (SHA `878a92fd5969`, run `32101917702`) |
| Plano Mestre | 1.2                                                                                  |

### Stack

| Camada                  | Tecnologia        | Host / porta                         |
| ----------------------- | ----------------- | ------------------------------------ |
| Frontend                | Next.js           | `crm.inovatitech.com.br` · 9400      |
| API                     | NestJS + Prisma   | `api-crm.inovatitech.com.br` · 9401  |
| AI                      | FastAPI           | `ai-crm.inovatitech.com.br` · 9402   |
| Chatwoot CRM            | v4.8.0 pin        | `chat-crm.inovatitech.com.br` · 9403 |
| n8n                     | main+worker+Redis | `n8n-crm.inovatitech.com.br` · 9404  |
| MinIO                   | S3 API + console  | 9405 / 9406                          |
| RabbitMQ UI             | VPN/SSH           | 9407                                 |
| Postgres / Redis / AMQP | rede Docker only  | sem publish público                  |

---

## Specs (pós-fase)

| Spec    | Entrega                                           | Status                                                                                                                                        |
| ------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 019–025 | Paridade Zoho onda 1                              | DONE                                                                                                                                          |
| **026** | Blueprint / FilterEngine / COQL                   | **DONE** (v1.1.0)                                                                                                                             |
| **028** | Relatórios comerciais + `/relatorios`             | **DONE** (v1.1.1) · prod loaded                                                                                                               |
| **029** | Security hardening (RLS/secrets/JWT/AI + P1 RBAC) | **DONE** · gate `2026-08-18T05-07-57-461Z`                                                                                                    |
| **030** | RBAC navegação / páginas por papel                | **DONE** · gate `2026-08-18T05-40-35-457Z` · [`docs/architecture/spec-030-rbac-navigation.md`](docs/architecture/spec-030-rbac-navigation.md) |
| **027** | Meta Cloud API / WABA                             | **BLOCKED** — checklist [`docs/operations/waba-credentials-checklist.md`](docs/operations/waba-credentials-checklist.md)                      |

**Próximo produto:** Spec **027** (Meta/WABA) quando credenciais prontas — gatilho: “WABA pronto — executar Spec 027”.

---

## Chatwoot / Swarm (ops vivos)

Inventário: [`docs/operations/vps-chatwoot-instances.md`](docs/operations/vps-chatwoot-instances.md)

| Instância      | Domínio                             | Estado 2026-08-03                                                              |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| CRM            | `chat-crm` · `127.0.0.1:9403`       | rails **recreated** — PIDs **~17/512 (~3%)**, healthy, `AUDIT_CRM_CHATWOOT_OK` |
| Casa da Paz    | `casadapaz-chat` · `127.0.0.1:3001` | bind OK                                                                        |
| Swarm Inova-TI | `chat.inovatitech.com.br`           | **1/1** admin+sidekiq — **aguarda dono** (sem scale 0)                         |

**Regra:** se `crm_chatwoot_rails` PID ≥ 80% do `pids_limit` (512) → recreate rails/sidekiq **antes** de feature work.

```bash
bash /opt/inova-crm-ai/chatwoot/scripts/audit-crm-chatwoot.sh
```

---

## Princípios inegociáveis (resumo)

1. Tenant-first + RLS
2. Agentes / n8n / AI só via API NestJS (toolbelt)
3. n8n = orquestrador only
4. Canais só via Chatwoot CRM
5. RabbitMQ = eventos · Redis = cache/sessão/filas n8n
6. Quality Gate PASS antes de DONE / baseline / merge

---

## Comandos frequentes

```powershell
# Local
npm run gate
npm run smoke

# CI images → VPS (após push main com backend/frontend)
# docs/operations/ci-docker-images.md Passos 2–5
bash infrastructure/scripts/load-ci-images-vps.sh dist/images   # na VPS
```

---

## Como atualizar esta memória

1. Após Spec DONE + gate PASS → versão, Spec status, path do relatório gate
2. Após load CI → SHA / run id / smoke
3. Após ops Chatwoot/Swarm → snapshot PIDs / decisão dono
4. Espelhar estado canônico em `.specify/memory/baseline.md`
5. Manter `docs/agents.md` mapa Spec × papéis alinhado

_Não commit secrets. Não inventar endpoints. Não scale Swarm sem dono._
