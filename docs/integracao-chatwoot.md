# Integração Chatwoot — Inova CRM AI

**Volume:** 06  
**Versão:** 0.2 (Fase 2)  
**Status:** infra pronta — API sync na Fase 4

---

## Propósito

Documenta a instância Chatwoot dedicada ao CRM, mapeamento tenant, webhooks assinados, sincronização de conversas e regra de canais únicos.

---

## Sumário

1. [Propósito](#propósito)
2. [Instância dedicada](#instância-dedicada)
3. [Stack Docker](#stack-docker)
4. [Mapeamento tenant](#mapeamento-tenant)
5. [Canais suportados](#canais-suportados)
6. [Webhooks assinados](#webhooks-assinados)
7. [Fluxo CRM ↔ Chatwoot](#fluxo-crm--chatwoot)
8. [Eventos](#eventos)
9. [Segurança](#segurança)

---

## Instância dedicada

- Host: `chat-crm.inovatitech.com.br`
- Porta host VPS: `127.0.0.1:9403` → container `3000`
- **Único ponto de canais** — WhatsApp, email, Instagram, Facebook
- **Separada** de Inova-TI e outros produtos Inova

## Stack Docker

Compose em `chatwoot/` (projeto `crm-chatwoot`):

| Serviço  | Imagem                     | Isolamento        |
| -------- | -------------------------- | ----------------- |
| rails    | `chatwoot/chatwoot:latest` | UI + API interna  |
| sidekiq  | `chatwoot/chatwoot:latest` | jobs assíncronos  |
| postgres | `pgvector/pgvector:pg16`   | DB `chatwoot_crm` |
| redis    | `redis:7-alpine`           | fila Sidekiq      |

Redes:

- `cw` — rede interna do stack Chatwoot
- `inova-crm` — **external**, criada por `infrastructure/`; permite API/workers alcançarem `crm_chatwoot_rails`

Subir:

```powershell
cd chatwoot
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d
```

Setup completo: [chatwoot/README.md](../chatwoot/README.md).

## Mapeamento tenant

| CRM                           | Chatwoot                 |
| ----------------------------- | ------------------------ |
| `tenants.chatwoot_account_id` | `account_id`             |
| `tenantId`                    | resolvido via header/API |

Campo `Tenant.chatwootAccountId` (único). O n8n envia `X-Chatwoot-Account-Id` com o `account.id` do webhook; a API resolve o `tenantId`.

Seed demo: `SEED_CHATWOOT_ACCOUNT_ID=1` (account Chatwoot padrão).

## Canais suportados

WhatsApp Business, Email, Instagram DM, Facebook Messenger — configurados por tenant no painel Chatwoot.

## Webhooks assinados

### Fluxo

```
Canal → Chatwoot → webhook (HMAC) → n8n → API NestJS (Bearer API_TOKEN)
```

### Configuração no Chatwoot

Settings → Integrations → Webhooks:

| Campo   | Valor                                                                    |
| ------- | ------------------------------------------------------------------------ |
| URL     | `https://n8n-crm.inovatitech.com.br/webhook/lead-inbound`                |
| Eventos | `message_created`, `conversation_created`, `conversation_status_changed` |
| Secret  | `WEBHOOK_SECRET` (mesmo valor em Chatwoot, n8n, API)                     |

### Assinatura HMAC

Verificação com header **`X-Inova-Signature`** (`sha256=<hex>`) e opcionalmente `X-Inova-Timestamp`.

Documentação completa: [webhook-signing.md](./webhook-signing.md).

Chatwoot envia assinatura nativa (`X-Chatwoot-Signature`); a API NestJS normaliza/valida conforme o helper em `webhook-signing.md`.

### Workflows n8n destino

| Workflow          | Path                         |
| ----------------- | ---------------------------- |
| Lead inbound      | `/webhook/lead-inbound`      |
| Sync conversation | `/webhook/sync-conversation` |

Arquivos: `n8n/workflows/*.json`.

## Fluxo CRM ↔ Chatwoot

```
Canal → Chatwoot → webhook (HMAC) → n8n → POST /v1/leads/inbound
                                              POST /v1/conversations/sync
                                        → conversation.* event → Workers
```

Respostas ao cliente **sempre** via API → Chatwoot API — nunca bypass de canal.

## Eventos

`conversation.created`, `conversation.message.received`, `conversation.assigned` — ver [catalog-v0](./events/catalog-v0.md).

## Segurança

- `SECRET_KEY_BASE` e senhas em `chatwoot/.env` — nunca no git
- `WEBHOOK_SECRET` rotacionável — procedimento em [webhook-signing.md](./webhook-signing.md)
- Tokens Chatwoot API em env; rotação periódica
- Sem bypass de Chatwoot para envio direto em canal
- `ENABLE_ACCOUNT_SIGNUP=false` em produção
