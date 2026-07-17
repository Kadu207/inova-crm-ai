# Roadmap de Desenvolvimento — Inova CRM AI

**Volume:** 16  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Cronograma sequencial de fases, entregáveis, critérios de aceite e dependências entre squads.

---

## Sumário

1. [Propósito](#propósito)
2. [Visão das fases](#visão-das-fases)
3. [Fase 0 — Fundação](#fase-0--fundação)
4. [Fase 1 — Infraestrutura](#fase-1--infraestrutura)
5. [Fase 2 — Chatwoot](#fase-2--chatwoot)
6. [Fase 3 — n8n](#fase-3--n8n)
7. [Fase 4 — CRM MVP](#fase-4--crm-mvp)
8. [Fase 5 — Financeiro](#fase-5--financeiro)
9. [Fase 6 — IA](#fase-6--ia)
10. [Fase 7 — SaaS e produção](#fase-7--saas-e-produção)
11. [Quality Gate por fase](#quality-gate-por-fase)

---

## Visão das fases

| Fase | Nome           | Gate para avançar               |
| ---- | -------------- | ------------------------------- |
| 0    | Fundação       | Docs + Spec Kit + constitution  |
| 1    | Infraestrutura | Compose healthy + check-ports   |
| 2    | Chatwoot       | Webhook → API smoke             |
| 3    | n8n            | Workflow orquestração smoke     |
| 4    | CRM MVP        | Leads + funil + tenant E2E      |
| 5    | Financeiro     | Faturamento + eventos invoice.* |
| 6    | IA             | Qualificação + RAG smoke        |
| 7    | SaaS produção  | Deploy + backup drill + gate    |

## Fase 0 — Fundação

- Spec Kit, constitution, regras Cursor, docs skeleton, ADRs, design tokens
- **Status atual:** em progresso

## Fase 1 — Infraestrutura

Postgres, Redis, RabbitMQ, MinIO, rede Docker, `.env.example`, quality-gate script.

## Fase 2 — Chatwoot

Instância dedicada, tunnel, webhooks assinados.

## Fase 3 — n8n

Main + worker + Redis queue, workflows orquestração.

## Fase 4 — CRM MVP

NestJS + Next.js, Prisma tenant-first, módulos core, OpenAPI.

## Fase 5 — Financeiro

Propostas, contratos, cobrança, `invoice.*` events.

## Fase 6 — IA

FastAPI, worker-crm-ai, agentes, RAG por tenant.

## Fase 7 — SaaS e produção

Deploy Hetzner, observabilidade completa, manual operação, hardening LGPD.

## Quality Gate por fase

Nenhuma fase inicia sem `GATE_PASS` da anterior. Baseline atualizada em `.specify/memory/baseline.md`.

Ver também [Plano Mestre](../Plano_Mestre_Inova_CRM_AI.md).
