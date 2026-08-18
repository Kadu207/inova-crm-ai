from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_qualify_lead_success(auth_headers):
    response = client.post(
        "/v1/qualify-lead",
        headers=auth_headers,
        json={
            "tenant_id": "tenant-demo",
            "lead": {"company": "Acme", "budget": True, "source": "inbound"},
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tenant_id"] == "tenant-demo"
    assert data["score"] >= 70
    assert data["tier"] == "hot"


def test_qualify_lead_requires_tenant(auth_headers):
    response = client.post(
        "/v1/qualify-lead",
        headers=auth_headers,
        json={"tenant_id": "   ", "lead": {}},
    )
    assert response.status_code == 400


def test_qualify_lead_blocks_secrets(auth_headers):
    response = client.post(
        "/v1/qualify-lead",
        headers=auth_headers,
        json={"tenant_id": "tenant-demo", "lead": {"password": "secret"}},
    )
    assert response.status_code == 400


def test_qualify_lead_requires_bearer():
    response = client.post(
        "/v1/qualify-lead",
        json={
            "tenant_id": "tenant-demo",
            "lead": {"company": "Acme", "budget": True, "source": "inbound"},
        },
    )
    assert response.status_code == 401


def test_qualify_lead_rejects_wrong_token():
    response = client.post(
        "/v1/qualify-lead",
        headers={"Authorization": "Bearer wrong-token"},
        json={
            "tenant_id": "tenant-demo",
            "lead": {"company": "Acme", "budget": True, "source": "inbound"},
        },
    )
    assert response.status_code == 401
