# Spec 027 — Cutover Meta Cloud API (WABA)

**Status:** READY (docs) · **BLOCKED** (execução) até credenciais  
**Spec:** [`specs/027-meta-cloud-api-waba/`](../../specs/027-meta-cloud-api-waba/)  
**Setup:** [`docs/chatwoot-whatsapp-setup.md`](../chatwoot-whatsapp-setup.md) § A · ADR [`005`](../adr/005-whatsapp-evolution-transitional.md)

---

## Bloqueio (cole aqui quando tiver)

| Variável                       | Valor                          | OK? |
| ------------------------------ | ------------------------------ | --- |
| `WHATSAPP_PHONE_NUMBER`        | E.164 `+55…`                   | ⏳  |
| `WHATSAPP_PHONE_NUMBER_ID`     | Meta Phone Number ID           | ⏳  |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA ID                        | ⏳  |
| `WHATSAPP_API_KEY`             | token permanente / system user | ⏳  |

**Não commitar secrets.** Guardar só no cofre VPS / `.env` Chatwoot (fora do git).

---

## Checklist Meta Developer (antes do cutover)

1. [ ] App Business com produto **WhatsApp**
2. [ ] Número de teste **ou** produção aprovado
3. [ ] Permissões do token: mensagens WhatsApp (Cloud API)
4. [ ] Anotar Phone Number ID + WABA ID + token
5. [ ] Planejar janela de cutover (Evolution offline temporário)

---

## Execução na VPS (quando desbloqueado)

### 1) Criar inbox Meta no Chatwoot

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

Anote o `inbox_channel_id` retornado.

### 2) Webhook no Meta

Callback:

`https://chat-crm.inovatitech.com.br/webhooks/whatsapp/{inbox_channel_id}`

Token de verificação = o do canal Chatwoot.

### 3) Smoke E2E

1. Mensagem WhatsApp → Chatwoot (`CRM WhatsApp`)
2. n8n → `POST /api/v1/leads/inbound`
3. Lead `source=CHATWOOT` em https://crm.inovatitech.com.br/leads
4. Conversa visível em Atendimento

### 4) Desligar Evolution (após smoke Meta green)

```bash
cd /opt/inova-crm-ai/chatwoot
# parar profile transitório (ajuste se usou nomes diferentes)
docker compose -f docker-compose.yml -f docker-compose.vps.yml \
  -f docker-compose.evolution.yml --profile whatsapp-evolution \
  --env-file .env --env-file evolution.env down
```

- Desativar/remover inbox Evolution no Chatwoot UI
- Atualizar ADR 005 → status _superseded_ / transitório encerrado
- Baseline + `docs/historico-versoes.md` → **1.2.0**
- `npm run gate` se houver mudança de docs/código no repo

---

## Fora de escopo

- CRM ou n8n falando direto com Meta
- Regras de negócio em Function/Code no n8n
- Cutover sem smoke E2E

---

## Próximo gatilho

Quando as 4 variáveis WABA estiverem preenchidas, diga: **“WABA pronto — executar Spec 027”**.
