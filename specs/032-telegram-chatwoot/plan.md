# Plano de implementação: Telegram via Chatwoot

**Spec:** `032-telegram-chatwoot` → [spec.md](./spec.md)  
**Status:** concluído  
**Autor:** Squad Build  
**Data:** 2026-10-27

---

## 1. Resumo executivo

O Chatwoot já fala com o Bot API. A API Nest passa a normalizar o canal e a gravar `telegram_external_id` sem misturar com WhatsApp. O n8n só repassa campos do webhook. `/atendimento` mostra o rótulo Telegram.

**Entrega mínima (MVP):** inbound `Channel::Telegram` cria contato com id Telegram, conversa `channel=telegram`, e a lista de atendimento exibe **Telegram**.

---

## 2. Alinhamento com a constituição

| Princípio         | Como este plano respeita                           |
| ----------------- | -------------------------------------------------- |
| Incremental       | Inbox Chatwoot + identidade no CRM; sem stack novo |
| API/toolbelt only | Decisão de campo fica no Nest                      |
| Tenant-first      | Índice e lookup por `tenantId`                     |
| n8n orquestrador  | Set + HTTP; sem Function/Code                      |
| TDD               | `chatwoot-channel.spec.ts` + inbound/sync          |
| Quality Gate      | PASS antes de DONE                                 |

---

## 3. Arquitetura da solução

```
Telegram user → Bot API → Chatwoot inbox
  → webhook → n8n (channel, senderIdentifier, telegramUsername)
  → POST /v1/leads/inbound e /v1/conversations/sync
  → Contact.telegramExternalId + Conversation.channel=telegram
Agente responde no Chatwoot → Bot API
```

### Componentes tocados

| Caminho                                              | Mudança                     |
| ---------------------------------------------------- | --------------------------- |
| `backend/prisma/schema.prisma`                       | colunas Telegram no Contact |
| `backend/src/common/chatwoot-channel.ts`             | normalização e roteamento   |
| `backend/src/leads/leads.service.ts`                 | inbound                     |
| `backend/src/conversations/conversations.service.ts` | sync                        |
| `n8n/workflows/*.json`                               | encaminhar campos           |
| `frontend/components/AtendimentoClient.tsx`          | rótulo                      |
| `docs/chatwoot-telegram-setup.md`                    | runbook                     |
| `chatwoot/scripts/create_telegram_inbox.rb`          | inbox reproduzível          |

---

## 4. Fases

1. Schema + helper puro
2. DTOs e services
3. n8n + UI + docs
4. Testes e gate
5. Delivery: migrate VPS, imagens CI, reimport n8n (token do bot é passo humano)
