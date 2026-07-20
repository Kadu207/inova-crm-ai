# Manual de Implantação em Produção — Inova CRM AI

**Volume:** 19  
**Versão:** 1.0 (Fase 7 — Squad Delivery)  
**Status:** ativo

---

## Propósito

Procedimento completo de deploy na VPS Hetzner (`/opt/inova-crm-ai`), Cloudflare Tunnel, migrations, smoke pós-deploy, backup e rollback.

---

## Sumário

1. [Pré-requisitos](#pré-requisitos)
2. [Estrutura na VPS](#estrutura-na-vps)
3. [Secrets e variáveis](#secrets-e-variáveis)
4. [Check de portas](#check-de-portas)
5. [Sync de código](#sync-de-código)
6. [Deploy](#deploy)
7. [Migrations](#migrations)
8. [Cloudflare Tunnel](#cloudflare-tunnel)
9. [Smoke pós-deploy](#smoke-pós-deploy)
10. [Backup e restore](#backup-e-restore)
11. [Rollback](#rollback)
12. [Operação contínua](#operação-contínua)

---

## Pré-requisitos

- VPS Hetzner (Debian 13) com Docker + Docker Compose v2
- Usuário `deploy` com sudo para `cloudflared` e cron
- Cloudflare account com Tunnel configurado
- DNS `*-crm.inovatitech.com.br` no Cloudflare
- Bloco portas **9400–9419** livre no host
- GitLab deploy key ou rsync/scp do CI
- Node.js 20+ (apenas para gate local/CI — não obrigatório na VPS se só Docker)
- **Redis NÃO público:** se a VPS recebeu alerta BSI/CERT-Bund (porta 6379 aberta), corrigir **antes** do deploy — ver [redis-bsi-alerta.md](./security/redis-bsi-alerta.md)

---

## Estrutura na VPS

```
/opt/inova-crm-ai/
├── infrastructure/
│   ├── docker-compose.yml
│   ├── docker-compose.vps.yml
│   ├── .env                    # secrets — NUNCA no git
│   ├── cloudflare-tunnel-ingress.example.yml
│   └── scripts/
│       ├── check-ports.sh
│       ├── deploy-vps.sh
│       └── backup.sh
├── backend/
├── frontend/
├── ai-services/
├── workers/
├── n8n/
└── DEPLOY-HETZNER.md
```

Permissões:

```bash
sudo mkdir -p /opt/inova-crm-ai
sudo chown deploy:deploy /opt/inova-crm-ai
```

---

## Secrets e variáveis

Copiar template e preencher na VPS:

```bash
cp infrastructure/.env.example infrastructure/.env
chmod 600 infrastructure/.env
```

| Variável                                  | Uso                                                   |
| ----------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`                            | PostgreSQL (rede Docker)                              |
| `REDIS_URL`                               | Cache, sessão, filas n8n                              |
| `RABBITMQ_URL`                            | Eventos de domínio                                    |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Storage S3                                            |
| `JWT_SECRET`                              | Auth API                                              |
| `API_TOKEN`                               | n8n / workers                                         |
| `N8N_ENCRYPTION_KEY`                      | n8n credentials                                       |
| `NEXT_PUBLIC_API_URL`                     | Build frontend (`https://api-crm.inovatitech.com.br`) |

Nunca commitar `.env`.

---

## Check de portas

Antes de qualquer `docker compose up`:

```bash
cd /opt/inova-crm-ai
bash infrastructure/scripts/check-ports.sh
# ou, do dev Windows:
npm run ports
```

Conflito em 9400–9419 = **abortar deploy** (Quality Gate FAIL).

Portas esperadas livres:

| Porta     | Serviço                 |
| --------- | ----------------------- |
| 9400      | Frontend                |
| 9401      | API                     |
| 9402      | AI                      |
| 9403      | Chatwoot                |
| 9404      | n8n                     |
| 9405–9406 | MinIO                   |
| 9407      | RabbitMQ UI (localhost) |
| 9408      | Grafana                 |

---

## Sync de código

### Opção A — Git (recomendado)

```bash
cd /opt/inova-crm-ai
git fetch origin
git checkout main
git pull --ff-only origin main
```

### Opção B — rsync (CI / script)

```bash
# Da máquina de build:
rsync -avz --delete \
  --exclude node_modules --exclude .next --exclude .git \
  ./ deploy@vps:/opt/inova-crm-ai/
```

Scripts auxiliares:

- `infrastructure/scripts/deploy-vps.sh` (Linux/macOS)
- `infrastructure/scripts/deploy-vps.ps1` (Windows → scp/rsync)

---

## Deploy

```bash
cd /opt/inova-crm-ai

# 1. Portas
bash infrastructure/scripts/check-ports.sh

# 2. Backup pré-deploy (opcional mas recomendado)
bash infrastructure/scripts/backup.sh

# 3. Build e subir stack
docker compose \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  --env-file infrastructure/.env \
  up -d --build

# 4. Verificar containers
docker compose -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml ps
```

Serviços publicados apenas em `127.0.0.1` — exposição externa via Cloudflare Tunnel.

---

## Migrations

Após containers healthy:

```bash
# Backend NestJS + Prisma (quando disponível)
docker compose -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  exec api npx prisma migrate deploy
```

Regras:

- Migrations sempre forward em produção
- Rollback de schema exige ADR + restore de backup
- Validar: `npx prisma migrate status`

---

## Cloudflare Tunnel

Arquivo de referência: `infrastructure/cloudflare-tunnel-ingress.example.yml`

Hostnames públicos (TLS Full strict):

| Hostname                         | Origem local            |
| -------------------------------- | ----------------------- |
| `crm.inovatitech.com.br`         | `http://127.0.0.1:9400` |
| `api-crm.inovatitech.com.br`     | `http://127.0.0.1:9401` |
| `ai-crm.inovatitech.com.br`      | `http://127.0.0.1:9402` |
| `chat-crm.inovatitech.com.br`    | `http://127.0.0.1:9403` |
| `n8n-crm.inovatitech.com.br`     | `http://127.0.0.1:9404` |
| `s3-crm.inovatitech.com.br`      | `http://127.0.0.1:9405` |
| `storage-crm.inovatitech.com.br` | `http://127.0.0.1:9406` |
| `ops-crm.inovatitech.com.br`     | `http://127.0.0.1:9408` |

Instalação `cloudflared`:

```bash
sudo cloudflared service install
sudo cp /opt/inova-crm-ai/infrastructure/cloudflare-tunnel-ingress.example.yml \
  /etc/cloudflared/config.yml
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
```

**Não** expor RabbitMQ (9407) na internet pública.

---

## Smoke pós-deploy

Checklist manual ou via `npm run smoke` (dev):

| #   | Check            | Comando / URL                                          |
| --- | ---------------- | ------------------------------------------------------ |
| 1   | API health       | `curl -sf https://api-crm.inovatitech.com.br/health`   |
| 2   | AI health        | `curl -sf https://ai-crm.inovatitech.com.br/health`    |
| 3   | Frontend login   | Abrir `https://crm.inovatitech.com.br/login`           |
| 4   | Dashboard        | `https://crm.inovatitech.com.br/`                      |
| 5   | MinIO live       | `curl -sf http://127.0.0.1:9405/minio/health/live`     |
| 6   | Postgres         | `docker exec inova-postgres pg_isready`                |
| 7   | Redis            | `docker exec inova-redis redis-cli ping`               |
| 8   | RabbitMQ         | `docker exec inova-rabbitmq rabbitmq-diagnostics ping` |
| 9   | Chatwoot webhook | POST teste assinado HMAC                               |
| 10  | n8n workflow     | Executar workflow smoke (HTTP → API)                   |
| 11  | Admin SaaS       | `/admin` (super-admin)                                 |
| 12  | Quality Gate     | CI `npm run gate` PASS na tag deployada                |

Registrar resultado em `reports/deploy/<date>.md`.

---

## Backup e restore

Cron diário (exemplo):

```cron
0 3 * * * gestaoti BACKUP_ROOT=/opt/inova-crm-ai/backups /opt/inova-crm-ai/infrastructure/scripts/backup.sh >> /opt/inova-crm-ai/logs/backup.log 2>&1
```

O script `backup.sh` executa:

1. `pg_dump` do container `inova-crm-postgres` (DB `crm`) → `${BACKUP_ROOT}/postgres/` (default `/opt/inova-crm-ai/backups`)
2. `mc mirror` do MinIO → `${BACKUP_ROOT}/minio/` (skip se `mc` ausente)
3. Rotação 30 dias

Smoke de restore (não destrutivo — DB temporário `crm_restore_smoke`):

```bash
bash infrastructure/scripts/restore-smoke.sh
```

Restore Postgres (produção — só em incidente):

```bash
gunzip -c /opt/inova-crm-ai/backups/postgres/latest.sql.gz | \
  docker exec -i inova-crm-postgres psql -U $POSTGRES_USER -d crm
```

Restore MinIO: `mc mirror` inverso do backup.

Drill trimestral obrigatório — ver [runbook-saas.md](./runbook-saas.md).

---

## Rollback

1. Identificar tag/commit anterior estável
2. `git checkout <tag>` ou restore rsync
3. `docker compose ... up -d --build`
4. Se migration irreversível: restore backup + ADR
5. Re-executar smoke checklist
6. `npm run gate` na tag rollback

---

## Operação contínua

- Monitorar Grafana `ops-crm.inovatitech.com.br`
- Rotacionar `API_TOKEN` trimestralmente
- Atualizar `.specify/memory/baseline.md` após release com gate PASS
- Runbook SaaS: [runbook-saas.md](./runbook-saas.md)
- Deploy rápido: [DEPLOY-HETZNER.md](../DEPLOY-HETZNER.md)

---

## Referências

- [ports.md](./ports.md)
- [multi-tenant.md](./multi-tenant.md)
- [devops.md](./devops.md)
- [quality-gate.md](./operations/quality-gate.md)
