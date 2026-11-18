# Especificação: Assistência IA ao agente (omnichannel)

**ID:** `034-omnichannel-agent-assist`  
**Status:** aprovado  
**Autor:** Squad Spec  
**Data:** 2026-11-18  
**Fase do roadmap:** pós-fase (1.1.x → 1.2.x)

---

## 1. Contexto e problema

Fase 1 do playbook omnichannel (WA Evolution + Telegram) está operacional: labels/teams/macros no Chatwoot, greeting/comandos TG, fio e filtro em `/atendimento` (Specs 032/033). O agente ainda **não** recebe ajuda de IA no CRM — stubs existem em `ai-services/` (`summarize-conversation`, `suggest-next-step`) e `backend` toolbelt, mas a UI de atendimento não os usa.

**Problema:** agente lê o fio sem resumo, sem sugestão de resposta/próximo passo, e sem caminho tenant-safe via API/`ai-crm`.

**Impacto se não resolver:** atendimento lento; risco de alguém colocar bot IA no Evolution competindo com Meta; workers AI sem consumo real do histórico Spec 033.

---

## 2. Objetivo

Oferecer **assistência ao agente humano** em `/atendimento`: resumir conversa, sugerir resposta e sugerir próximo passo CRM, via Nest → `ai-crm` (toolbelt), com eventos `ai.*` e tenant-first. Envio ao cliente continua **somente** no Chatwoot.

### Fora de escopo

- Bot autônomo / AgentBot no WhatsApp Evolution ou Telegram
- Cutover Meta / WABA / Meta AI (Spec **027**)
- Envio de mensagem canal pela UI do CRM
- Regras de qualificação/SLA em nós Function do n8n
- Substituição do playbook humano Fase 1

---

## 3. Usuários e papéis

| Ator   | Papel                         | Interesse                                              |
| ------ | ----------------------------- | ------------------------------------------------------ |
| Agente | `support` / `sales` / `admin` | Painel “Sugestão IA” no fio; aplicar rascunho opcional |
| API    | Nest + JWT/`API_TOKEN`        | Orquestrar chamada a `ai-crm`; persistir sugestão      |
| Worker | `worker-crm-ai`               | Consumir `ai.*`; chamar FastAPI; publicar resultado    |
| n8n    | orquestrador (opcional)       | No máximo HTTP “pedir sugestão”; sem regra CRM         |

**Tenant:** toda chamada e persistência com `tenantId`; AI recebe `tenant_id` no body; cache Redis prefixado por tenant.

---

## 4. Requisitos funcionais

### RF-01 — Resumir conversa

**Como** agente, **quero** resumir o fio de uma conversa no CRM, **para** entender o contexto rápido.

**Critérios de aceite:**

- [ ] `POST /api/v1/ai/conversations/:id/summarize` (tenant do JWT) carrega mensagens Spec 033 e chama `ai-crm` `POST /v1/summarize-conversation`
- [ ] Resposta inclui `summary`, `topics`, `sentiment` (contrato atual do stub evoluído)
- [ ] Sem `tenantId` / conversa de outro tenant → 403/404; teste de isolamento

### RF-02 — Sugerir resposta (rascunho)

**Como** agente, **quero** uma sugestão de resposta em português Inova, **para** copiar/adaptar no Chatwoot.

**Critérios de aceite:**

- [ ] Endpoint dedicado (ex. `POST /api/v1/ai/conversations/:id/suggest-reply`) retorna texto rascunho + `confidence`
- [ ] UI mostra rascunho **somente leitura** + ação “Copiar”; **não** envia ao canal
- [ ] Tom alinhado à marca Inova (sem purple/cream defaults na UI)

### RF-03 — Sugerir próximo passo CRM

**Como** agente, **quero** próximo passo sugerido (ligar, qualificar, criar oportunidade), **para** avançar o funil.

**Critérios de aceite:**

- [ ] Reusa/evolui `POST /api/v1/ai/suggest-next-step` com contexto de conversa + estágio
- [ ] Publica/persiste via evento `ai.suggestion.created` (catálogo) com `tenantId` + `idempotencyKey`
- [ ] Papéis: `SUPPORT` incluído além de SALES/MANAGER/ADMIN

### RF-04 — Painel UI em `/atendimento`

**Como** agente, **quero** um painel “Sugestão IA” no detalhe da conversa, **para** pedir resumo/resposta/próximo passo sem sair do CRM.

**Critérios de aceite:**

- [ ] Botões: Resumir · Sugerir resposta · Próximo passo
- [ ] Estados: idle / loading / erro / resultado; sem cards decorativos excessivos
- [ ] CTA explícito: “Responder no Chatwoot” (link já existente / playbook)

### RF-05 — Eventos e worker

**Como** plataforma, **quero** jobs AI via outbox → Rabbit → `worker-crm-ai`, **para** não bloquear a API em LLM longo.

**Critérios de aceite:**

