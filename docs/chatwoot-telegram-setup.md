# Telegram via Chatwoot — Inova CRM AI

**Spec:** `032-telegram-chatwoot`  
**Canal:** inbox nativo `Channel::Telegram` no Chatwoot `v4.8.0` (`chat-crm`).  
O CRM não chama a Bot API. O token do bot fica só no Chatwoot.

## Pré-requisitos

1. `@BotFather` → `/newbot` → token. Um bot por account Chatwoot (tenant).
2. No stack Chatwoot, `FRONTEND_URL=https://chat-crm.inovatitech.com.br`. O Chatwoot registra `setWebhook` nesse host (`/webhooks/telegram/{bot_token}`).
3. Webhooks já existentes (`message_created`, `conversation_created`, `conversation_status_changed`) cobrem qualquer inbox. Não criar URL nova e não abrir porta no bloco `9400–9419`.

## Criar a inbox

Painel: Settings → Inboxes → Telegram → colar o token. Nome sugerido: **CRM Telegram**.

Ou, na VPS, com o token só no ambiente (nunca no git):

```bash
cd /opt/inova-crm-ai/chatwoot
TELEGRAM_BOT_TOKEN='…' ACCOUNT_ID=1 TELEGRAM_INBOX_NAME='CRM Telegram' \
  docker compose -f docker-compose.yml -f docker-compose.vps.yml exec -T rails \
  bundle exec rails runner "$(cat scripts/create_telegram_inbox.rb)"
```

Script: [`chatwoot/scripts/create_telegram_inbox.rb`](../chatwoot/scripts/create_telegram_inbox.rb).

O `create!` do canal chama `getMe` e `setWebhook`. O container `rails` precisa de saída HTTPS para `api.telegram.org`.

## Uso

- A pessoa abre o bot e envia `/start` antes de o agente conseguir responder.
- Resposta humana: Chatwoot (botão **Responder no Chatwoot** no CRM). O Chatwoot envia pelo Bot API.
- O CRM grava `conversations.channel = telegram` e `contacts.telegram_external_id` (id numérico). `@username` é só exibição. O id do Telegram **não** entra em `whatsapp_external_id`.
- `leads.source` continua `CHATWOOT`.

## n8n

Depois do deploy da API, reimportar e reativar:

- `n8n/workflows/lead-inbound.json`
- `n8n/workflows/sync-conversation.json`

Os workflows só encaminham `channel`, `senderIdentifier` e `telegramUsername`. A API decide o campo de identidade. Ver [`n8n/README.md`](../n8n/README.md).

## Fora deste canal

Grupos, canais públicos, menu de comandos e envio direto pela UI do CRM.
