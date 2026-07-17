# n8n — Inova CRM AI

Instância **dedicada** ao CRM (`n8n-crm.inovatitech.com.br`). Serviços `n8n` + `n8n-worker` vivem em `infrastructure/docker-compose.yml` (DB `n8n_crm`, fila Redis compartilhado).

## Arquitetura

| Serviço    | Container          | DB / fila          |
| ---------- | ------------------ | ------------------ |
| n8n main   | `inova-n8n`        | Postgres `n8n_crm` |
| n8n worker | `inova-n8n-worker` | Redis Bull (queue) |

Modo: `EXECUTIONS_MODE=queue` — webhooks na main, execução no worker.

## Pré-requisitos

Variáveis em `infrastructure/.env` (ver `.env.example`):

- `N8N_ENCRYPTION_KEY` — **obrigatório**, idêntico em main e worker
- `API_TOKEN` — Bearer para chamadas à API NestJS
- `API_BASE_URL` — ex.: `https://api-crm.inovatitech.com.br`
- `WEBHOOK_SECRET` — verificação HMAC de webhooks externos (doc em [webhook-signing.md](../docs/webhook-signing.md))
- `N8N_SUBDOMAIN` — `n8n-crm.inovatitech.com.br`

## Subir

```powershell
cd infrastructure

# Dev local (n8n em 127.0.0.1:9404)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# VPS
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d
```

## Importar workflows

Arquivos versionados em `n8n/workflows/`:

| Arquivo                  | Path webhook                 | Ação API                          |
| ------------------------ | ---------------------------- | --------------------------------- |
| `lead-inbound.json`      | `/webhook/lead-inbound`      | `POST /v1/leads/inbound`          |
| `sync-conversation.json` | `/webhook/sync-conversation` | `POST /v1/conversations/sync`     |
| `notify-api.json`        | `/webhook/notify-api`        | `POST /v1/notifications/dispatch` |

1. Acesse `https://n8n-crm.inovatitech.com.br` (ou `http://127.0.0.1:9404` em dev).
2. **Workflows → Import from file** para cada JSON.
3. Ative cada workflow (toggle **Active**).
4. Confirme URLs de produção em Settings → se `WEBHOOK_URL` estiver correto.

**Regra:** somente nós Webhook, Set e HTTP Request — sem Function/Code/IF com lógica CRM. Ver [integracao-n8n.md](../docs/integracao-n8n.md) e ADR 003.

## Cloudflare Tunnel

| Hostname                     | Destino          |
| ---------------------------- | ---------------- |
| `n8n-crm.inovatitech.com.br` | `127.0.0.1:9404` |

## Smoke test

```bash
curl -sS -X POST "http://127.0.0.1:9404/webhook/lead-inbound" \
  -H "Content-Type: application/json" \
  -d '{"event":"message_created","account":{"id":1},"conversation":{"id":10},"sender":{"name":"Test","phone_number":"+5511999999999"},"content":"oi"}'
```

Resposta esperada: `{"ok":true,"workflow":"lead-inbound",...}` (API pode retornar 404 até Fase 4 — workflow ainda orquestra).

## Documentação

- [integracao-n8n.md](../docs/integracao-n8n.md)
- [webhook-signing.md](../docs/webhook-signing.md)
- [.cursor/rules/n8n-boundary.mdc](../.cursor/rules/n8n-boundary.mdc)
