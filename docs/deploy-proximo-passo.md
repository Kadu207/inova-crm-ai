# Deploy VPS — Inova CRM AI (próximo passo operacional)

**Alvo:** `gestaoti@128.140.77.31` → `/opt/inova-crm-ai`  
**Pré-requisito:** Redis público já fechado (BSI OK).

SSH deste agente não tem sua chave — rode no **seu** terminal (onde `ssh gestaoti@...` já funciona).

---

## 1) No PC (PowerShell) — enviar código

**Sem rsync / sem sudo no SSH one-liner** — use o guia: [deploy-sync-sem-rsync.md](./deploy-sync-sem-rsync.md)

Resumo:

```powershell
# 1. SSH interativo → sudo mkdir /opt/inova-crm-ai && chown gestaoti
# 2. No PC:
cd "C:\Projetos DEV\Inova CRM AI"
tar -czf "$env:TEMP\inova-crm-ai.tgz" --exclude=node_modules --exclude=.next --exclude=dist --exclude=.git --exclude=.env --exclude=infrastructure/.env --exclude=reports --exclude=coverage .
scp "$env:TEMP\inova-crm-ai.tgz" gestaoti@128.140.77.31:/tmp/inova-crm-ai.tgz
# 3. Na VPS: cd /opt/inova-crm-ai && tar -xzf /tmp/inova-crm-ai.tgz
```

## 2) Na VPS — bootstrap

```bash
cd /opt/inova-crm-ai
bash infrastructure/scripts/bootstrap-vps.sh
```

O script: gera secrets → `compose --profile apps up` → migrate → seed → smoke local.

## 3) Cloudflare Tunnel

No Zero Trust → Networks → Tunnels → seu tunnel → Public Hostnames:

| Hostname                         | Service                 |
| -------------------------------- | ----------------------- |
| `crm.inovatitech.com.br`         | `http://127.0.0.1:9400` |
| `api-crm.inovatitech.com.br`     | `http://127.0.0.1:9401` |
| `ai-crm.inovatitech.com.br`      | `http://127.0.0.1:9402` |
| `n8n-crm.inovatitech.com.br`     | `http://127.0.0.1:9404` |
| `s3-crm.inovatitech.com.br`      | `http://127.0.0.1:9405` |
| `storage-crm.inovatitech.com.br` | `http://127.0.0.1:9406` |

Referência YAML: `infrastructure/cloudflare-tunnel-ingress.example.yml`

DNS Cloudflare: CNAME dos hostnames para o tunnel (`*.cfargotunnel.com`), proxy laranja.

## 4) Smoke público

```bash
curl -sf https://api-crm.inovatitech.com.br/health
curl -sf https://crm.inovatitech.com.br/login | head
```

Browser: https://crm.inovatitech.com.br/login  
Tenant `demo` / `admin@demo.inovatitech.com.br` / `InovaDemo@2026` — **trocar senha** após primeiro acesso.

## 5) Chatwoot (opcional nesta rodada)

```bash
cd /opt/inova-crm-ai/chatwoot
cp .env.example .env   # editar secrets
# garantir rede inova-crm existe
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d
```

---

Se preferir, cole o output do sync + bootstrap aqui que eu ajudo a destravar Tunnel/DNS.
