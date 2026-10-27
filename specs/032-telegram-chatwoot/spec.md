# Especificação: Telegram via Chatwoot

**ID:** `032-telegram-chatwoot`  
**Status:** implementado  
**Autor:** Squad Build  
**Data:** 2026-10-27  
**Fase do roadmap:** pós-fase (1.1.x)

---

## 1. Contexto e problema

Canais do CRM entram só pelo Chatwoot (`chat-crm`, v4.8.0). WhatsApp, email, Instagram e Facebook já seguem esse caminho. Telegram existe como `Channel::Telegram` no Chatwoot, mas o CRM grava toda conversa como `channel=chatwoot` e joga `sender.identifier` em `contacts.whatsapp_external_id`.

**Problema:** um id numérico do Telegram seria tratado como identidade de WhatsApp, e o atendimento não distingue o canal.

**Impacto se não resolver:** contato errado no dedupe, agente sem saber que a conversa é Telegram.

---

## 2. Objetivo

Inbox Telegram no Chatwoot (bot do BotFather) reusa os webhooks atuais. O CRM mostra **Telegram** em `/atendimento` e guarda o id do usuário Telegram separado do WhatsApp.

### Fora de escopo

- Bot API, MTProto ou userbot direto no Nest, n8n ou workers
- Grupos, canais públicos e comandos além do `/start` exigido pelo Telegram
- Envio de mensagem a partir da UI do CRM
- Spec 027 (WABA) e inbox Evolution

---

## 3. Usuários e papéis

| Ator   | Papel               | Interesse                                               |
| ------ | ------------------- | ------------------------------------------------------- |
| Agente | `support` / `sales` | Ver canal Telegram e abrir a conversa no Chatwoot       |
| n8n    | API_TOKEN           | Encaminhar channel + identifier, sem decidir identidade |
| Ops    | admin               | Criar inbox com token só no Chatwoot                    |

**Tenant:** `telegram_external_id` é buscado sempre com `tenantId`.

---

## 4. Requisitos funcionais

### RF-01 — Canal normalizado

**Critérios de aceite:**

- [x] `Channel::Telegram` (e `inbox.channel_type` equivalente) vira `conversations.channel = telegram`
- [x] Upsert de conversa atualiza o canal quando o payload traz `channel`
- [x] Payload sem canal continua `chatwoot` (compatível com n8n antigo)
- [x] `leads.source` permanece `CHATWOOT`

### RF-02 — Identidade Telegram

**Critérios de aceite:**

- [x] Contato Telegram persiste `telegram_external_id` e, se houver, `telegram_username` sem `@`
- [x] Esse id não é gravado em `whatsapp_external_id`
- [x] WhatsApp Cloud e Evolution (`Channel::Api` / `whatsappExternalId` legado) continuam no campo WhatsApp
- [x] Lookup de contato Telegram filtra `tenantId`

### RF-03 — Atendimento

**Critérios de aceite:**

- [x] `/atendimento` rotula `telegram` como **Telegram**
- [x] `@username` aparece quando o contato tem `telegramUsername`
- [x] Ação de resposta continua “Responder no Chatwoot”

### RF-04 — Orquestração

**Critérios de aceite:**

- [x] `lead-inbound` e `sync-conversation` encaminham `channel`, `senderIdentifier` e `telegramUsername`
- [x] Sem nó Function/Code com regra de identidade
- [x] Sem porta nova e sem token de bot no git

---

## 5. Requisitos não funcionais

| ID     | Requisito                                             |
| ------ | ----------------------------------------------------- |
| RNF-01 | tenantId + índice `(tenant_id, telegram_external_id)` |
| RNF-02 | n8n só orquestra                                      |
| RNF-03 | canais só via Chatwoot                                |
| RNF-04 | Quality Gate PASS antes de DONE                       |

---

## 6. Camadas

- [x] Frontend (`AtendimentoClient`)
- [x] Backend (leads inbound + conversations sync)
- [ ] Workers
- [x] n8n (mapeamento de campos)
- [x] Docs + constituição §5
