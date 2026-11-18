# Telegram via Chatwoot — Inova CRM AI

**Spec:** `032-telegram-chatwoot` · mensagens: `033-omnichannel-messages`  
**Canal:** inbox nativo `Channel::Telegram` no Chatwoot `v4.19.1` (`chat-crm`).  
O CRM não chama a Bot API. O token do bot fica só no Chatwoot.

**Prod (2026-11-18):** inbox **CRM Telegram** (id=3, account=1) · bot [@InovaCRMAtendimentoBot](https://t.me/InovaCRMAtendimentoBot) · webhook `https://chat-crm.inovatitech.com.br/webhooks/telegram/{token}` · membros da inbox OK.

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

Script: [`chatwoot/scripts/create_telegram_inbox.rb`](../chatwoot/scripts/create_telegram_inbox.rb) (usa `find_by`, sem `joins(:channel)` polimórfico).

O `create!` do canal chama `getMe` e `setWebhook`. O container `rails` precisa de saída HTTPS para `api.telegram.org`.

Após criar, vincule agentes em Settings → Inboxes → CRM Telegram → Agents (ou `inbox_members` na VPS).

## Menu de comandos (BotFather / API)

```text
start - Iniciar atendimento Inova CRM
ajuda - Como funciona o atendimento
status - Pedir status da solicitação
humano - Falar com um atendente
```

Playbook completo (labels, macros, greeting): [`docs/operations/omnichannel-atendimento.md`](operations/omnichannel-atendimento.md).  
Seed VPS: `chatwoot/scripts/seed_atendimento_playbook.rb`.

## Passo a passo depois do `/start`

1. Abra o bot no Telegram: https://t.me/InovaCRMAtendimentoBot (confira o username — não use outro bot).
2. Envie `/start` **depois** do webhook estar ativo (`getWebhookInfo` com URL `chat-crm…`).
3. Envie uma mensagem de teste, ex.: `Olá, teste CRM`.
4. Em até alguns segundos:
   - Chatwoot → inbox **CRM Telegram** mostra a conversa (+ greeting Inova TI).
   - n8n `lead-inbound` chama a API.
   - CRM → `/atendimento` filtro **Telegram** mostra a conversa + fio.
5. Agente: label (`comercial`/`suporte`/…) → macro `/coleta` ou `/humano` → responder no Chatwoot.
6. Se nada aparecer:
   - Confirme que o `/start` foi no bot **InovaCRMAtendimentoBot**.
   - `getWebhookInfo`: `pending_update_count` e URL correta.
   - Agentes em `inbox_members` da inbox 3.
   - Audit Chatwoot healthy (`bash chatwoot/scripts/audit-crm-chatwoot.sh`).
   - Reenvie a mensagem (updates anteriores ao webhook não são reentregues).

## Uso no CRM

- A pessoa precisa ter aberto o bot (`/start`) antes de o agente conseguir responder.
- O CRM grava `conversations.channel = telegram` e `contacts.telegram_external_id` (id numérico). `@username` é só exibição. O id do Telegram **não** entra em `whatsapp_external_id`.
- `leads.source` continua `CHATWOOT`.
- Visualização: [`docs/operations/omnichannel-atendimento.md`](operations/omnichannel-atendimento.md).

## n8n

Depois do deploy da API, reimportar e reativar:

- `n8n/workflows/lead-inbound.json`
- `n8n/workflows/sync-conversation.json`

Os workflows só encaminham `channel`, `senderIdentifier` e `telegramUsername`. A API decide o campo de identidade. Ver [`n8n/README.md`](../n8n/README.md).

## Fora deste canal

Grupos, canais públicos, menu de comandos e envio direto pela UI do CRM.
