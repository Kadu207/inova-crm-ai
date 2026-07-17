# Arquitetura Backend — Inova CRM AI

**Volume:** 03  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Define a arquitetura NestJS modular (Clean Architecture + DDD), módulos, autenticação, outbox e exposição OpenAPI.

---

## Sumário

1. [Propósito](#propósito)
2. [Stack](#stack)
3. [Estrutura modular](#estrutura-modular)
4. [Camadas (Clean/DDD)](#camadas-cleanddd)
5. [Autenticação e RBAC](#autenticação-e-rbac)
6. [Outbox e eventos](#outbox-e-eventos)
7. [OpenAPI](#openapi)
8. [TDD e Quality Gate](#tdd-e-quality-gate)

---

## Stack

- NestJS + TypeScript
- Prisma ORM
- PostgreSQL com RLS
- class-validator / Zod para DTOs
- Swagger/OpenAPI

## Estrutura modular

```
backend/
  src/
    modules/
      leads/
      contacts/
      opportunities/
      conversations/
      billing/
      platform/
    common/        # guards, interceptors, tenant context
    infrastructure/ # prisma, rabbitmq, redis, minio
  prisma/
```

## Camadas (Clean/DDD)

| Camada         | Conteúdo                               |
| -------------- | -------------------------------------- |
| Domain         | Entidades, value objects, regras puras |
| Application    | Use cases, services                    |
| Infrastructure | Prisma, messaging, storage             |
| Presentation   | Controllers, DTOs, guards              |

## Autenticação e RBAC

- JWT usuário humano + `API_TOKEN` para n8n/workers
- Tenant middleware obrigatório
- Papéis: `admin`, `manager`, `sales`, `support`, `viewer`

## Outbox e eventos

Padrão outbox → RabbitMQ. Catálogo: [events/catalog-v0.md](./events/catalog-v0.md).

## OpenAPI

Ver [apis-openapi.md](./apis-openapi.md). Host: `api-crm.inovatitech.com.br` (porta `9401`).

## TDD e Quality Gate

Jest/Vitest; cobertura ≥ 70% por bounded context; gate obrigatório.
