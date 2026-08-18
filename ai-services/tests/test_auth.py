"""Auth dependency unit tests (Spec 029)."""

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.auth import require_ai_token


def test_require_ai_token_ok(monkeypatch):
    monkeypatch.setenv("AI_API_TOKEN", "secret-token")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="secret-token")
    assert require_ai_token(creds) is None


def test_require_ai_token_wrong(monkeypatch):
    monkeypatch.setenv("AI_API_TOKEN", "secret-token")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="nope")
    with pytest.raises(HTTPException) as exc:
        require_ai_token(creds)
    assert exc.value.status_code == 401


def test_require_ai_token_missing_in_production(monkeypatch):
    monkeypatch.delenv("AI_API_TOKEN", raising=False)
    monkeypatch.setenv("NODE_ENV", "production")
    with pytest.raises(HTTPException) as exc:
        require_ai_token(None)
    assert exc.value.status_code == 503


def test_require_ai_token_missing_in_dev_allows(monkeypatch):
    monkeypatch.delenv("AI_API_TOKEN", raising=False)
    monkeypatch.delenv("NODE_ENV", raising=False)
    assert require_ai_token(None) is None
