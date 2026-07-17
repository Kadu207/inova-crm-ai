# Catálogo de Eventos v0 — Inova CRM AI

**Versão:** 0.1  
**Transporte:** RabbitMQ (não Redis)  
**Padrão:** outbox → exchange `crm.events` (topic)

Todo evento **deve** incluir: `eventType`, `tenantId`, `correlationId`, `idempotencyKey`, `timestamp`, `payload`.

---

## Envelope base

```json
{
  "eventType": "domain.action",
  "tenantId": "cuid",
  "correlationId": "uuid",
  "idempotencyKey": "string",
  "timestamp": "2026-07-14T12:00:00.000Z",
  "payload": {}
}
```

---

## lead.*

| Evento           | Publisher         | Consumers                          | Descrição               |
| ---------------- | ----------------- | ---------------------------------- | ----------------------- |
| `lead.created`   | API (POST /leads) | worker-crm-leads, worker-crm-audit | Novo lead capturado     |
| `lead.updated`   | API               | worker-crm-leads                   | Dados do lead alterados |
| `lead.qualified` | API               | worker-crm-pipeline, worker-crm-ai | Lead qualificado        |
| `lead.converted` | API               | worker-crm-pipeline                | Lead virou oportunidade |
| `lead.deleted`   | API               | worker-crm-audit                   | Soft delete (LGPD)      |

### Payload exemplo — `lead.created`

```json
{
  "leadId": "cuid",
  "source": "chatwoot",
  "email": "opcional",
  "phone": "opcional",
  "assignedTo": "userId ou null"
}
```

---

## contact.*

| Evento            | Publisher | Consumers        | Descrição                   |
| ----------------- | --------- | ---------------- | --------------------------- |
| `contact.created` | API       | worker-crm-audit | Novo contato                |
| `contact.updated` | API       | worker-crm-audit | Contato atualizado          |
| `contact.merged`  | API       | worker-crm-leads | Duplicatas fundidas         |
| `company.created` | API       | worker-crm-audit | Nova empresa                |
| `company.linked`  | API       | worker-crm-audit | Contato vinculado a empresa |

---

## opportunity.*

| Evento                      | Publisher           | Consumers                            | Descrição               |
| --------------------------- | ------------------- | ------------------------------------ | ----------------------- |
| `opportunity.created`       | API                 | worker-crm-pipeline                  | Nova oportunidade       |
| `opportunity.stage.changed` | API                 | worker-crm-pipeline                  | Mudança no funil Kanban |
| `opportunity.won`           | API                 | worker-crm-billing, worker-crm-audit | Ganha                   |
| `opportunity.lost`          | API                 | worker-crm-audit                     | Perdida                 |
| `opportunity.sla.breached`  | worker-crm-pipeline | n8n (notify only)                    | SLA estourado           |

---

## conversation.*

| Evento                          | Publisher           | Consumers                       | Descrição           |
| ------------------------------- | ------------------- | ------------------------------- | ------------------- |
| `conversation.created`          | API (sync Chatwoot) | worker-crm-leads                | Nova conversa       |
| `conversation.message.received` | API                 | worker-crm-leads, worker-crm-ai | Mensagem inbound    |
| `conversation.message.sent`     | API                 | worker-crm-audit                | Mensagem outbound   |
| `conversation.assigned`         | API                 | worker-crm-audit                | Atribuição a agente |
| `conversation.resolved`         | API                 | worker-crm-pipeline             | Encerrada           |

---

## invoice.*

| Evento             | Publisher          | Consumers          | Descrição                |
| ------------------ | ------------------ | ------------------ | ------------------------ |
| `invoice.created`  | API                | worker-crm-billing | Fatura criada (rascunho) |
| `invoice.approved` | API                | worker-crm-billing | Humano aprovou (HITL)    |
| `invoice.sent`     | API                | worker-crm-audit   | Enviada ao cliente       |
| `invoice.paid`     | API                | worker-crm-billing | Pagamento confirmado     |
| `invoice.overdue`  | worker-crm-billing | n8n (notify only)  | Vencida                  |

---

## ai.*

| Evento                       | Publisher     | Consumers        | Descrição            |
| ---------------------------- | ------------- | ---------------- | -------------------- |
| `ai.qualification.requested` | API           | worker-crm-ai    | Job de qualificação  |
| `ai.qualification.completed` | worker-crm-ai | worker-crm-leads | Score disponível     |
| `ai.suggestion.created`      | worker-crm-ai | API (persist)    | Sugestão para humano |
| `ai.rag.index.requested`     | API           | worker-crm-ai    | Indexar documento    |
| `ai.rag.index.completed`     | worker-crm-ai | worker-crm-audit | Indexação concluída  |

---

## Regras

1. Novo evento → PR atualizando este catálogo **antes** do código publisher.
2. `tenantId` obrigatório — consumer rejeita sem tenant.
3. Idempotência via `idempotencyKey` (store Redis ou DB por consumer).
4. n8n só recebe notificações no limiar (`*.sla.breached`, `invoice.overdue`) — via webhook HTTP, não consumer Rabbit direto.
5. Redis **não** transporta estes eventos.

---

## Referências

- [arquitetura-event-driven.md](../arquitetura-event-driven.md)
- [ADR 004](../adr/004-redis-vs-rabbitmq.md)
- `.cursor/rules/events.mdc`
