# Arquitetura Event-Driven — Inova CRM AI

**Volume:** 05  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Define o modelo event-driven com RabbitMQ, outbox, workers, papéis do Redis e integração com n8n no limiar externo.

---

## Sumário

1. [Propósito](#propósito)
2. [Visão geral](#visão-geral)
3. [Outbox pattern](#outbox-pattern)
4. [RabbitMQ](#rabbitmq)
5. [Redis (não é event bus)](#redis-não-é-event-bus)
6. [Workers](#workers)
7. [Catálogo de eventos](#catálogo-de-eventos)
8. [n8n no limiar](#n8n-no-limiar)
9. [ADR](#adr)

---

## Visão geral

```
[API write] → [DB + outbox] → [outbox worker] → [RabbitMQ exchange]
                                                      ↓
                                            [domain workers]
```

## Outbox pattern

Transação única: persistir entidade + registro outbox. Worker publica e marca `published_at`.

## RabbitMQ

- Exchange por domínio ou topic único `crm.events`
- Filas por consumer (`worker-crm-leads`, etc.)
- UI admin: porta host `9407` (VPN/SSH only)

## Redis (não é event bus)

| Uso                 | OK  |
| ------------------- | --- |
| Cache de leitura    | ✅  |
| Sessão / rate-limit | ✅  |
| Fila n8n (Bull)     | ✅  |
| Eventos de domínio  | ❌  |

## Workers

| Worker              | Eventos                 |
| ------------------- | ----------------------- |
| worker-crm-leads    | `lead.*`                |
| worker-crm-pipeline | `opportunity.*`         |
| worker-crm-billing  | `invoice.*`             |
| worker-crm-ai       | `ai.*`                  |
| worker-crm-audit    | todos (auditoria async) |

## Catálogo de eventos

[events/catalog-v0.md](./events/catalog-v0.md)

## n8n no limiar

n8n recebe webhooks externos e chama API — **não** consome filas RabbitMQ de domínio.

## ADR

[004-redis-vs-rabbitmq.md](./adr/004-redis-vs-rabbitmq.md)
