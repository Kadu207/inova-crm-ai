# WhatsApp — Chatwoot CRM (dual-path)

**ADR:** [`docs/adr/005-whatsapp-evolution-transitional.md`](adr/005-whatsapp-evolution-transitional.md)

Dois caminhos chegam ao **mesmo Chatwoot** e aos **mesmos webhooks n8n → Nest**. O CRM sempre vê `source=CHATWOOT`.

| Caminho                              | Quando usar                          | Transporte              |
| ------------------------------------ | ------------------------------------ | ----------------------- |
| **A — Meta Oficial** (alvo)          | Credenciais Cloud API disponíveis    | WhatsApp Cloud API      |
| **B — Evolution / QR** (transitório) | Sem Meta ainda; aceite risco ToS/ban | Evolution API (Baileys) |

---

## A — Oficial (Meta Cloud API)

### Pré-requisitos Meta

1. App Meta (Business) com produto **WhatsApp**
2. Número de teste ou produção aprovado
3. Valores:
   - `WHATSAPP_PHONE_NUMBER` — E.164 (ex. `+5511999999999`)
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - `WHATSAPP_API_KEY` — User/System token com permissões WhatsApp

### Criar inbox na VPS

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
  rails bundle exec rails runner "$(cat scripts/create_whatsapp_inbox.rb)"
```

Script versionado: [`chatwoot/scripts/create_whatsapp_inbox.rb`](../chatwoot/scripts/create_whatsapp_inbox.rb).

### Webhook Meta → Chatwoot

No Meta Developer Console, callback URL do WhatsApp:

`https://chat-crm.inovatitech.com.br/webhooks/whatsapp/{inbox_channel_id}`

Token de verificação: o configurado no canal Chatwoot.

### Validação E2E (Meta)

1. Enviar mensagem do WhatsApp para o número conectado
2. Conversação aparece no Chatwoot (`CRM WhatsApp`)
3. Webhook → n8n → `POST /api/v1/leads/inbound`
4. Lead com `source=CHATWOOT` em https://crm.inovatitech.com.br/leads

---

## B — Transitório (Evolution API + QR)

> **Aviso:** modo não oficial (ToS Meta). Usar só até o cutover Oficial. Porta host `127.0.0.1:9416` — sem publish público.

### Subir stack (profile opcional)

```bash
cd chatwoot
cp evolution.env.example evolution.env   # editar keys; aspas em CHATWOOT_INBOX_NAME
docker compose -f docker-compose.yml -f docker-compose.vps.yml \
  -f docker-compose.evolution.yml --profile whatsapp-evolution \
  --env-file .env --env-file evolution.env up -d
```

Compose: [`chatwoot/docker-compose.evolution.yml`](../chatwoot/docker-compose.evolution.yml).

### Criar instância + QR + Chatwoot

```bash
# Exporte CHATWOOT_ACCOUNT_ID, CHATWOOT_TOKEN, EVOLUTION_API_KEY
./scripts/setup-evolution-instance.sh
```

O script:

1. Cria instância Evolution (`POST /instance/create`)
2. Imprime/base64 do QR (`GET /instance/connect/{name}`)
3. Configura integração Chatwoot (`POST /chatwoot/set/{name}`)

Fluxo: **Celular (QR) → Evolution → Chatwoot → n8n → Nest**.

### Validação E2E (Evolution)

1. Escanear QR no WhatsApp (Dispositivos vinculados)
2. Mensagem chega no inbox Chatwoot criado pela Evolution
3. Mesmos webhooks n8n / leads CRM

---

## Checklist de cutover Evolution → Meta Oficial

- [ ] Pausar novas campanhas no número QR
- [ ] Documentar `inbox_id` Evolution a desativar
- [ ] `docker compose ... --profile whatsapp-evolution down` (e volumes se não precisar da sessão)
- [ ] Criar inbox Cloud API (seção A) com o **mesmo** ou novo número aprovado na Meta
- [ ] Configurar webhook Meta → Chatwoot
- [ ] Validar E2E lead + sync conversa + qualify/convert
- [ ] Remover integração Evolution do Chatwoot / archive inbox QR
- [ ] Atualizar runbook ops: provedor ativo = `meta_cloud`

CRM **não** muda: `Contact.whatsappExternalId` (wa_id / jid / futuro BSUID) e `source=CHATWOOT` permanecem.
