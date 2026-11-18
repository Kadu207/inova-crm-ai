from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_summarize_conversation_pt_br(auth_headers):
    response = client.post(
        "/v1/summarize-conversation",
        headers=auth_headers,
        json={
            "tenant_id": "tenant-demo",
            "messages": [
                {"direction": "inbound", "content": "Quero uma proposta comercial"},
                {"direction": "outbound", "content": "Claro, vamos ajudar"},
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tenant_id"] == "tenant-demo"
    assert data["message_count"] == 2
    assert "proposta" in data["topics"]
    assert "Inova TI" in data["summary"]


def test_suggest_reply_draft(auth_headers):
    response = client.post(
        "/v1/suggest-reply",
        headers=auth_headers,
        json={
            "tenant_id": "tenant-demo",
            "channel": "telegram",
            "messages": [
                {"direction": "inbound", "content": "/start"},
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tenant_id"] == "tenant-demo"
    assert "draft" in data
    assert "Inova TI" in data["draft"]
    assert "Chatwoot" in data["disclaimer"]
    assert 0 < data["confidence"] <= 1


def test_suggest_reply_requires_bearer():
    response = client.post(
        "/v1/suggest-reply",
        json={"tenant_id": "tenant-demo", "messages": []},
    )
    assert response.status_code == 401


def test_suggest_next_step_with_conversation_context(auth_headers):
    response = client.post(
        "/v1/suggest-next-step",
        headers=auth_headers,
        json={
            "tenant_id": "tenant-demo",
            "context": {
                "stage": "prospecting",
                "channel": "whatsapp",
                "message_count": 3,
                "conversation_status": "OPEN",
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["channel"] == "whatsapp"
    assert "Chatwoot" in data["suggested_action"] or "CRM" in data["suggested_action"]
