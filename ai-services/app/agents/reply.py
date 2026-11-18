"""Suggest channel reply draft — agent assist only (never auto-send)."""

from app.guardrails import guard_output


def suggest_reply(tenant_id: str, messages: list[dict], channel: str | None = None) -> dict:
    last_inbound = ""
    for msg in reversed(messages):
        if str(msg.get("direction", "")).lower() == "inbound":
            last_inbound = (msg.get("content") or msg.get("body") or "").strip()
            if last_inbound:
                break

    channel_hint = (channel or "").lower()
    if channel_hint == "telegram":
        greeting = "Olá! Aqui é a equipe Inova TI pelo Telegram."
    elif channel_hint == "whatsapp":
        greeting = "Olá! Aqui é a equipe Inova TI pelo WhatsApp."
    else:
        greeting = "Olá! Aqui é a equipe Inova TI."

    if not messages:
        draft = (
            f"{greeting} Recebemos seu contato. "
            "Pode nos contar nome, empresa e o que precisa (comercial, suporte ou financeiro)?"
        )
        confidence = 0.55
    elif last_inbound.lower() in {"/start", "start", "/ajuda", "ajuda"}:
        draft = (
            f"{greeting} Como podemos ajudar? "
            "Descreva sua necessidade ou digite /humano para falar com um atendente."
        )
        confidence = 0.7
    elif any(k in last_inbound.lower() for k in ("preço", "preco", "orçamento", "orcamento", "proposta")):
        draft = (
            f"{greeting} Obrigado pelo interesse. "
            "Para montarmos uma proposta alinhada, pode compartilhar nome, empresa e o contexto do projeto?"
        )
        confidence = 0.75
    elif any(k in last_inbound.lower() for k in ("suporte", "erro", "problema", "não funciona", "nao funciona")):
        draft = (
            f"{greeting} Vamos te ajudar no suporte. "
            "Pode descrever o problema e, se possível, enviar um print ou o horário em que ocorreu?"
        )
        confidence = 0.72
    else:
        snippet = last_inbound[:120] + ("…" if len(last_inbound) > 120 else "")
        draft = (
            f"{greeting} Obrigado pela mensagem"
            + (f' sobre "{snippet}"' if snippet else "")
            + ". Em breve um atendente retoma com os próximos passos. "
            "Enquanto isso, pode confirmar nome e empresa?"
        )
        confidence = 0.65

    return {
        "tenant_id": tenant_id,
        "draft": guard_output(draft),
        "confidence": confidence,
        "channel": channel_hint or None,
        "disclaimer": "Rascunho para o agente — envio somente pelo Chatwoot.",
    }
