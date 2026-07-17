"""Follow-up / next-step suggestion agent stub."""

from app.guardrails import guard_output


def suggest_next_step(tenant_id: str, context: dict) -> dict:
    stage = context.get("stage", "prospecting")
    suggestions = {
        "prospecting": "Agendar call de descoberta em 24h",
        "qualification": "Enviar questionário de necessidades",
        "proposal": "Follow-up da proposta em 48h",
        "negotiation": "Confirmar decisores e prazo de fechamento",
        "closed": "Iniciar onboarding do cliente",
    }
    action = suggestions.get(stage, "Registrar próxima atividade no CRM")
    return {
        "tenant_id": tenant_id,
        "stage": stage,
        "suggested_action": guard_output(action),
        "priority": "high" if stage in {"negotiation", "proposal"} else "medium",
    }
