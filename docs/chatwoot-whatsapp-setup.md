# WhatsApp Cloud API — Chatwoot CRM

## Pré-requisitos Meta

1. App Meta (Business) com produto **WhatsApp**
2. Número de teste ou produção aprovado
3. Valores:
   - `WHATSAPP_PHONE_NUMBER` — E.164 (ex. `+5511999999999`)
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - `WHATSAPP_API_KEY` — User/System token com permissões WhatsApp

## Criar inbox na VPS

Com as variáveis exportadas:

```bash
cd /opt/inova-crm-ai/chatwoot
export WHATSAPP_PHONE_NUMBER='+55...'
export WHATSAPP_PHONE_NUMBER_ID='...'
export WHATSAPP_BUSINESS_ACCOUNT_ID='...'
export WHATSAPP_API_KEY='...'

docker compose -f docker-compose.yml -f docker-compose.vps.yml exec -T \
  -e WHATSAPP_PHONE_NUMBER \
  -e WHATSAPP_PHONE_NUMBER_ID \
  -e WHATSAPP_BUSINESS_ACCOUNT_ID \
  -e WHATSAPP_API_KEY \
  rails bundle exec rails runner /app/../../tmp/create_whatsapp_inbox.rb
```

Ou use o script versionado (copiado para o container):

`chatwoot/scripts/create_whatsapp_inbox.rb`

## Webhook Meta → Chatwoot

No Meta Developer Console, callback URL do WhatsApp:

`https://chat-crm.inovatitech.com.br/webhooks/whatsapp/{inbox_channel_id}`

Token de verificação: o configurado no canal Chatwoot.

## Validação E2E

1. Enviar mensagem do WhatsApp para o número conectado
2. Conversação aparece no Chatwoot (`CRM WhatsApp`)
3. Webhook → n8n → `POST /api/v1/leads/inbound`
4. Lead com `source=CHATWOOT` em https://crm.inovatitech.com.br/leads
