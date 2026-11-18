# Plano de implementação: Assistência IA ao agente

**Spec:** [`034-omnichannel-agent-assist`](./spec.md)  
**Status:** concluído  
**Autor:** Squad Spec / Build  
**Data:** 2026-11-18

---

## 1. Resumo executivo

Expor assistência IA **ao agente** em `/atendimento`: Nest orquestra mensagens do fio → `ai-crm` → devolve resumo/rascunho/próximo passo; UI só leitura + copiar; envio permanece Chatwoot. Eventos `ai.*` via outbox; worker-crm-ai para path async quando LLM real.

**Entrega mínima (MVP):** summarize + suggest-reply síncronos via Nest→ai-crm (stubs) + painel UI; testes de isolamento; gate PASS. Persistência `ai_suggestions` e async podem ser Fase B.

---

## 2. Alinhamento com a constituição

| Princípio         | Como este plano respeita                            |
| ----------------- | --------------------------------------------------- |
| Incremental       | MVP sync stubs → UI → eventos/persist → LLM real    |
| API/toolbelt only | Frontend e n8n só falam Nest; AI só Nest→ai-crm     |
| Tenant-first      | Filtro conversa por tenant; AI body com `tenant_id` |
| n8n orquestrador  | Opcional HTTP “pedir sugestão”; sem Function CRM    |
| TDD               | Specs isolamento + contrato AI antes do DONE        |
| Quality Gate      | `npm run gate` PASS                                 |

---

## 3. Arquitetura da solução

```
/atendimento (painel Sugestão IA)
  → Nest POST /api/v1/ai/conversations/:id/summarize|suggest-reply
  → Prisma messages (tenant) → HTTP ai-crm /v1/...
  → (opcional) outbox ai.suggestion.created | ai.summarize.*
  → worker-crm-ai (Fase B async)
Cliente ← Chatwoot only (humano cola/adapta rascunho)
```

### Componentes tocados

| Caminho        | Mudança prevista                                         |
| -------------- | -------------------------------------------------------- |
| `backend/`     | Endpoints AI conversa; client HTTP ai-crm; roles SUPPORT |
| `ai-services/` | Evoluir stubs; endpoint suggest-reply se faltar          |
| `frontend/`    | Painel Sugestão IA em Atendimento                        |
| `workers/`     | Consumer ai.* (Fase B)                                   |
| `docs/`        | Events catalog + playbook nota Fase 2                    |
| `n8n/`         | Sem mudança no MVP                                       |

---

## 4. Fases de implementação

### Fase A — API sync + AI stubs (MVP)

1. Client Nest → `AI_SERVICE_URL` + `AI_API_TOKEN`
2. `summarize` / `suggest-reply` carregando `conversation_messages` do tenant
3. Testes isolamento + contrato
4. Incluir `SUPPORT` nos `@Roles` do toolbelt atendimento

### Fase B — UI `/atendimento`

1. Painel “Sugestão IA” no detalhe da conversa
2. Copiar rascunho; link Chatwoot; design tokens Inova
3. Smoke manual WA/TG (sem enviar pela UI)

### Fase C — Eventos / persistência / gate

1. Registrar eventos novos no catálogo (se async)
2. Opcional: tabela `ai_suggestions` + RLS
3. Docs sync + `npm run gate`

---

## 5. Decisões técnicas

| Decisão           | Escolha                                        | Motivo                                   |
| ----------------- | ---------------------------------------------- | ---------------------------------------- |
| Sync vs async MVP | Sync Nest→ai-crm (stubs)                       | Valor imediato; async quando LLM &gt; 2s |
| Envio canal       | Nunca pela UI CRM                              | Constituição / playbook                  |
| Bot Evolution     | Fora                                           | Não competir com Meta AI (027)           |
| Persistência      | Opcional Fase C                                | MVP pode ser efêmero                     |
| suggest-next-step | Evoluir endpoint existente + contexto conversa | Evita duplicar superfície                |

---

## 6. Riscos e mitigações

| Risco                         | Mitigação                                        |
| ----------------------------- | ------------------------------------------------ |
| Vazamento cross-tenant no AI  | API filtra mensagens por tenant antes do payload |
| Agente achar que CRM envia WA | Copy UI + CTA “Responder no Chatwoot”            |
| LLM lento bloqueia request    | Timeout + Fase B async outbox                    |
| n8n com lógica CRM            | Checklist boundary; MVP sem workflow novo        |

---

## 7. Rollback

Remover painel UI; desligar rotas AI conversa; stubs ai-crm permanecem inócuos. Migration down se `ai_suggestions` existir.

---

## 8. Validação pós-implementação

1. Em conversa TG/WA no CRM: Resumir → texto; Sugerir resposta → copiar
2. Confirmar que Chatwoot/Evolution não recebem POST de envio desta feature
3. `npm run gate` → `GATE_PASS`
4. Atualizar `memory.md` / baseline só após gate
