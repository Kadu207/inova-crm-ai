"""In-memory RAG stub for Phase 6 scaffold."""

from dataclasses import dataclass, field


@dataclass
class RagDocument:
    id: str
    tenant_id: str
    title: str
    content: str
    tags: list[str] = field(default_factory=list)


class InMemoryRagStore:
    """Tenant-scoped in-memory vector-less search stub."""

    def __init__(self) -> None:
        self._docs: dict[str, list[RagDocument]] = {}

    def seed_demo(self, tenant_id: str) -> None:
        if tenant_id in self._docs:
            return
        self._docs[tenant_id] = [
            RagDocument(
                id="doc-1",
                tenant_id=tenant_id,
                title="Política comercial",
                content="Leads qualificados com budget confirmado avançam para proposta em 48h.",
                tags=["comercial", "sla"],
            ),
            RagDocument(
                id="doc-2",
                tenant_id=tenant_id,
                title="FAQ atendimento",
                content="Horário de suporte: seg–sex 8h–18h. Escalação via Chatwoot.",
                tags=["atendimento"],
            ),
        ]

    def query(self, tenant_id: str, question: str, limit: int = 3) -> list[RagDocument]:
        self.seed_demo(tenant_id)
        docs = self._docs.get(tenant_id, [])
        q = question.lower()
        scored = [
            (sum(1 for word in q.split() if word in doc.content.lower()), doc)
            for doc in docs
        ]
        scored.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scored if score > 0][:limit] or docs[:limit]


rag_store = InMemoryRagStore()
