# Tarefas: Mensagens omnichannel

**Spec:** `033-omnichannel-messages`  
**Plano:** [plan.md](./plan.md)  
**Status geral:** concluído  
**Gate:** `reports/quality-gate/2026-11-17T17-59-58-044Z.md` (`GATE_PASS`)

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

| ID   | Pri | Tarefa                      | Status |
| ---- | --- | --------------------------- | ------ |
| T-01 | P0  | Spec / plan / constitution  | [x]    |
| T-02 | P0  | Spec/plan/tasks versionados | [x]    |

---

## Bloco 2 — Dados / Prisma

| ID   | Pri | Tarefa                                | Arquivo / nota    | Status |
| ---- | --- | ------------------------------------- | ----------------- | ------ |
| T-10 | P0  | Model ConversationMessage + migration | `backend/prisma/` | [x]    |
| T-11 | P0  | RLS policy na tabela                  | migration SQL     | [x]    |

---

## Bloco 3 — Backend API

| ID   | Pri | Tarefa                                                   | Arquivo / nota   | Status |
| ---- | --- | -------------------------------------------------------- | ---------------- | ------ |
| T-20 | P0  | DTO inbound message fields + persist + events            | `leads/`         | [x]    |
| T-21 | P0  | GET conversations filter channel + messages on findOne   | `conversations/` | [x]    |
| T-22 | P0  | Testes: replay, isolamento, canal, skip private/activity | `*.spec.ts`      | [x]    |

---

## Bloco 4 — n8n

| ID   | Pri | Tarefa                                                   | Status |
| ---- | --- | -------------------------------------------------------- | ------ |
| T-50 | P0  | Encaminhar messageId/type/contentType/sentAt/attachments | [x]    |
| T-51 | P0  | Sem Function/Code com regra CRM                          | [x]    |

---

## Bloco 5 — Frontend

| ID   | Pri | Tarefa                               | Status |
| ---- | --- | ------------------------------------ | ------ |
| T-40 | P0  | Filtro Todos/WhatsApp/Telegram + fio | [x]    |

---

## Bloco 6 — Validação

| ID   | Pri | Tarefa                        | Status |
| ---- | --- | ----------------------------- | ------ |
| T-90 | P0  | `npm run gate` PASS           | [x]    |
| T-91 | P1  | Docs sync + baseline + memory | [x]    |

---

## Notas de implementação

Spec 033 — histórico de mensagens omnichannel. Gate `2026-11-17T17-58-16-626Z`.