- [ ] Novos eventos necessários registrados em `docs/events/catalog-v0.md` **antes** do publisher (ex. `ai.summarize.requested` / `ai.summarize.completed` se síncrono stubar na API na v1 e async na v1.1 — decisão no plan)
- [ ] Consumer idempotente; rejeita envelope sem `tenantId`
- [ ] n8n **não** consome fila de domínio; se usado, só HTTP na API

---

## 5. Requisitos não funcionais

| ID     | Categoria    | Requisito                                                              |
| ------ | ------------ | ---------------------------------------------------------------------- |
| RNF-01 | Multi-tenant | `tenantId` em persistência/eventos; zero cross-tenant                  |
| RNF-02 | Segurança    | AI só via Bearer `AI_API_TOKEN` server-side; frontend só fala com Nest |
| RNF-03 | Performance  | Resumo síncrono MVP p95 &lt; 5s (stub); path async se LLM real &gt; 2s |
| RNF-04 | Eventos      | RabbitMQ = domínio; Redis ≠ barramento                                 |
| RNF-05 | n8n-boundary | Sem Function/Code com regra CRM                                        |
| RNF-06 | Quality Gate | `npm run gate` PASS antes de DONE                                      |

---

## 6. Integrações e camadas afetadas

- [x] **Frontend** (`frontend/`) — painel em Atendimento
- [x] **Backend API** (`backend/`) — toolbelt conversas
- [x] **Workers** (`workers/`) — worker-crm-ai
- [x] **AI** (`ai-services/`) — summarize / suggest-reply / suggest-next-step
- [ ] **n8n** — opcional HTTP only
- [ ] **Chatwoot** — sem mudança de canal
- [x] **Docs** — playbook + events + OpenAPI

**Endpoints / eventos envolvidos:**

| Nome                                         | Método / tipo | Descrição                |
| -------------------------------------------- | ------------- | ------------------------ |
| `/api/v1/ai/conversations/:id/summarize`     | POST          | Resumo do fio            |
| `/api/v1/ai/conversations/:id/suggest-reply` | POST          | Rascunho de resposta     |
| `/api/v1/ai/suggest-next-step`               | POST          | Próximo passo (evoluído) |
| `/v1/summarize-conversation` (ai-crm)        | POST          | Implementação FastAPI    |
| `/v1/suggest-next-step` (ai-crm)             | POST          | Implementação FastAPI    |
| `ai.suggestion.created`                      | evento        | Já no catálogo           |
| `ai.summarize.requested/completed`           | evento        | Registrar se path async  |

---

## 7. Guardrails e aprovações

- [x] Requer humano no loop? **Sim** — IA só sugere; envio canal é humano no Chatwoot
- [x] Novos eventos RabbitMQ? Registrar em `docs/events/catalog-v0.md` antes do publisher
- [x] n8n apenas orquestra? Sim
- [x] Quality Gate PASS antes de marcar implementado?

---

## 8. Dados e modelo

MVP pode persistir sugestões em tabela de domínio opcional:

```prisma
model AiSuggestion {
  id             String   @id @default(cuid())
  tenantId       String   @map("tenant_id")
  conversationId String?  @map("conversation_id")
  kind           String   // summarize | reply | next_step
  content        String
  metadata       Json?
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([tenantId])
  @@index([tenantId, conversationId])
  @@map("ai_suggestions")
}
```

Se MVP for só resposta efêmera (sem persistir), documentar no plan e pular migration — ainda assim eventos com `tenantId`.

---

## 9. Cenários de teste (TDD)

1. Happy path: conversa com mensagens → summarize retorna summary no tenant correto
2. Isolamento: tenant B não resume conversa de tenant A
3. suggest-reply não chama Chatwoot / Evolution / Graph
4. Envelope `ai.suggestion.created` sem `tenantId` rejeitado pelo consumer
5. Papel SUPPORT consegue pedir sugestão; papel sem grant recebe 403
6. UI: painel renderiza loading/erro/resultado; botão Copiar disponível

---

## 10. Dependências

| Dependência                        | Spec / componente | Status  |
| ---------------------------------- | ----------------- | ------- |
| Fio de mensagens em `/atendimento` | Spec 033          | DONE    |
| Canais WA/TG + playbook Fase 1     | ops + 032         | DONE    |
| Stubs ai-services + toolbelt       | Fase 6            | DONE    |
| Meta AI / WABA                     | Spec 027          | BLOCKED |

---

## 11. Referências

- [Playbook omnichannel](../../docs/operations/omnichannel-atendimento.md)
- [Catálogo de eventos](../../docs/events/catalog-v0.md)
- [Constituição](../../.specify/memory/constitution.md)
- [ADR n8n boundary](../../docs/adr/003-n8n-orchestrator-boundary.md)
- Specs 032 / 033

---

## Histórico de revisões

| Versão | Data       | Autor      | Alteração                       |
| ------ | ---------- | ---------- | ------------------------------- |
| 0.1    | 2026-11-18 | Squad Spec | Rascunho inicial                |
| 1.0    | 2026-11-18 | Squad Spec | Aprovado (Fase 2 do fluxo omni) |
