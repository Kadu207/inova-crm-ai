"""Follow-up / next-step suggestion agent stub."""

from app.guardrails import guard_output


def suggest_next_step(tenant_id: str, context: dict) -> dict:
    stage = str(context.get("stage") or "prospecting").lower()
    channel = str(context.get("channel") or "").lower()
    has_messages = bool(context.get("message_count") or context.get("messages"))
    open_label = context.get("conversation_status")

    suggestions = {
        "prospecting": "Agendar call de descoberta em 24h e registrar no CRM",
        "qualification": "Completar coleta (nome, empresa, necessidade) e qualificar o lead",
        "proposal": "Enviar ou follow-up da proposta em 48h",
        "negotiation": "Confirmar decisores e prazo de fechamento",
        "closed": "Iniciar onboarding do cliente",
    }
    action = suggestions.get(stage, "Registrar próxima atividade no CRM")

    if has_messages and stage == "prospecting":
        action = "Responder no Chatwoot, aplicar label de triagem e qualificar no CRM"
    if open_label and str(open_label).upper() == "OPEN" and channel in {"whatsapp", "telegram"}:
        action = (
            f"Manter fio {channel} ativo no Chatwoot; "
            "sugerir resposta no CRM e avançar lead/oportunidade"
        )

    return {
        "tenant_id": tenant_id,
        "stage": stage,
        "channel": channel or None,
        "suggested_action": guard_output(action),
        "priority": "high" if stage in {"negotiation", "proposal"} else "medium",
    }
