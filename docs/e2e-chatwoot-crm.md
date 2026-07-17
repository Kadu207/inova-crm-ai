# Fluxo E2E — Chatwoot → n8n → API → Funil

**Fase:** 4  
**Status:** contratos e smoke definidos

## Objetivo

Validar o caminho completo de um lead inbound até o funil CRM.

```
Canal (WhatsApp/IG/FB/Email)
  → Chatwoot (chat-crm)
  → Webhook HMAC (X-Inova-Signature)
  → n8n workflow lead-inbound
  → API NestJS POST /v1/leads/inbound (Bearer API_TOKEN)
  → Outbox + RabbitMQ lead.created
  → worker-crm-leads
  → Lead + estágio no Pipeline
  → UI /leads e /funil
```

## Pré-requisitos

1. `infrastructure` up (postgres, redis, rabbitmq, minio, n8n, api, workers, frontend)
2. `chatwoot` up na rede `inova-crm`
3. Workflows importados em n8n (`n8n/workflows/*.json`)
4. `WEBHOOK_SECRET` e `API_TOKEN` iguais em Chatwoot/n8n/API
5. Migração Prisma aplicada (`npx prisma migrate deploy`)

## Checklist de aceite

- [ ] Health API `GET /health` → 200
- [ ] Webhook n8n `/webhook/lead-inbound` aceita payload assinado
- [ ] Lead criado com `tenantId` e `source=CHATWOOT`
- [ ] Evento `lead.created` publicado no RabbitMQ
- [ ] Worker processa fila `worker-crm-leads`
- [ ] Lead aparece em `GET /v1/leads` e na UI `/leads`
- [ ] Oportunidade/estágio refletidos em `/funil` quando qualificável

## Smoke (curl)

```bash
# 1. Health
curl -sf http://127.0.0.1:9401/health

# 2. Simular n8n → API (sem Chatwoot)
curl -sf -X POST http://127.0.0.1:9401/v1/leads/inbound \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -d '{"name":"Lead E2E","email":"e2e@example.com","source":"CHATWOOT","externalId":"cw-1"}'
```

Assinatura HMAC: ver [webhook-signing.md](./webhook-signing.md).

## Playwright

Smoke UI: `frontend/e2e/smoke.spec.ts` (login + dashboard).  
Integração completa depende de stack Docker local — executar após `npm run infra:up`.
