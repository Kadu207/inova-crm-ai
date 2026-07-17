# Integração n8n — Inova CRM AI

**Volume:** 07  
**Versão:** 0.2 (Fase 3)  
**Status:** infra + workflows versionados — endpoints API na Fase 4

---

## Propósito

Documenta a instância n8n dedicada, modo fila Redis, padrões de workflow e limite estrito de orquestração (sem regra de negócio).

---

## Sumário

1. [Propósito](#propósito)
2. [Instância dedicada](#instância-dedicada)
3. [Stack Docker](#stack-docker)
4. [Modo fila (Redis)](#modo-fila-redis)
5. [Padrão de workflow](#padrão-de-workflow)
6. [O que é proibido](#o-que-é-proibido)
7. [Workflows versionados](#workflows-versionados)
8. [Credenciais](#credenciais)
9. [Smoke e operação](#smoke-e-operação)
10. [ADR](#adr)

---

## Instância dedicada

- Host: `n8n-crm.inovatitech.com.br`
- Porta host VPS: `127.0.0.1:9404` → container `5678`
- Separada de Inova-TI (`9301`) e outros produtos

## Stack Docker

Serviços em `infrastructure/docker-compose.yml`:

| Serviço    | Container          | Persistência      |
| ---------- | ------------------ | ----------------- |
| n8n        | `inova-n8n`        | volume `n8n_data` |
| n8n-worker | `inova-n8n-worker` | mesmo volume      |

Banco: `n8n_crm` no Postgres compartilhado (`inova-postgres`).  
Fila: Redis compartilhado (`inova-redis`) — Bull queue, **não** RabbitMQ de domínio.

Subir:

```powershell
cd infrastructure
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d
```

Detalhes: [n8n/README.md](../n8n/README.md).

## Modo fila (Redis)

- `EXECUTIONS_MODE=queue`
- n8n main recebe webhooks e enfileira
- `n8n-worker` (`command: worker`) processa execuções
- `N8N_ENCRYPTION_KEY` **idêntica** em main e worker
- Redis porta 6379 **não** publicada no host

Escala: adicionar réplicas de `n8n-worker` no compose.

## Padrão de workflow

```
Trigger (Webhook)
  → Set (apiBase, campos mínimos de roteamento)
  → HTTP Request → api-crm.inovatitech.com.br (Bearer API_TOKEN)
  → Respond to Webhook
```

**Nós permitidos:** Webhook, Set, HTTP Request, Respond to Webhook.  
**Proibido:** Function, Code, IF com lógica CRM.

## O que é proibido

- Function/Code/IF com lógica CRM (qualificação, funil, SLA, faturamento)
- Acesso direto a PostgreSQL, Redis, RabbitMQ ou MinIO
- Consumo de filas RabbitMQ de domínio
- Decisões de negócio que deveriam estar no backend

Ver `.cursor/rules/n8n-boundary.mdc` e [ADR 003](./adr/003-n8n-orchestrator-boundary.md).

## Workflows versionados

Arquivos em `n8n/workflows/` — importar no painel n8n e ativar.

| Arquivo                  | Webhook path                      | HTTP API                          |
| ------------------------ | --------------------------------- | --------------------------------- |
| `lead-inbound.json`      | `POST /webhook/lead-inbound`      | `POST /v1/leads/inbound`          |
| `sync-conversation.json` | `POST /webhook/sync-conversation` | `POST /v1/conversations/sync`     |
| `notify-api.json`        | `POST /webhook/notify-api`        | `POST /v1/notifications/dispatch` |

Origem típica: webhooks Chatwoot (HMAC) → n8n → API (Bearer). Ver [webhook-signing.md](./webhook-signing.md).

## Credenciais

| Variável             | Onde definir          | Uso                          |
| -------------------- | --------------------- | ---------------------------- |
| `API_TOKEN`          | `infrastructure/.env` | Bearer nas chamadas HTTP     |
| `API_BASE_URL`       | `infrastructure/.env` | Base da API NestJS           |
| `N8N_ENCRYPTION_KEY` | `infrastructure/.env` | Criptografia credenciais n8n |
| `WEBHOOK_SECRET`     | `infrastructure/.env` | HMAC webhooks externos       |
| `N8N_SUBDOMAIN`      | `infrastructure/.env` | Host público + `WEBHOOK_URL` |

Nunca commitar `.env` — usar `infrastructure/.env.example`.

## Smoke e operação

```bash
# Health n8n
curl -sf http://127.0.0.1:9404/healthz

# Webhook lead-inbound
curl -sS -X POST "http://127.0.0.1:9404/webhook/lead-inbound" \
  -H "Content-Type: application/json" \
  -d '{"event":"message_created","account":{"id":1},"conversation":{"id":1},"sender":{"name":"Test"},"content":"oi"}'
```

Export periódico: workflows já versionados no git; após edição no UI, re-exportar para `n8n/workflows/`.

## ADR

[003-n8n-orchestrator-boundary.md](./adr/003-n8n-orchestrator-boundary.md)
