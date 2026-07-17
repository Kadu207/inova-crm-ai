"""SLA alert agent stub."""

from datetime import datetime, timezone


def check_sla_alerts(tenant_id: str, conversations: list[dict]) -> dict:
    now = datetime.now(timezone.utc)
    alerts: list[dict] = []

    for conv in conversations:
        waiting_minutes = conv.get("waiting_minutes", 0)
        if waiting_minutes >= 30:
            alerts.append(
                {
                    "conversation_id": conv.get("id", "unknown"),
                    "severity": "critical" if waiting_minutes >= 60 else "warning",
                    "waiting_minutes": waiting_minutes,
                    "message": f"SLA breach: {waiting_minutes}min sem resposta",
                }
            )

    return {
        "tenant_id": tenant_id,
        "checked_at": now.isoformat(),
        "alert_count": len(alerts),
        "alerts": alerts,
    }
