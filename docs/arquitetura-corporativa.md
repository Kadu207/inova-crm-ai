# Arquitetura Corporativa — Inova CRM AI

**Volume:** 01  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Descreve a arquitetura de alto nível, bounded contexts, integrações e decisões estruturais (ADRs) do ecossistema Inova CRM AI.

---

## Sumário

1. [Propósito](#propósito)
2. [Diagrama de contexto](#diagrama-de-contexto)
3. [Bounded contexts](#bounded-contexts)
4. [Camadas da aplicação](#camadas-da-aplicação)
5. [Integrações externas](#integrações-externas)
6. [ADRs](#adrs)
7. [Governança Spec Kit](#governança-spec-kit)

---

## Diagrama de contexto

<!-- TODO Fase 1+: diagrama C4 -->

```
[Usuário] → [Cloudflare] → [Frontend CRM] → [API NestJS]
                              ↓                ↓
                         [Chatwoot] ←→ [n8n] → [Workers]
                              ↓                ↓
                         [PostgreSQL] [RabbitMQ] [Redis] [MinIO]
                                              ↓
                                         [AI FastAPI]
```

## Bounded contexts

| Contexto      | Responsabilidade                         |
| ------------- | ---------------------------------------- |
| Leads         | Captação, qualificação, origem           |
| Contacts      | Pessoas e empresas                       |
| Pipeline      | Funil Kanban, oportunidades, SLA         |
| Conversations | Atendimento (sync Chatwoot)              |
| Billing       | Propostas, contratos, faturas            |
| AI            | RAG, scoring, agentes                    |
| Platform      | Tenants, usuários, permissões, auditoria |

## Camadas da aplicação

Ver volumes específicos: [frontend](./arquitetura-frontend.md), [backend](./arquitetura-backend.md), [banco](./arquitetura-banco-dados.md), [eventos](./arquitetura-event-driven.md).

## Integrações externas

- Chatwoot (canais)
- n8n (orquestração)
- Cloudflare (DNS, Tunnel, WAF)
- OpenAI/OpenRouter (IA)

## ADRs

- [001 — Tenant-first](./adr/001-tenant-first.md)
- [002 — MinIO storage](./adr/002-minio-storage.md)
- [003 — n8n boundary](./adr/003-n8n-orchestrator-boundary.md)
- [004 — Redis vs RabbitMQ](./adr/004-redis-vs-rabbitmq.md)

## Governança Spec Kit

Fluxo SDD em `.specify/`; constitution e Quality Gate obrigatórios.
