"""Conversation summarizer agent — PT-BR Inova (stub until LLM)."""

from app.guardrails import guard_output

TOPIC_KEYWORDS = {
    "proposta": "proposta",
    "preço": "preço",
    "preco": "preço",
    "orcamento": "orçamento",
    "orçamento": "orçamento",
    "suporte": "suporte",
    "contrato": "contrato",
    "financeiro": "financeiro",
    "humano": "atendimento humano",
    "whatsapp": "whatsapp",
    "telegram": "telegram",
}


def summarize_conversation(tenant_id: str, messages: list[dict]) -> dict:
    count = len(messages)
    inbound = sum(1 for m in messages if str(m.get("direction", "")).lower() == "inbound")
    outbound = count - inbound
    topics: set[str] = set()
    for msg in messages:
        text = (msg.get("content") or msg.get("body") or "").lower()
        for needle, label in TOPIC_KEYWORDS.items():
            if needle in text:
                topics.add(label)

    if count == 0:
        summary = "Sem mensagens no fio ainda. Aguarde o cliente ou confira o Chatwoot."
    else:
        topic_part = ", ".join(sorted(topics)) if topics else "geral / descoberta"
        summary = (
            f"Resumo Inova TI: {count} mensagem(ns) "
            f"({inbound} do cliente, {outbound} da equipe). "
            f"Foco aparente: {topic_part}. "
            "Próximo passo sugerido: confirmar necessidade e coletar nome/empresa se faltarem."
        )

    return {
        "tenant_id": tenant_id,
        "message_count": count,
        "topics": sorted(topics),
        "summary": guard_output(summary),
        "sentiment": "neutral",
    }
