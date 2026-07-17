# Especificação: CRM MVP — Backend Phase 4

**ID:** `004-crm-mvp`  
**Status:** em execução  
**Autor:** Inova CRM AI  
**Data:** 2026-07-14  
**Fase do roadmap:** 4

---

## 1. Contexto e problema

O Inova CRM AI precisa de uma API NestJS multi-tenant com entidades comerciais (leads, contatos, pipeline, oportunidades) e integração event-driven via RabbitMQ outbox.

**Problema:**  
Sem backend modular, frontend, n8n e workers não têm superfície HTTP nem eventos de domínio.

**Impacto se não resolver:**  
Bloqueio do MVP comercial, atendimento omnichannel e automações n8n.

---

## 2. Objetivo

Entregar API NestJS 10+ tenant-aware com Prisma, JWT auth, CRUD de domínio CRM, outbox RabbitMQ, webhooks Chatwoot/n8n e workers consumidores.

### Fora de escopo

- UI frontend completa (Fase 4 paralelo)
- IA/RAG real (Fase 6)
- SaaS billing completo (Fase 7)

---

## 3. Usuários e papéis

| Ator            | Papel               | Interesse                          |
| --------------- | ------------------- | ---------------------------------- |
| Vendedor        | `sales`             | CRUD leads, oportunidades, tarefas |
| Admin tenant    | `admin`             | Usuários, config, auditoria        |
| n8n Atendimento | serviço (API_TOKEN) | Webhooks → API                     |
| Worker          | serviço interno     | Consumir eventos RabbitMQ          |

---

## 4. Requisitos funcionais

### RF-01 — Autenticação multi-tenant

**Como** usuário, **quero** login com tenant slug + email, **para** isolar dados.

**Critérios de aceite:**

- [x] POST `/auth/register` cria tenant + admin
- [x] POST `/auth/login` retorna JWT com `tenantId`
- [x] Guard rejeita requests sem tenant

### RF-02 — CRUD Leads

- [x] CRUD `/leads` com `tenantId` em todas as queries
- [x] POST `/leads/:id/qualify` publica `lead.qualified`
- [x] Eventos via outbox

### RF-03 — Pipeline e oportunidades

- [x] Pipelines com stages ordenados
- [x] Oportunidades com mudança de estágio e eventos

### RF-04 — Webhooks

- [x] POST `/webhooks/chatwoot` com verificação HMAC
- [x] POST `/webhooks/n8n` com verificação HMAC

### RF-05 — Workers

- [x] Cinco filas: leads, pipeline, billing, ai (stub), audit
- [x] Idempotência por `idempotencyKey`

---

## 5. Requisitos não funcionais

| ID     | Categoria    | Requisito                                   |
| ------ | ------------ | ------------------------------------------- |
| RNF-01 | Multi-tenant | `tenantId` em todas as entidades de domínio |
| RNF-02 | Segurança    | JWT, RBAC, auditoria                        |
| RNF-03 | Eventos      | Outbox → RabbitMQ `crm.events`              |
| RNF-04 | API          | OpenAPI em `/docs`                          |

---

## 6. Integrações e camadas afetadas

- [x] **Backend API** (`backend/`)
- [x] **Workers** (`workers/`)
- [ ] **Frontend** (`frontend/`)
- [x] **n8n** — webhooks inbound only
- [x] **Chatwoot** — webhook inbound

---

## 7. Guardrails

- [x] n8n apenas orquestra (sem regra de negócio)
- [x] Novos eventos no catálogo `docs/events/catalog-v0.md`
- [ ] Quality Gate PASS antes de marcar implementado

---

## 8. Dados e modelo

Ver `backend/prisma/schema.prisma` — Tenant, User, Company, Contact, Lead, Pipeline, PipelineStage, Opportunity, Task, Product, Service, Conversation, AuditLog, OutboxEvent.

---

## 9. Cenários de teste

1. Unit: LeadsService com Prisma mock
2. Unit: FinanceService approve/pay flows
3. Unit: AuthService login/register
4. Unit: TenantGuard isolamento
5. Unit: leads.handler idempotência

---

## 10. Dependências

| Dependência      | Status |
| ---------------- | ------ |
| Fase 1 infra PG  | ⏳     |
| RabbitMQ compose | ⏳     |

---

## Histórico

| Versão | Data       | Alteração               |
| ------ | ---------- | ----------------------- |
| 0.1    | 2026-07-14 | Scaffold backend Fase 4 |
