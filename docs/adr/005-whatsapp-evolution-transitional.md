# ADR 005 — WhatsApp Evolution (QR) transitório + Meta Oficial como alvo

**Status:** aceito  
**Data:** 2026-07-20  
**Decisores:** Inova TI / Squad CRM

---

## Contexto

A integração WhatsApp Oficial (Meta Cloud API) exige App Business, WABA e tokens. Enquanto essas credenciais não estão disponíveis, o time precisa de um caminho operacional de atendimento.

Evolution API (Baileys/QR) permite conectar um número via dispositivo vinculado, mas **viola os Termos de Serviço da Meta** e corre risco de banimento do número.

## Decisão

1. **Canal único permanece o Chatwoot** — agentes e CRM nunca falam com Evolution ou Meta direto.
2. **Caminho transitório:** Evolution API (profile Docker `whatsapp-evolution`, porta host `127.0.0.1:9416`) → Chatwoot → n8n → NestJS.
3. **Caminho alvo:** WhatsApp Cloud API Oficial → Chatwoot (script `create_whatsapp_inbox.rb`) → mesmos webhooks n8n/CRM.
4. **Proibido:** Evolution → n8n/API com regras de negócio; Baileys solto sem Chatwoot; expor Evolution na internet.

## Consequências

### Positivas

- Atendimento e funil CRM funcionam antes das credenciais Meta
- Cutover para Oficial não muda contrato CRM (`source=CHATWOOT`)
- Isolamento de risco: profile opcional, localhost only

### Negativas

- Risco de ban / instabilidade no modo QR
- Dois stacks a operar até o cutover
- Sem templates oficiais Meta no caminho transitório

## Cutover (resumo)

1. Desligar profile Evolution e inbox Evolution no Chatwoot
2. Criar inbox Cloud API (`create_whatsapp_inbox.rb`)
3. Configurar webhook Meta → Chatwoot
4. Validar E2E lead/conversa
5. Remover volumes/containers Evolution

Detalhes: [`docs/chatwoot-whatsapp-setup.md`](../chatwoot-whatsapp-setup.md).

## Alternativas rejeitadas

- Baileys/raw WhatsApp Web no CRM ou n8n
- Evolution como canal agent-facing (bypass Chatwoot)
- Manter QR em produção sem plano de cutover Meta
