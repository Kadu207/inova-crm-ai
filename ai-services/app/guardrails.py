"""Guardrails — tenant isolation and PII leak prevention."""

import re
from typing import Any

from fastapi import HTTPException

PII_PATTERNS = [
    re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b"),  # CPF
    re.compile(r"\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b"),  # CNPJ
    re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),  # email in output
    re.compile(r"\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}\b"),  # phone BR
]

SENSITIVE_KEYS = {"password", "token", "secret", "cpf", "cnpj", "credit_card"}


def require_tenant_id(tenant_id: str | None) -> str:
    """Reject requests without a valid tenant_id."""
    if not tenant_id or not tenant_id.strip():
        raise HTTPException(status_code=400, detail="tenant_id is required")
    return tenant_id.strip()


def scan_text_for_pii(text: str) -> list[str]:
    """Return matched PII pattern names found in text."""
    hits: list[str] = []
    for pattern in PII_PATTERNS:
        if pattern.search(text):
            hits.append(pattern.pattern)
    return hits


def redact_pii(text: str) -> str:
    """Redact common PII patterns from outbound text."""
    result = text
    for pattern in PII_PATTERNS:
        result = pattern.sub("[REDACTED]", result)
    return result


def validate_payload_no_secrets(payload: dict[str, Any]) -> None:
    """Block payloads that carry obvious secret fields."""
    for key in payload:
        if key.lower() in SENSITIVE_KEYS:
            raise HTTPException(
                status_code=400,
                detail=f"Field '{key}' is not allowed in AI request payload",
            )


def guard_output(text: str) -> str:
    """Apply PII redaction to model output before returning to client."""
    if scan_text_for_pii(text):
        return redact_pii(text)
    return text
