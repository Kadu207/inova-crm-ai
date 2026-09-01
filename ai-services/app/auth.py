"""Bearer auth for AI service endpoints (Spec 029)."""

from __future__ import annotations

import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer(auto_error=False)

_WEAK_AI_TOKENS = frozenset(
    {
        "change_me",
        "change_me_ai_api_token",
        "dev-ai-token",
        "secret",
        "ai_api_token",
    }
)


def _is_production() -> bool:
    env = (os.environ.get("NODE_ENV") or os.environ.get("ENVIRONMENT") or "").strip().lower()
    return env == "production"


def require_ai_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> None:
    """Require Authorization: Bearer <AI_API_TOKEN> on protected routes.

    - Token configured + match → OK
    - Token configured + missing/wrong → 401
    - Token missing + production → 503 (fail-closed)
    - Weak placeholder in production → 503
    - Token missing + non-production → allow (local DX / tests without env)
    """
    expected = (os.environ.get("AI_API_TOKEN") or "").strip()

    if not expected:
        if _is_production():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI_API_TOKEN is not configured",
            )
        return

    if _is_production() and (
        expected in _WEAK_AI_TOKENS or len(expected) < 16 or expected.startswith("change_me")
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI_API_TOKEN is weak or a known placeholder",
        )

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials.credentials != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
