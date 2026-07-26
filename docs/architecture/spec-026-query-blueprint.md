# Spec 026 — Query Blueprint / FilterEngine / COQL

**Status:** implementado (v1.1.0)  
**Spec:** [`specs/026-zoho-blueprint-coql/`](../../specs/026-zoho-blueprint-coql/)

## Visão

Três capacidades Zoho-like, sem SQL livre do cliente:

1. **Blueprint light** — grafo opt-in de transições de estágio
2. **FilterEngine** — IR AND/OR compartilhado + `POST …/search`
3. **COQL** — parser whitelist → mesmo IR → Prisma `findMany`

```
UI / n8n → Nest → FilterEngine / CoqlParser → Prisma (tenantId + RLS)
                 ↘ BlueprintGuard no move de Opportunity
```

## Blueprint

- Tabela `blueprint_transitions` (`tenant_id`, `pipeline_id`, `from_stage_id`, `to_stage_id`, `required_field_keys[]`)
- Se pipeline tem **0** transições → legado (qualquer estágio do pipeline)
- Se ≥1 → aresta obrigatória + campos required (whitelist Opportunity)
- Códigos: `BLUEPRINT_TRANSITION_DENIED`, `BLUEPRINT_REQUIRED_FIELDS`
- API: `/pipelines/:id/blueprint/transitions` (admin)
- UI: Configurações → Blueprint do funil

## FilterEngine

- IR: `{ and } | { or } | { field, op, value }`
- Ops: `eq|neq|contains|in|gt|gte|lt|lte|is_null`
- Custom: `custom.<apiName>` em Lead/Contact (JSONB)
- Endpoints: `POST /leads/search`, `/contacts/search`, `/opportunities/search`

## COQL

- `POST /api/v1/coql/query` `{ q }` — role **ADMIN** (JWT ou `API_TOKEN` + `x-tenant-id`)
- Módulos: `Leads`, `Contacts`, `Accounts`, `Deals`
- Sem `$queryRaw`; LIMIT máx. 200; throttle 30/min
- Proibido: `*`, JOIN, UNION, mutações, `;`, `--`

## RN

Ver `RN-OPP-BP-01` em [`docs/regras-negocio-crm.md`](../regras-negocio-crm.md).
