"""Conversation summarizer agent stub."""

from app.guardrails import guard_output


def summarize_conversation(tenant_id: str, messages: list[dict]) -> dict:
    count = len(messages)
    inbound = sum(1 for m in messages if m.get("direction") == "inbound")
    outbound = count - inbound
    topics = set()
    for msg in messages:
        for word in ("proposta", "preço", "suporte", "contrato"):
            if word in (msg.get("content") or "").lower():
                topics.add(word)

    summary = guard_output(
        f"Conversa com {count} mensagens ({inbound} inbound, {outbound} outbound). "
        f"Tópicos: {', '.join(topics) or 'geral'}."
    )
    return {
        "tenant_id": tenant_id,
        "message_count": count,
        "topics": sorted(topics),
        "summary": summary,
        "sentiment": "neutral",
    }
