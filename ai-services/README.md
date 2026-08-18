# AI Services — Inova CRM AI (Phase 6)

FastAPI service for lead qualification, conversation summarization, next-step suggestions, and in-memory RAG stubs.

## Endpoints

| Method | Path                         | Auth                  | Description                          |
| ------ | ---------------------------- | --------------------- | ------------------------------------ |
| GET    | `/health`                    | public                | Liveness probe                       |
| POST   | `/v1/qualify-lead`           | Bearer `AI_API_TOKEN` | Score and tier a lead                |
| POST   | `/v1/suggest-next-step`      | Bearer `AI_API_TOKEN` | Suggest CRM action by pipeline stage |
| POST   | `/v1/summarize-conversation` | Bearer `AI_API_TOKEN` | Summarize Chatwoot messages          |
| POST   | `/v1/rag/query`              | Bearer `AI_API_TOKEN` | Tenant-scoped RAG stub (in-memory)   |
| POST   | `/v1/sla/check`              | Bearer `AI_API_TOKEN` | SLA breach alerts for conversations  |

All `POST` endpoints require `tenant_id` in the JSON body **and** `Authorization: Bearer <AI_API_TOKEN>` (Spec 029). Guardrails block sensitive fields and redact PII in outputs.

In production (`NODE_ENV=production`), missing `AI_API_TOKEN` returns **503** on protected routes (fail-closed).

## Local development

```bash
cd ai-services
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
export AI_API_TOKEN=dev-ai-token   # optional in non-prod; required in production
uvicorn app.main:app --reload --port 9402
```

Health: `http://localhost:9402/health`

Example:

```bash
curl -sS -X POST http://127.0.0.1:9402/v1/qualify-lead \
  -H "Authorization: Bearer $AI_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tenant_id":"t1","lead":{"company":"Acme","budget":true}}'
```

## Tests

```bash
pytest -v
ruff check app tests
```

## Docker

```bash
docker build -t inova-crm-ai .
docker run --rm -e AI_API_TOKEN=change_me -p 9402:8000 inova-crm-ai
```

Compose injects `AI_API_TOKEN` from `infrastructure/.env`.

## VPS

Published at `ai-crm.inovatitech.com.br` via Cloudflare Tunnel → `127.0.0.1:9402`.

See [DEPLOY-HETZNER.md](../DEPLOY-HETZNER.md) and [docs/ports.md](../docs/ports.md).
