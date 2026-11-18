# Omnichannel — visualizar WhatsApp e Telegram

**Specs:** 032 (Telegram) · 033 (mensagens)  
**UI CRM:** https://crm.inovatitech.com.br/atendimento  
**Chatwoot:** https://chat-crm.inovatitech.com.br  
**Bot Telegram:** [@InovaCRMAtendimentoBot](https://t.me/InovaCRMAtendimentoBot)

## Onde ver as mensagens

### 1) CRM — `/atendimento` (visão comercial)

1. Abra https://crm.inovatitech.com.br/login e entre com usuário do tenant.
2. Menu **Atendimento**.
3. Use o filtro de canal:
   - **Todos** — WA + TG (+ legado)
   - **WhatsApp** — Evolution (`Channel::Api` normalizado para `whatsapp`) e futuro Meta
   - **Telegram** — inbox `CRM Telegram`
4. Clique em uma conversa → painel direito mostra o **fio** (`conversation_messages`) com selo de origem e direção (entrada/saída).
5. Para responder o cliente no canal, use **Responder no Chatwoot** (o CRM não envia direto ao WhatsApp/Telegram).

### 2) Chatwoot — inbox operacional

1. Abra https://chat-crm.inovatitech.com.br
2. Inbox **CRM WhatsApp Evolution** → mensagens do número pareado (Evolution `crm-whatsapp`).
3. Inbox **CRM Telegram** → conversas do bot `@InovaCRMAtendimentoBot`.
4. Agentes precisam estar em **inbox_members** (account 1: admin, `inovatidev@gmail.com`, `agent@demo…`).

### 3) Fluxo de dados

```
WhatsApp (celular) → Evolution → Chatwoot inbox WA
Telegram (bot)     → webhook Chatwoot → inbox TG
        ↓
Chatwoot webhooks → n8n (lead-inbound / sync-conversation)
        ↓
API Nest → conversations + conversation_messages → /atendimento
```

## Validação rápida (VPS)

```bash
# WhatsApp Evolution
curl -sS -H "apikey: $EVOLUTION_API_KEY" \
  http://127.0.0.1:9416/instance/connectionState/crm-whatsapp
# esperado: "state":"open"

# Telegram webhook (mascarar token na saída)
TOKEN=$(docker exec crm_cw_postgres psql -U crm_chatwoot -d chatwoot_crm -Atc \
  "SELECT bot_token FROM channel_telegram LIMIT 1;")
curl -sS "https://api.telegram.org/bot${TOKEN}/getWebhookInfo" \
  | sed -E 's/[0-9]{8,}:[A-Za-z0-9_-]+/<TOKEN>/g'
# esperado: url = https://chat-crm.inovatitech.com.br/webhooks/telegram/<TOKEN>
#           pending_update_count = 0

# Contagens Chatwoot
docker exec crm_cw_postgres psql -U crm_chatwoot -d chatwoot_crm -c \
  "SELECT inbox_id, COUNT(*) FROM conversations GROUP BY 1 ORDER BY 1;"

# Contagens CRM
docker exec inova-crm-postgres psql -U inova -d crm -c \
  "SELECT channel, direction, COUNT(*) FROM conversation_messages GROUP BY 1,2 ORDER BY 1,2;"
```

## Estado prod (2026-11-18)

| Item         | Valor                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------- |
| Chatwoot     | `v4.19.1` · healthy · PID ok                                                             |
| WA Evolution | instância `crm-whatsapp` · **open** · inbox id **2**                                     |
| Telegram     | inbox id **3** · bot `InovaCRMAtendimentoBot` · webhook OK                               |
| CRM messages | canal `whatsapp` (remap `api`→`whatsapp`) · Telegram ainda 0 até 1º `/start` pós-webhook |
| n8n          | `lead-inbound` + `sync-conversation` ativos                                              |

## Nota — resposta agente no WhatsApp (Evolution)

Falha típica ao responder no Chatwoot: `Hostname '…' has no public ip addresses` (SafeFetch SSRF desde Chatwoot ~v4.14).

1. `SAFE_FETCH_ALLOW_PRIVATE_NETWORK=true` no `.env` do Chatwoot (+ recreate rails/sidekiq).
2. Webhook da inbox API:

`http://evolution.internal:8080/chatwoot/webhook/crm-whatsapp`

Inbound (celular → CRM) continua via Evolution → Chatwoot API e não depende desse URL.
