# Spec 028 — Relatórios comerciais / métricas de funil

**Status:** implementado (v1.1.1)  
**Spec:** [`specs/028-commercial-reports-funnel/`](../../specs/028-commercial-reports-funnel/)  
**UI:** `/relatorios`  
**Swagger:** tag `reports` em `/api/docs` (quando habilitado)

## Visão

Agregações **read-only**, tenant-scoped, para gestores (ADMIN + SALES):

```
UI /relatorios  →  GET /api/v1/reports/*  →  Prisma (tenantId + soft-delete)
                 ↘ GET …/export.csv
```

Sem novos eventos RabbitMQ; sem lógica no n8n.

## Endpoints

| Método | Path                               | Descrição                                                   |
| ------ | ---------------------------------- | ----------------------------------------------------------- |
| GET    | `/api/v1/reports/pipeline`         | Contagem e valor OPEN por estágio                           |
| GET    | `/api/v1/reports/lead-conversion`  | Criados vs convertidos no período                           |
| GET    | `/api/v1/reports/revenue`          | Forecast (OPEN) vs realized (WON)                           |
| GET    | `/api/v1/reports/sla`              | Conversas + oportunidades com SLA violado                   |
| GET    | `/api/v1/reports/:kind/export.csv` | CSV (`pipeline` \| `lead-conversion` \| `revenue` \| `sla`) |

Query comum: `from`, `to` (ISO-8601). Default: últimos **30 dias**. Máximo: **366 dias**. `from > to` → **400**.

`pipeline` aceita `pipelineId` opcional.

Auth: `Authorization: Bearer` (JWT ou `API_TOKEN`) + tenant do token. Roles: **ADMIN**, **SALES**.

## Definições de negócio

| Métrica         | Regra                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Lead convertido | `LeadStatus.CONVERTED` **ou** ≥1 Opportunity ligada (`deletedAt = null`)                                   |
| Forecast        | Soma `amount` de Opportunity **OPEN**; data = `expectedCloseDate` senão `createdAt`                        |
| Realized        | Soma `amount` **WON** com `updatedAt` no período                                                           |
| Pipeline        | Só OPEN; por estágio do funil (ordem `stageOrder`)                                                         |
| SLA             | Contagens de Conversation (OPEN/PENDING vs total no período) + Opportunity com `slaBreachedAt` no período  |
| SLA partial     | Sempre `meta.partial=true`, `partialReason=first_response_not_modeled` (first-response ainda não modelado) |

## Soft-delete / tenant

Todas as queries filtram `tenantId` e excluem soft-deleted onde o modelo tiver `deletedAt`. Testes de isolamento em `backend/src/reports/reports.service.spec.ts`.

## UI

- Período (from/to), default 30d
- Quatro cards + botão CSV por card
- Estado parcial de SLA explícito na UI
