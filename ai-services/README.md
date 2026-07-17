# AI Services — Inova CRM AI (Phase 6)

FastAPI service for lead qualification, conversation summarization, next-step suggestions, and in-memory RAG stubs.

## Endpoints

| Method | Path                         | Description                          |
| ------ | ---------------------------- | ------------------------------------ |
| GET    | `/health`                    | Liveness probe                       |
| POST   | `/v1/qualify-lead`           | Score and tier a lead                |
| POST   | `/v1/suggest-next-step`      | Suggest CRM action by pipeline stage |
| POST   | `/v1/summarize-conversation` | Summarize Chatwoot messages          |
| POST   | `/v1/rag/query`              | Tenant-scoped RAG stub (in-memory)   |
| POST   | `/v1/sla/check`              | SLA breach alerts for conversations  |

All `POST` endpoints require `tenant_id` in the JSON body. Guardrails block sensitive fields and redact PII in outputs.

## Local development

```bash
cd ai-services
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 9402
```

Health: `http://localhost:9402/health`

## Tests

```bash
pytest -v
ruff check app tests
```

## Docker

```bash
docker build -t inova-crm-ai .
docker run --rm -p 9402:8000 inova-crm-ai
```

## VPS

Published at `ai-crm.inovatitech.com.br` via Cloudflare Tunnel → `127.0.0.1:9402`.

See [DEPLOY-HETZNER.md](../DEPLOY-HETZNER.md) and [docs/ports.md](../docs/ports.md).
