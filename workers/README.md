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

## Spec 031 — idempotency & retry

- Before handling: `POST /api/v1/platform/idempotency/claim` (Redis `SET NX`). On handler failure: `…/release`.
- HTTP client retries 5xx/429/network (max 3, exponential backoff).
- On consumer error: republish with `x-retry` header (max 5), then discard poison.
- Fallback in-memory claim only when `API_TOKEN` unset (local/tests).

Docs: [`docs/architecture/spec-031-fts-idempotency-retry.md`](../docs/architecture/spec-031-fts-idempotency-retry.md).

## Run

```bash
cp .env.example .env
npm run start:dev          # all consumers (src/main.ts)
npm run test:unit
```
