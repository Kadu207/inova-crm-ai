# Memory — Inova CRM AI

**Índice vivo do projeto** (ler no início de toda sessão de agente).  
Atualizar após gate PASS, deploy VPS, ou mudança de Spec ativa.  
Detalhe estável: [`.specify/memory/baseline.md`](.specify/memory/baseline.md) · Constituição: [`.specify/memory/constitution.md`](.specify/memory/constitution.md) · Catálogo de agentes: [`docs/agents.md`](docs/agents.md)

**Última atualização:** 2026-10-27  
**Versão produto:** **1.1.4**  
**Harness:** ativo (`docs/agents.md` + `AGENTS.md` + `.cursor/agents` + rule `inova-crm-harness`)

---

## Snapshot operacional

| Item         | Valor                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Repo GitHub  | `https://github.com/Kadu207/inova-crm-ai` · branch `main`                                                                           |
| Repo GitLab  | `https://gitlab.com/Kadu207/inova-crm-ai` (mirror)                                                                                  |
| VPS          | `gestaoti@128.140.77.31` · **SSH `:65025`** · path `/opt/inova-crm-ai` · [`docs/operations/vps-ssh.md`](docs/operations/vps-ssh.md) |
| Portas host  | **9400–9419** — [`docs/ports.md`](docs/ports.md)                                                                                    |
| Gate         | PASS — Spec 032 Telegram (`2026-10-27T03-47-39-321Z`) · Spec 031 permanece em prod até o load desta versão                          |
| Images CI    | Prod loaded: **`0a5266634480`** (run `36661857102`) · migrate `20260930010000_fts_idempotency` **OK** · 2026-09-30T03:10Z           |
| Plano Mestre | 1.2                                                                                                                                 |

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
| Evolution (QR)          | profile opcional  | `127.0.0.1:9416`                     |
| Postgres / Redis / AMQP | rede Docker only  | sem publish público                  |

---

## Specs (pós-fase)

| Spec    | Entrega                                           | Status                                                                                                                                                                                                                      |
| ------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 019–025 | Paridade Zoho onda 1                              | DONE                                                                                                                                                                                                                        |
| **026** | Blueprint / FilterEngine / COQL                   | **DONE** (v1.1.0)                                                                                                                                                                                                           |
| **028** | Relatórios comerciais + `/relatorios`             | **DONE** (v1.1.1) · prod loaded                                                                                                                                                                                             |
| **029** | Security hardening (RLS/secrets/JWT/AI + P1 RBAC) | **DONE** · gate `2026-08-18T05-07-57-461Z`                                                                                                                                                                                  |
| **030** | RBAC navegação / páginas por papel                | **DONE** · gate `2026-08-18T05-40-35-457Z` · [`docs/architecture/spec-030-rbac-navigation.md`](docs/architecture/spec-030-rbac-navigation.md)                                                                               |
| **031** | FTS Postgres + idempotência Redis + retry workers | **DONE** · commit `0a52666` · gate `2026-09-30T02-32-29-884Z` · VPS load `0a5266634480` + migrate FTS **OK** · [`docs/architecture/spec-031-fts-idempotency-retry.md`](docs/architecture/spec-031-fts-idempotency-retry.md) |
| **032** | Telegram via Chatwoot                             | **DONE** · gate `2026-10-27T03-47-39-321Z` · inbox do bot é passo humano ([`docs/chatwoot-telegram-setup.md`](docs/chatwoot-telegram-setup.md))                                                                             |
| **027** | Meta Cloud API / WABA                             | **BLOCKED** — checklist [`docs/operations/waba-credentials-checklist.md`](docs/operations/waba-credentials-checklist.md)                                                                                                    |

**Próximo produto:** Spec **027** (Meta/WABA) quando credenciais prontas — gatilho: “WABA pronto — executar Spec 027”. Spec **032** (Telegram) está no código; o bot do tenant ainda depende de token no Chatwoot.  
**Próximo ops:** checklist WABA / cutover Spec 027; Chatwoot audit periódico.

---

## Chatwoot / Swarm / WhatsApp (ops vivos)

Inventário: [`docs/operations/vps-chatwoot-instances.md`](docs/operations/vps-chatwoot-instances.md)

| Instância      | Domínio                             | Estado 2026-09-29                                                                                                                 |
| -------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| CRM            | `chat-crm` · `127.0.0.1:9403`       | healthy · Evolution `crm-whatsapp` **open** (reconnect QR 2026-09-29)                                                             |
| Casa da Paz    | `casadapaz-chat` · `127.0.0.1:3001` | bind OK (última verificação)                                                                                                      |
| Swarm Inova-TI | `chat.inovatitech.com.br`           | **scale 0 (0/0)** — pausado (vxlan); recovery → 1/1: [`swarm-vxlan-chatwoot-fix.md`](docs/operations/swarm-vxlan-chatwoot-fix.md) |

**n8n CRM:** `API_BASE_URL=http://api:3000` · `API_TOKEN` sync com API · webhooks Chatwoot → `lead-inbound` / `sync-conversation` OK (2026-09-21).

**Webhook secrets:** seed OK 2026-08-19 (`inova`, `rls-test-a`, `rls-test-b`).

**Security audit:** F-01..F-10 em prod (`42048a5842e9`) · F-06 rotação humana ainda checklist — [`docs/security-audit/REMEDIATION.md`](docs/security-audit/REMEDIATION.md).

**Brand:** favicon/PWA — [`docs/design/brand-assets.md`](docs/design/brand-assets.md).

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
5. RabbitMQ = eventos · Redis = cache/sessão/filas n8n / claim idempotência (Spec 031)
6. Quality Gate PASS antes de DONE / baseline / merge
7. Listagens `?q=` = Postgres FTS (não `LIKE '%q%'`)

---

## Comandos frequentes

```powershell
# Local
npm run gate
npm run smoke

# CI images → VPS (após push main com backend/frontend)
# docs/operations/ci-docker-images.md Passos 2–5
bash infrastructure/scripts/load-ci-images-vps.sh dist/images   # na VPS
bash infrastructure/scripts/migrate-api-vps.sh                  # se schema/FTS mudou
```

---

## Como atualizar esta memória

1. Após Spec DONE + gate PASS → versão, Spec status, path do relatório gate
2. Após load CI → SHA / run id / smoke
3. Após ops Chatwoot/Swarm → snapshot PIDs / decisão dono
4. Espelhar estado canônico em `.specify/memory/baseline.md`
5. Manter `docs/agents.md` mapa Spec × papéis alinhado

_Não commit secrets. Não inventar endpoints. Não scale Swarm sem dono._
