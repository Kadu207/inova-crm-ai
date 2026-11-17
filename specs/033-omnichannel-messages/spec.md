# Especificação: Mensagens omnichannel (WhatsApp e Telegram)

**ID:** `033-omnichannel-messages`  
**Status:** implementado  
**Autor:** Squad Spec  
**Data:** 2026-11-17  
**Fase do roadmap:** pós-fase (1.1.x → 1.2.x)

---

## 1. Contexto e problema

Canais entram pelo Chatwoot → n8n → Nest. Spec 032 já distingue `channel=whatsapp|telegram` e identidades. O inbound ainda **concatena o texto em `leads.notes`**; não há tabela de mensagens; `/atendimento` não mostra o fio. Eventos `conversation.message.*` existem no catálogo e não são publicados.

**Problema:** agente não vê histórico nem origem por mensagem no CRM.

**Impacto se não resolver:** atendimento cego no CRM; notas de lead inchadas; workers AI sem payload de mensagem.

---

## 2. Objetivo

Persistir cada `message_created` do Chatwoot (WhatsApp e Telegram) com origem, idempotência e eventos; exibir filtro e fio em `/atendimento`.

### Fora de escopo

- Graph API / Evolution / Bot API direto no Nest
- Envio pela UI do CRM ou auto-reply IA
- Spec 027 (WABA cutover)
- Grupos, activity, notas privadas
- Download de mídia para MinIO

---

## 3. Usuários e papéis

| Ator   | Papel               | Interesse                                      |
| ------ | ------------------- | ---------------------------------------------- |
| Agente | `support` / `sales` | Filtro e fio WhatsApp/Telegram no Atendimento  |
| n8n    | API_TOKEN           | Encaminhar campos de mensagem sem regra CRM    |
| Ops    | admin               | Inbox Telegram (token) + reimport workflow n8n |

**Tenant:** `conversation_messages.tenant_id` + RLS; lookups sempre com `tenantId`.

---

## 4. Requisitos funcionais

### RF-01 — Persistência de mensagem

**Critérios de aceite:**

- [x] Tabela `conversation_messages` com `tenantId`, vínculo à conversa, `chatwootMessageId` único por tenant
- [x] Direção `inbound`/`outbound` a partir de `messageType` Chatwoot; ignora activity e `private`
- [x] `channel` normalizado; anexos só metadado JSON
- [x] Replay do mesmo `chatwootMessageId` não duplica
- [x] Corpo completo deixa de ir para `leads.notes` (nota curta de ponteiro)

### RF-02 — Tratativa unificada

**Critérios de aceite:**

- [x] `POST /api/v1/leads/inbound` mantém contato + lead aberto + conversa
- [x] Telegram não escreve `whatsappExternalId`; WhatsApp não escreve `telegramExternalId`
- [x] Publica `conversation.message.received` ou `conversation.message.sent`

### RF-03 — Atendimento

**Critérios de aceite:**

- [x] Filtro Todos / WhatsApp / Telegram
- [x] Fio cronológico com selo de origem por mensagem
- [x] CTA **Responder no Chatwoot**

### RF-04 — n8n

**Critérios de aceite:**

- [x] `lead-inbound` encaminha `messageId`, `messageType`, `contentType`, `sentAt`, anexos
- [x] Sem Function/Code com regra de identidade ou direção

---

## 5. Requisitos não funcionais

| ID     | Categoria    | Requisito                         |
| ------ | ------------ | --------------------------------- |
| RNF-01 | Multi-tenant | `tenantId` + RLS na nova tabela   |
| RNF-02 | n8n          | Só orquestra HTTP                 |
| RNF-03 | Canais       | Só via Chatwoot                   |
| RNF-04 | Gate         | `npm run gate` PASS antes de DONE |

---

## 6. Integrações e camadas afetadas

- [x] **Frontend** (`frontend/`)
- [x] **Backend API** (`backend/`)
- [ ] **Workers**
- [ ] **AI**
- [x] **n8n** — só campos
- [x] **Chatwoot** — webhooks existentes
- [ ] **Infra**

| Nome                        | Método / tipo | Descrição                  |
| --------------------------- | ------------- | -------------------------- |
| `/api/v1/leads/inbound`     | POST          | Upsert + persist message   |
| `/api/v1/conversations`     | GET           | Lista + filtro `?channel=` |
| `/api/v1/conversations/:id` | GET           | Detalhe + messages         |
| `conversation.message.*`    | event         | received / sent            |

---

## 7. Guardrails e aprovações

- [ ] Requer humano no loop? Resposta ao cliente continua no Chatwoot
- [x] Eventos já no catálogo — publicar de fato
- [x] n8n apenas orquestra
- [x] Quality Gate PASS

---

## 8. Dados e modelo

```prisma
model ConversationMessage {
  id                String   @id @default(cuid())
  tenantId          String   @map("tenant_id")
  conversationId    String   @map("conversation_id")
  chatwootMessageId Int?     @map("chatwoot_message_id")
  direction         String   // inbound | outbound
  channel           String?
  body              String?
  contentType       String?  @map("content_type")
  attachments       Json?
  sentAt            DateTime @map("sent_at")
  createdAt         DateTime @default(now()) @map("created_at")

  @@unique([tenantId, chatwootMessageId])
  @@index([tenantId, conversationId, sentAt])
  @@map("conversation_messages")
}
```

---

## 9. Cenários de teste (TDD)

1. Inbound WhatsApp cria mensagem `inbound` + evento `received`
2. Replay mesmo `chatwootMessageId` → uma linha
3. Telegram não grava `whatsappExternalId`
4. Tenant A não lê mensagem do tenant B
5. Activity / private → não persiste

---

## 10. Dependências

| Dependência        | Spec / componente | Status  |
| ------------------ | ----------------- | ------- |
| Spec 032 Telegram  | canal + identity  | DONE    |
| Spec 027 WABA      | cutover Meta      | BLOCKED |
| Inbox Telegram ops | token BotFather   | humano  |

---

## 11. Referências

- [Constituição](../../.specify/memory/constitution.md)
- [Catálogo de eventos](../../docs/events/catalog-v0.md)
- [Integração Chatwoot](../../docs/integracao-chatwoot.md)
- Spec 032 · Spec 027

---

## Histórico de revisões

| Versão | Data       | Autor      | Alteração         |
| ------ | ---------- | ---------- | ----------------- |
| 0.1    | 2026-11-17 | Squad Spec | Rascunho inicial  |
| 1.0    | 2026-11-17 | Squad Spec | Aprovado p/ build |
