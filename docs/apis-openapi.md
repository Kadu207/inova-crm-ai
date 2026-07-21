# APIs e OpenAPI — Inova CRM AI

**Volume:** 13  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Contratos REST, versionamento, autenticação, convenções de erro e geração de clientes tipados.

---

## Sumário

1. [Propósito](#propósito)
2. [Base URL](#base-url)
3. [Versionamento](#versionamento)
4. [Autenticação](#autenticação)
5. [Convenções](#convenções)
6. [Módulos API](#módulos-api)
7. [Erros](#erros)
8. [Contract tests](#contract-tests)
9. [Geração de clientes](#geração-de-clientes)

---

## Base URL

- Produção: `https://api-crm.inovatitech.com.br`
- Local: `http://127.0.0.1:9401`
- Swagger UI: `/api/docs`

## Versionamento

Prefixo `/v1/` — breaking changes exigem nova versão ou ADR.

## Autenticação

```
Authorization: Bearer <JWT>        # usuário
Authorization: Bearer <API_TOKEN>   # n8n/worker
X-Tenant-Id: <uuid>               # somente service accounts multi-tenant auditados
```

## Convenções

- JSON request/response
- Paginação: `?page=1&limit=20`
- Filtros sempre escopados ao tenant do token
- Idempotency-Key header em POST críticos

## Módulos API

| Prefixo             | Módulo          |
| ------------------- | --------------- |
| `/v1/dashboard`     | KPIs + activity |
| `/v1/leads`         | Leads           |
| `/v1/contacts`      | Contatos        |
| `/v1/companies`     | Empresas        |
| `/v1/opportunities` | Oportunidades   |
| `/v1/conversations` | Atendimento     |
| `/v1/invoices`      | Financeiro      |
| `/v1/platform`      | Tenants, users  |

## Erros

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "correlationId": "uuid"
}
```

## Contract tests

OpenAPI diff no Quality Gate. Webhooks Chatwoot com schema validado.

## Geração de clientes

`openapi-typescript` ou `@nestjs/swagger` → client no frontend.
