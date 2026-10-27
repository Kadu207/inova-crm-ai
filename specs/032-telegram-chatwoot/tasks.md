# Tarefas: Telegram via Chatwoot

**Spec:** `032-telegram-chatwoot`  
**Plano:** [plan.md](./plan.md)  
**Status geral:** concluído

---

## Legenda

- `[ ]` pendente / READY
- `[x]` concluído (somente após Quality Gate PASS)

**Regra hard-stop:** nenhuma task passa a DONE sem `npm run gate` PASS.

---

## Bloco 1 — Dados

| ID   | Pri | Tarefa                                                                   | Arquivo           | Status |
| ---- | --- | ------------------------------------------------------------------------ | ----------------- | ------ |
| T-10 | P0  | Colunas `telegram_external_id` e `telegram_username` + índice por tenant | `backend/prisma/` | [x]    |

## Bloco 2 — API

| ID   | Pri | Tarefa                                                                              | Arquivo                                  | Status |
| ---- | --- | ----------------------------------------------------------------------------------- | ---------------------------------------- | ------ |
| T-20 | P0  | Normalizar canal e separar identidade Telegram de WhatsApp                          | `backend/src/common/chatwoot-channel.ts` | [x]    |
| T-21 | P0  | Inbound e sync gravam canal e id Telegram                                           | leads + conversations                    | [x]    |
| T-22 | P0  | Testes: telegram não escreve whatsapp; lookup com tenantId; WhatsApp legado intacto | `*.spec.ts`                              | [x]    |

## Bloco 3 — n8n e UI

| ID   | Pri | Tarefa                                                       | Arquivo                 | Status |
| ---- | --- | ------------------------------------------------------------ | ----------------------- | ------ |
| T-30 | P0  | Encaminhar `channel`, `senderIdentifier`, `telegramUsername` | `n8n/workflows/`        | [x]    |
| T-31 | P0  | Rótulo Telegram e `@username` em `/atendimento`              | `AtendimentoClient.tsx` | [x]    |

## Bloco 4 — Docs e gate

| ID   | Pri | Tarefa                                                         | Arquivo                      | Status |
| ---- | --- | -------------------------------------------------------------- | ---------------------------- | ------ |
| T-40 | P0  | Constituição §5, integração Chatwoot, runbook, script de inbox | `docs/`, `chatwoot/scripts/` | [x]    |
| T-41 | P0  | Quality Gate PASS                                              | `2026-10-27T03-47-39-321Z`   | [x]    |
