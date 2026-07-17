# Deploy Hetzner — Inova CRM AI

Guia rápido de deploy na VPS Hetzner para o CRM SaaS multi-tenant.

**Path na VPS:** `/opt/inova-crm-ai`  
**Portas reservadas:** `9400–9419` (sem conflito com Inova Finance / Inova-TI)  
**Roteamento:** Cloudflare Tunnel — sem bind público 80/443

---

## Hostnames CRM (`*-crm.inovatitech.com.br`)

| Hostname                         | Serviço          | Porta local |
| -------------------------------- | ---------------- | ----------- |
| `crm.inovatitech.com.br`         | Frontend Next.js | 9400        |
| `api-crm.inovatitech.com.br`     | API NestJS       | 9401        |
| `ai-crm.inovatitech.com.br`      | AI FastAPI       | 9402        |
| `chat-crm.inovatitech.com.br`    | Chatwoot         | 9403        |
| `n8n-crm.inovatitech.com.br`     | n8n              | 9404        |
| `s3-crm.inovatitech.com.br`      | MinIO API        | 9405        |
| `storage-crm.inovatitech.com.br` | MinIO Console    | 9406        |
| `ops-crm.inovatitech.com.br`     | Grafana          | 9408        |

Mapa completo: [docs/ports.md](docs/ports.md)

---

## Pré-deploy

> **Segurança Redis (BSI/CERT-Bund):** se o IP da VPS (ex. `128.140.77.31`) recebeu alerta de Redis aberto, feche a porta `6379` na Internet **antes** de subir o CRM. Guia: [docs/security/redis-bsi-alerta.md](docs/security/redis-bsi-alerta.md). O compose do CRM **não** publica Redis.

```bash
# Na VPS
sudo mkdir -p /opt/inova-crm-ai
sudo chown deploy:deploy /opt/inova-crm-ai

# Secrets
cp infrastructure/.env.example infrastructure/.env
chmod 600 infrastructure/.env
# Editar DATABASE_URL, JWT_SECRET, MINIO_*, etc.
```

---

## Deploy (manual)

```bash
cd /opt/inova-crm-ai

# 1. Portas livres
bash infrastructure/scripts/check-ports.sh

# 2. Código atualizado
git pull --ff-only

# 3. Backup
bash infrastructure/scripts/backup.sh

# 4. Stack (inclui apps: api, frontend, workers, ai)
docker compose \
  --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  --profile apps \
  up -d --build

# Ou one-shot:
# bash infrastructure/scripts/bootstrap-vps.sh

# 5. Migrations
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  --profile apps \
  exec api npx prisma migrate deploy
```

Passo a passo com sync + Tunnel: [docs/deploy-proximo-passo.md](docs/deploy-proximo-passo.md)
---

## Deploy (script)

```bash
# Linux / macOS / WSL
bash infrastructure/scripts/deploy-vps.sh your-vps.hetzner.cloud deploy
```

```powershell
# Windows
.\infrastructure\scripts\deploy-vps.ps1 -VpsHost "your-vps.hetzner.cloud" -VpsUser "deploy"
```

---

## Cloudflare Tunnel

1. Criar tunnel no dashboard Cloudflare
2. Copiar `infrastructure/cloudflare-tunnel-ingress.example.yml` → `/etc/cloudflared/config.yml`
3. Substituir `<YOUR_TUNNEL_UUID>` e credentials
4. `sudo systemctl restart cloudflared`

TLS mode: **Full (strict)**

---

## Smoke checklist

```bash
curl -sf https://api-crm.inovatitech.com.br/health
curl -sf https://ai-crm.inovatitech.com.br/health
curl -sf http://127.0.0.1:9405/minio/health/live
```

Browser:

- [ ] https://crm.inovatitech.com.br/login
- [ ] https://crm.inovatitech.com.br/ (dashboard)
- [ ] https://crm.inovatitech.com.br/admin (super-admin)

Detalhe: [docs/manual-implantacao-producao.md](docs/manual-implantacao-producao.md)

---

## Backup cron

```cron
0 3 * * * deploy /opt/inova-crm-ai/infrastructure/scripts/backup.sh >> /var/log/inova-crm-backup.log 2>&1
```

Postgres `pg_dump` + MinIO `mc mirror` — ver script.

---

## Rollback

```bash
git checkout <previous-tag>
docker compose -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml up -d --build
# Restore DB se migration irreversível
```

---

## Documentação relacionada

- [docs/manual-implantacao-producao.md](docs/manual-implantacao-producao.md) — manual completo
- [docs/runbook-saas.md](docs/runbook-saas.md) — operação SaaS
- [docs/multi-tenant.md](docs/multi-tenant.md) — onboarding e quotas
- [ai-services/README.md](ai-services/README.md) — AI endpoints

---

## Quality Gate

Antes de marcar release:

```bash
npm run gate
```

Hard-stop — ver [.cursor/rules/quality-gate.mdc](.cursor/rules/quality-gate.mdc).
