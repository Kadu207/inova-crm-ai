"""Pytest fixtures — Spec 029 AI Bearer auth."""

from __future__ import annotations

import os

import pytest


@pytest.fixture(autouse=True)
def ai_api_token(monkeypatch: pytest.MonkeyPatch) -> str:
    token = "test-ai-token"
    monkeypatch.setenv("AI_API_TOKEN", token)
    monkeypatch.delenv("NODE_ENV", raising=False)
    monkeypatch.delenv("ENVIRONMENT", raising=False)
    return token


@pytest.fixture
def auth_headers(ai_api_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {ai_api_token}"}
