# Agentes de IA — Inova CRM AI

**Volume:** 08  
**Versão:** 1.1  
**Status:** harness Cursor ativo · runtime FastAPI Fase 6 DONE (base)

---

## Propósito

Dois planos distintos:

1. **Harness Cursor** (build do produto) — squads Spec/Build/QA/Delivery, memória e Spec Kit.  
   → [`agents.md`](./agents.md) · [`../memory.md`](../memory.md) · [`harness.md`](./harness.md)
2. **Agentes IA de produto** (runtime) — FastAPI + worker-crm-ai, toolbelt NestJS, RAG por tenant.

Este documento cobre o **runtime** (2). O harness (1) é a fonte de verdade para orquestração de agentes de engenharia.

---

## Sumário

1. [Propósito](#propósito)
2. [Princípio API/toolbelt](#princípio-apitoolbelt)
3. [Serviço AI (FastAPI)](#serviço-ai-fastapi)
4. [Squads runtime previstos](#squads-runtime-previstos)
5. [RAG e conhecimento](#rag-e-conhecimento)
6. [Guardrails](#guardrails)
7. [Eventos ai.*](#eventos-ai)
8. [Harness Cursor](#harness-cursor)

---

## Princípio API/toolbelt

Agentes **nunca** acessam PostgreSQL, MinIO ou RabbitMQ diretamente. Todas as ações via API NestJS ou ferramentas MCP expostas pelo backend.

## Serviço AI (FastAPI)

- Host: `ai-crm.inovatitech.com.br` (porta `9402`)
- Auth (Spec 029): rotas `/v1/*` exigem `Authorization: Bearer <AI_API_TOKEN>`; `/health` permanece público. Em produção, `AI_API_TOKEN` ausente → 503.
- OpenAI / OpenRouter
- Worker `worker-crm-ai` para jobs assíncronos

## Squads runtime previstos

| Squad            | Domínio       | Ferramentas                   |
| ---------------- | ------------- | ----------------------------- |
| Lead Qualifier   | Leads         | qualificar, score, enriquecer |
| Pipeline Advisor | Oportunidades | sugerir próximo passo         |
| Support Copilot  | Conversas     | rascunho de resposta (HITL)   |
| Doc RAG          | Conhecimento  | buscar base tenant            |

## RAG e conhecimento

- Embeddings por tenant (isolamento obrigatório)
- Fontes: propostas, FAQs, histórico autorizado
- Storage vetorial — evoluir sob Spec futura; isolamento tenant inegociável

## Guardrails

- Humano no loop para mensagens ao cliente acima de threshold
- Menor privilégio por squad
- Auditoria de toda ação de agente

## Eventos ai.\*

`ai.qualification.completed`, `ai.suggestion.created`, `ai.rag.indexed` — ver [catalog-v0](./events/catalog-v0.md).

## Harness Cursor

| Artefato                              | Uso                                |
| ------------------------------------- | ---------------------------------- |
| `AGENTS.md`                           | Front door                         |
| `docs/agents.md`                      | Catálogo SK / C / R / EMB + squads |
| `memory.md`                           | Snapshot vivo                      |
| `.cursor/agents/*`                    | Subagentes Spec/Build/QA/Delivery  |
| `.cursor/skills/speckit-*`            | Stubs Spec Kit                     |
| `.cursor/rules/inova-crm-harness.mdc` | Always-on                          |

Engenharia: Fases 0–7 DONE; pós-fase via Spec Kit (`026+`). Ver [`roadmap.md`](./roadmap.md).
