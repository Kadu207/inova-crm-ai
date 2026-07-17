# Tarefas: CRM MVP — Backend Phase 4

**Spec:** `004-crm-mvp`  
**Plano:** [plan.md](./plan.md)  
**Status geral:** em progresso

---

## Legenda

- `[x]` scaffold concluído (gate pendente)
- `[ ]` pendente
- **Regra hard-stop:** nenhuma task DONE sem `npm run gate` PASS

---

## Bloco 1 — Preparação

| ID   | Pri | Tarefa                           | Status |
| ---- | --- | -------------------------------- | ------ |
| T-01 | P0  | Ler spec, plano e constitution   | [x]    |
| T-02 | P0  | Confirmar tenantId no schema     | [x]    |
| T-03 | P1  | `.env.example` backend + workers | [x]    |

---

## Bloco 2 — Dados / Prisma

| ID   | Pri | Tarefa                             | Status |
| ---- | --- | ---------------------------------- | ------ |
| T-10 | P0  | Schema Prisma com todos os modelos | [x]    |
| T-11 | P0  | RLS policy (migration SQL)         | [ ]    |
| T-12 | P0  | `prisma generate` + migrate dev    | [ ]    |

---

## Bloco 3 — Backend API

| ID   | Pri | Tarefa                                   | Status |
| ---- | --- | ---------------------------------------- | ------ |
| T-20 | P0  | NestJS app module + main + Swagger       | [x]    |
| T-21 | P0  | Auth JWT + tenancy guards                | [x]    |
| T-22 | P0  | Módulos CRM (leads, contacts, pipeline…) | [x]    |
| T-23 | P0  | Módulos finance (proposals, invoices…)   | [x]    |
| T-24 | P0  | Webhooks Chatwoot + n8n                  | [x]    |
| T-25 | P0  | Events outbox + RabbitMQ publisher       | [x]    |
| T-26 | P1  | ai-toolbelt + saas stubs                 | [x]    |
| T-27 | P0  | Unit tests leads + finance + auth        | [x]    |
| T-28 | P1  | Dockerfile backend                       | [x]    |

---

## Bloco 4 — Workers

| ID   | Pri | Tarefa                                   | Status |
| ---- | --- | ---------------------------------------- | ------ |
| T-30 | P0  | Package workers + main.ts all consumers  | [x]    |
| T-31 | P0  | Handlers leads/pipeline/billing/ai/audit | [x]    |
| T-32 | P0  | Test leads.handler idempotency           | [x]    |
| T-33 | P1  | Dockerfile workers                       | [x]    |

---

## Bloco 5 — Quality Gate

| ID   | Pri | Tarefa                   | Status |
| ---- | --- | ------------------------ | ------ |
| T-40 | P0  | `npm run typecheck` PASS | [ ]    |
| T-41 | P0  | `npm run test:unit` PASS | [ ]    |
| T-42 | P0  | `npm run gate` PASS      | [ ]    |
| T-43 | P1  | Atualizar baseline       | [x]    |

---

## Bloco 6 — Docs

| ID   | Pri | Tarefa                          | Status |
| ---- | --- | ------------------------------- | ------ |
| T-50 | P2  | Sync `docs/arquitetura-backend` | [ ]    |
