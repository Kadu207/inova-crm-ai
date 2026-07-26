# Especificação: Meta Cloud API — cutover WhatsApp (WABA)

**ID:** `027-meta-cloud-api-waba`  
**Status:** aprovado (docs) · **BLOCKED** (execução — aguardando credenciais WABA)  
**Autor:** Squad Build  
**Data:** 2026-07-26  
**Fase do roadmap:** pós-fase · inicia **após** Spec 026 · Versão alvo **1.2.0**

---

## 1. Contexto e problema

WhatsApp operacional hoje via **Evolution (QR)** transitório (ADR 005). O alvo oficial é **Meta Cloud API** no Chatwoot dedicado. Credenciais WABA ainda não disponíveis — por isso o Spec fica na fila, sem cutover.

**Problema:** canal transitório com risco ToS/ban; produto precisa do caminho oficial.

**Impacto:** risco operacional e bloqueio de certificação WhatsApp Business.

---

## 2. Objetivo

Cutover Evolution → inbox Meta Cloud API no Chatwoot, mantendo webhooks n8n → Nest e `source=CHATWOOT` no CRM.

### Fora de escopo

- CRM falando direto com Meta (proibido pela constitution)
- Implementação antes das credenciais WABA
- Mudança de regras de negócio no n8n

---

## 3. Pré-requisitos (bloqueio)

| Credencial                           | Status |
| ------------------------------------ | ------ |
| App Meta Business + produto WhatsApp | ⏳     |
| `WHATSAPP_PHONE_NUMBER` (E.164)      | ⏳     |
| `WHATSAPP_PHONE_NUMBER_ID`           | ⏳     |
| `WHATSAPP_BUSINESS_ACCOUNT_ID`       | ⏳     |
| `WHATSAPP_API_KEY` (token)           | ⏳     |

Docs: [`docs/chatwoot-whatsapp-setup.md`](../../docs/chatwoot-whatsapp-setup.md) § A · Cutover: [`docs/operations/meta-waba-cutover.md`](../../docs/operations/meta-waba-cutover.md).

---

## 4. Requisitos funcionais

### RF-01 — Inbox Meta no Chatwoot

- [ ] Criar inbox via `chatwoot/scripts/create_whatsapp_inbox.rb` com env WABA
- [ ] Webhook Meta → `https://chat-crm.inovatitech.com.br/webhooks/whatsapp/{inbox_channel_id}`

### RF-02 — E2E CRM

- [ ] Mensagem WhatsApp → Chatwoot → n8n → `POST /api/v1/leads/inbound`
- [ ] Lead com `source=CHATWOOT`
- [ ] Atendimento CRM lista conversa

### RF-03 — Desligar Evolution (cutover)

- [ ] Documentar janela de cutover
- [ ] Pausar/remover path Evolution após smoke Meta
- [ ] Atualizar ADR 005 (superseded / transitório encerrado)
- [ ] Baseline + historico → **1.2.0**

---

## 5. Requisitos não funcionais

| ID     | Requisito                                  |
| ------ | ------------------------------------------ |
| RNF-01 | Canais só via Chatwoot                     |
| RNF-02 | Sem publish público novo; Tunnel existente |
| RNF-03 | Gate PASS + smoke E2E documentado          |

---

## 6. Dependências

- Spec **026** concluída (ou em paralelo só docs — **código Meta só com WABA**)
- Credenciais preenchidas no `.env` VPS (Chatwoot)

---

## 7. Definition of Done

- [ ] Inbox Meta ativa e Evolution descontinuado (ou documentado como backup explícito)
- [ ] E2E green
- [ ] Baseline atualizada
- [ ] ADR 005 atualizado
