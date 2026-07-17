"""FastAPI application — Inova CRM AI Phase 6."""

from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.agents.followup import suggest_next_step
from app.agents.qualifier import qualify_lead
from app.agents.sla_alerts import check_sla_alerts
from app.agents.summarizer import summarize_conversation
from app.guardrails import guard_output, require_tenant_id, validate_payload_no_secrets
from app.rag.in_memory import rag_store

app = FastAPI(
    title="Inova CRM AI Services",
    version="0.1.0",
    description="AI endpoints — qualify, suggest, summarize, RAG (Phase 6 stub)",
)


class TenantRequest(BaseModel):
    tenant_id: str = Field(..., min_length=1)


class QualifyLeadRequest(TenantRequest):
    lead: dict[str, Any] = Field(default_factory=dict)


class SuggestNextStepRequest(TenantRequest):
    context: dict[str, Any] = Field(default_factory=dict)


class SummarizeRequest(TenantRequest):
    messages: list[dict[str, Any]] = Field(default_factory=list)


class RagQueryRequest(TenantRequest):
    question: str = Field(..., min_length=1)
    limit: int = Field(default=3, ge=1, le=10)


class SlaCheckRequest(TenantRequest):
    conversations: list[dict[str, Any]] = Field(default_factory=list)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-crm"}


@app.post("/v1/qualify-lead")
def qualify_lead_endpoint(body: QualifyLeadRequest) -> dict[str, Any]:
    tenant_id = require_tenant_id(body.tenant_id)
    validate_payload_no_secrets(body.lead)
    return qualify_lead(tenant_id, body.lead)


@app.post("/v1/suggest-next-step")
def suggest_next_step_endpoint(body: SuggestNextStepRequest) -> dict[str, Any]:
    tenant_id = require_tenant_id(body.tenant_id)
    validate_payload_no_secrets(body.context)
    return suggest_next_step(tenant_id, body.context)


@app.post("/v1/summarize-conversation")
def summarize_conversation_endpoint(body: SummarizeRequest) -> dict[str, Any]:
    tenant_id = require_tenant_id(body.tenant_id)
    for msg in body.messages:
        validate_payload_no_secrets(msg)
    return summarize_conversation(tenant_id, body.messages)


@app.post("/v1/rag/query")
def rag_query_endpoint(body: RagQueryRequest) -> dict[str, Any]:
    tenant_id = require_tenant_id(body.tenant_id)
    docs = rag_store.query(tenant_id, body.question, limit=body.limit)
    return {
        "tenant_id": tenant_id,
        "question": body.question,
        "results": [
            {
                "id": doc.id,
                "title": doc.title,
                "snippet": guard_output(doc.content[:200]),
                "tags": doc.tags,
            }
            for doc in docs
        ],
    }


@app.post("/v1/sla/check")
def sla_check_endpoint(body: SlaCheckRequest) -> dict[str, Any]:
    tenant_id = require_tenant_id(body.tenant_id)
    return check_sla_alerts(tenant_id, body.conversations)
