# Omnichannel — visualizar WhatsApp e Telegram

**Specs:** 032 (Telegram) · 033 (mensagens) · playbook ops 2026-11-18 · Spec **034** (agent-assist, fila)  
**UI CRM:** https://crm.inovatitech.com.br/atendimento  
**Chatwoot:** https://chat-crm.inovatitech.com.br  
**Bot Telegram:** [@InovaCRMAtendimentoBot](https://t.me/InovaCRMAtendimentoBot)

## Playbook de atendimento Inova TI (Fase 1)

Canal único de verdade operacional: **Chatwoot**. CRM (`/atendimento`) é visão comercial + fio. Respostas ao cliente **só** pelo Chatwoot.

### Decisões

| Canal              | Modo agora              | IA                                                          |
| ------------------ | ----------------------- | ----------------------------------------------------------- |
| WhatsApp Evolution | Humano + CRM            | Sem bot IA próprio (Meta AI oficial só pós Spec 027 / WABA) |
| Telegram bot       | Menu + triagem + humano | Greeting + comandos; sem AgentBot                           |

### Fluxo comercial (WA e TG)

1. **Entrada** — cliente fala no canal (TG: `/start` primeiro).
2. **Triagem** — aplicar label: `comercial` · `suporte` · `financeiro` · `humano`.
3. **Coleta mínima** — nome, empresa, telefone ou @Telegram, necessidade.
4. **Handoff** — assign team **Atendimento** (ou agente); responder no Chatwoot.
5. **CRM** — conversa espelhada em `/atendimento` (filtro WhatsApp/Telegram); qualificar lead/oportunidade.
6. **Fechamento** — label `resolvido` · `ganho` · `perdido` + nota privada no Chatwoot.

### Labels (account 1)

| Title        | Uso                 |
| ------------ | ------------------- |
| `comercial`  | Vendas / proposta   |
| `suporte`    | Técnico / pós-venda |
| `financeiro` | Cobrança / NF       |
| `humano`     | Pediu atendente     |
| `resolvido`  | Encerrado sem venda |
| `ganho`      | Fechou negócio      |
| `perdido`    | Não avançou         |

### Team

- **Atendimento** — auto-assign on; membros = users da account 1 com `inbox_members` nas inboxes 2 e 3.

### Macros (canned responses)

| short_code   | Uso                     |
| ------------ | ----------------------- |
| `boasvindas` | Saudação Inova TI       |
| `humano`     | Confirma handoff humano |
| `coleta`     | Pede dados mínimos      |
| `fechamento` | Encerramento cordial    |

No Chatwoot: digite `/` + short_code na caixa de resposta.

### Telegram — comandos do bot

No BotFather (ou `setMyCommands` na API):

```text
start - Iniciar atendimento Inova CRM
ajuda - Como funciona o atendimento
status - Pedir status da solicitação
humano - Falar com um atendente
```

Greeting inbox **CRM Telegram** (e espelho WA): texto Inova TI + “descreva sua necessidade ou digite /humano”.

### WhatsApp (Evolution)

- Mesmas labels / team / macros.
- Priorizar conversas **1:1**; grupos são ruído — política de quais acompanhar fica com o dono.
- Sem AgentBot no inbox Evolution.
- Reply: Chatwoot → `http://evolution.internal:8080/chatwoot/webhook/crm-whatsapp` (URL Docker interna).

### Como o agente trabalha no dia a dia

1. Chatwoot: abrir inbox do canal → ler → label → `/coleta` ou `/humano` se preciso → responder.
2. CRM: `/atendimento` → filtro do canal → conferir fio → **Responder no Chatwoot** → criar/atualizar lead.
3. Fechar: label de fechamento + resolver conversa no Chatwoot.

### Seed / manutenção (VPS)

```bash
cd /opt/inova-crm-ai/chatwoot
docker compose -f docker-compose.yml -f docker-compose.vps.yml exec -T rails \
  bundle exec rails runner "$(cat scripts/seed_atendimento_playbook.rb)"
```

Script: [`chatwoot/scripts/seed_atendimento_playbook.rb`](../../chatwoot/scripts/seed_atendimento_playbook.rb).

### Checklist aceite Fase 1

- [x] Labels / team / macros no Chatwoot account 1
- [x] Greeting WA + TG + comandos bot
- [ ] 1ª mensagem TG E2E no CRM (humano: `/start` no bot)
- [ ] Reply WA 1:1 validado pelo agente após seed
- [x] Este playbook publicado

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

| Item         | Valor                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Chatwoot     | `v4.19.1` · healthy · PID ok                                                                            |
| WA Evolution | instância `crm-whatsapp` · **open** · inbox id **2**                                                    |
| Telegram     | inbox id **3** · bot `InovaCRMAtendimentoBot` · webhook OK                                              |
| CRM messages | canal `whatsapp` + `telegram` · E2E TG conv `322` espelhada no CRM (2026-11-18)                         |
| Playbook ops | labels/team/macros + greetings WA/TG · seed `seed_atendimento_playbook.rb`                              |
| n8n          | `lead-inbound` + `sync-conversation` ativos                                                             |
| Fase 2 IA    | Spec **034** em implementação — painel Sugestão IA em `/atendimento` (Nest → ai-crm; envio só Chatwoot) |

## Nota — resposta agente no WhatsApp (Evolution)

Falha típica ao responder no Chatwoot: `Hostname '…' has no public ip addresses` (SafeFetch SSRF desde Chatwoot ~v4.14).

1. `SAFE_FETCH_ALLOW_PRIVATE_NETWORK=true` no `.env` do Chatwoot (+ recreate rails/sidekiq).
2. Webhook da inbox API (URL **interna Docker** — não abre no navegador do PC):

`http://evolution.internal:8080/chatwoot/webhook/crm-whatsapp`

Inbound (celular → CRM) continua via Evolution → Chatwoot API e não depende desse URL.

Se `chat-crm` retornar HTTP 500: auditar PIDs (`bash chatwoot/scripts/audit-crm-chatwoot.sh`). Com rails em 512/512, recreate rails/sidekiq **antes** de qualquer feature.
