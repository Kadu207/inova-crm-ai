# Tarefas: Assistência IA ao agente

**Spec:** `034-omnichannel-agent-assist`  
**Plano:** [plan.md](./plan.md)  
**Status geral:** concluído  
**Gate:** `reports/quality-gate/2026-11-18T12-31-21-174Z.md` (`GATE_PASS`)

---

## Legenda

- `[ ]` pendente / READY
- `[~]` em progresso
- `[x]` concluído (somente após Quality Gate PASS)
- `[—]` cancelado / fora de escopo
- `[B]` bloqueado

**Prioridade:** P0 · P1 · P2  
**Regra hard-stop:** DONE só com `npm run gate` PASS.

---

## Bloco 1 — Preparação

| ID   | Pri | Tarefa                                             | Status |
| ---- | --- | -------------------------------------------------- | ------ |
| T-01 | P0  | Ler spec, plan, constitution, playbook omnichannel | [x]    |
| T-02 | P0  | Spec/plan/tasks versionados em `specs/034-.../`    | [x]    |
| T-03 | P1  | Confirmar `AI_SERVICE_URL` / `AI_API_TOKEN` no env | [x]    |

---

## Bloco 2 — AI services

| ID   | Pri | Tarefa                                               | Arquivo / nota | Status |
| ---- | --- | ---------------------------------------------------- | -------------- | ------ |
| T-10 | P0  | Evoluir summarize stub (PT-BR Inova, guardrails)     | `ai-services/` | [x]    |
| T-11 | P0  | Endpoint/agent `suggest-reply` (rascunho canal)      | `ai-services/` | [x]    |
| T-12 | P1  | Alinhar `suggest-next-step` com contexto de conversa | `followup.py`  | [x]    |

---

## Bloco 3 — Backend API

| ID   | Pri | Tarefa                                                                 | Arquivo / nota     | Status |
| ---- | --- | ---------------------------------------------------------------------- | ------------------ | ------ |
| T-20 | P0  | Client HTTP Nest → ai-crm (token server-side)                          | `ai-toolbelt/`     | [x]    |
| T-21 | P0  | `POST .../conversations/:id/summarize` + `suggest-reply` (tenant-safe) | controller/service | [x]    |
| T-22 | P0  | Incluir `SUPPORT` nos Roles de assistência atendimento                 | `@Roles`           | [x]    |
| T-23 | P0  | Testes: isolamento, 404 cross-tenant, contrato payload                 | `*.spec.ts`        | [x]    |
| T-24 | P1  | Evoluir `suggest-next-step` com `conversationId` opcional              | toolbelt           | [x]    |
| T-25 | P1  | Outbox `ai.suggestion.created` (+ novos eventos se async)              | catalog + outbox   | [x]    |

---

## Bloco 4 — Dados (opcional MVP+)

| ID   | Pri | Tarefa                                 | Arquivo / nota    | Status |
| ---- | --- | -------------------------------------- | ----------------- | ------ |
| T-30 | P2  | Model `AiSuggestion` + migration + RLS | `backend/prisma/` | [x]    |
| T-31 | P2  | Persistência após summarize/suggest    | service           | [x]    |

---

## Bloco 5 — Workers

| ID   | Pri | Tarefa                                             | Arquivo / nota | Status |
| ---- | --- | -------------------------------------------------- | -------------- | ------ |
| T-40 | P2  | Consumer async summarize/suggestion (Fase B)       | `workers/`     | [x]    |
| T-41 | P2  | Idempotência `idempotencyKey` + rejeita sem tenant | tests          | [x]    |

---

## Bloco 6 — Frontend

| ID   | Pri | Tarefa                                                       | Status |
| ---- | --- | ------------------------------------------------------------ | ------ |
| T-50 | P0  | Painel “Sugestão IA” no detalhe `/atendimento`               | [x]    |
| T-51 | P0  | Ações Resumir / Sugerir resposta / Próximo passo + Copiar    | [x]    |
| T-52 | P0  | CTA “Responder no Chatwoot”; tokens Inova (não purple/cream) | [x]    |
| T-53 | P1  | Estados loading / erro / vazio                               | [x]    |

---

## Bloco 7 — n8n

| ID   | Pri | Tarefa                                            | Status |
| ---- | --- | ------------------------------------------------- | ------ |
| T-60 | P2  | (Opcional) workflow HTTP “pedir sugestão”         | [—]    |
| T-61 | P0  | Sem Function/Code com regra CRM (revisão se T-60) | [—]    |

---

## Bloco 8 — Docs e validação

| ID   | Pri | Tarefa                                                          | Status |
| ---- | --- | --------------------------------------------------------------- | ------ |
| T-90 | P0  | Atualizar `docs/events/catalog-v0.md` antes de publishers novos | [x]    |
| T-91 | P1  | Nota Fase 2 no playbook `omnichannel-atendimento.md`            | [x]    |
| T-92 | P0  | `npm run gate` PASS                                             | [x]    |
| T-93 | P1  | `memory.md` + baseline após GATE_PASS                           | [x]    |

---

## Notas

- GATE_PASS `2026-11-18T12-31-21-174Z` (MVP + P2 outbox/persistência/worker).
- Spec 027 (Meta AI) permanece BLOCKED e **fora** deste escopo.
