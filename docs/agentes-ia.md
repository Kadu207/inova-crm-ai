# Agentes de IA — Inova CRM AI

**Volume:** 08  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Define arquitetura de agentes IA, squads, toolbelt API, RAG, guardrails e human-in-the-loop.

---

## Sumário

1. [Propósito](#propósito)
2. [Princípio API/toolbelt](#princípio-apitoolbelt)
3. [Serviço AI (FastAPI)](#serviço-ai-fastapi)
4. [Squads previstos](#squads-previstos)
5. [RAG e conhecimento](#rag-e-conhecimento)
6. [Guardrails](#guardrails)
7. [Eventos ai.*](#eventos-ai)
8. [Fase de entrega](#fase-de-entrega)

---

## Princípio API/toolbelt

Agentes **nunca** acessam PostgreSQL, MinIO ou RabbitMQ diretamente. Todas as ações via API NestJS ou ferramentas MCP expostas pelo backend.

## Serviço AI (FastAPI)

- Host: `ai-crm.inovatitech.com.br` (porta `9402`)
- OpenAI / OpenRouter
- Worker `worker-crm-ai` para jobs assíncronos

## Squads previstos

| Squad            | Domínio       | Ferramentas                   |
| ---------------- | ------------- | ----------------------------- |
| Lead Qualifier   | Leads         | qualificar, score, enriquecer |
| Pipeline Advisor | Oportunidades | sugerir próximo passo         |
| Support Copilot  | Conversas     | rascunho de resposta (HITL)   |
| Doc RAG          | Conhecimento  | buscar base tenant            |

## RAG e conhecimento

- Embeddings por tenant (isolamento obrigatório)
- Fontes: propostas, FAQs, histórico autorizado
- Storage vetorial — definir na Fase 6

## Guardrails

- Humano no loop para mensagens ao cliente acima de threshold
- Menor privilégio por squad
- Auditoria de toda ação de agente

## Eventos ai.*

`ai.qualification.completed`, `ai.suggestion.created`, `ai.rag.indexed` — ver [catalog-v0](./events/catalog-v0.md).

## Fase de entrega

IA especializada: **Fase 6** do roadmap (após CRM MVP estável).
