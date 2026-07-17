# Workers — Inova CRM AI

RabbitMQ consumers for domain events. Single process registers all five workers.

## Workers

| Queue                 | Script alias     | Events                            |
| --------------------- | ---------------- | --------------------------------- |
| `worker-crm-leads`    | `start:leads`    | `lead.*`, `conversation.*`        |
| `worker-crm-pipeline` | `start:pipeline` | `opportunity.*`, `lead.qualified` |
| `worker-crm-billing`  | `start:billing`  | `invoice.*`, `opportunity.won`    |
| `worker-crm-ai`       | `start:ai`       | `ai.*` (stub)                     |
| `worker-crm-audit`    | `start:audit`    | audit-worthy domain events        |

## Domain rules

**Prefer backend HTTP API** for mutations (`API_BASE_URL` + `API_TOKEN`).  
Direct Prisma/DB access is reserved for simple idempotent reads/updates only.

## Run

```bash
cp .env.example .env
npm run start:dev          # all consumers (src/main.ts)
npm run test:unit
```
