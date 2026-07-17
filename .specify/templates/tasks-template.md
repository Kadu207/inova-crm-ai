# Tarefas: [TÍTULO DA FEATURE]

**Spec:** `[NNN-nome-curto]`  
**Plano:** [link para plan.md]  
**Status geral:** não iniciado | em progresso | concluído

---

## Legenda

- `[ ]` pendente / READY
- `[~]` em progresso
- `[x]` concluído (somente após Quality Gate PASS)
- `[—]` cancelado / fora de escopo
- `[B]` bloqueado aguardando gate da task anterior

**Prioridade:** P0 (bloqueante) · P1 (importante) · P2 (desejável)

**Regra hard-stop:** nenhuma task passa de READY → DONE sem `npm run gate` PASS.

---

## Bloco 1 — Preparação

| ID   | Pri | Tarefa                                        | Responsável | Status |
| ---- | --- | --------------------------------------------- | ----------- | ------ |
| T-01 | P0  | Ler spec, plano e constitution                |             | [ ]    |
| T-02 | P1  | Confirmar `tenantId` no escopo de dados       |             | [ ]    |
| T-03 | P1  | Verificar dependências (`.env`, portas 9400+) |             | [ ]    |

---

## Bloco 2 — Dados / Prisma

| ID   | Pri | Tarefa                                 | Arquivo / nota    | Status |
| ---- | --- | -------------------------------------- | ----------------- | ------ |
| T-10 | P0  | [Migration Prisma com tenantId]        | `backend/prisma/` | [ ]    |
| T-11 | P0  | RLS policy (se nova tabela de domínio) | migration SQL     | [ ]    |
| T-12 | P1  | `prisma validate` + migrate dev        |                   | [ ]    |

---

## Bloco 3 — Backend API

| ID   | Pri | Tarefa                                  | Arquivo / nota | Status |
| ---- | --- | --------------------------------------- | -------------- | ------ |
| T-20 | P0  | [Módulo NestJS / DTO / service]         | `backend/src/` | [ ]    |
| T-21 | P0  | Testes unit/integration (TDD)           | `*.spec.ts`    | [ ]    |
| T-22 | P1  | OpenAPI atualizado                      | Swagger        | [ ]    |
| T-23 | P1  | Publicar evento RabbitMQ (se aplicável) | outbox         | [ ]    |

---

## Bloco 4 — Workers (se aplicável)

| ID   | Pri | Tarefa             | Arquivo / nota | Status |
| ---- | --- | ------------------ | -------------- | ------ |
| T-30 | P1  | Consumer do evento | `workers/`     | [ ]    |
| T-31 | P1  | Testes do consumer |                | [ ]    |

---

## Bloco 5 — Frontend (se aplicável)

| ID   | Pri | Tarefa                                    | Arquivo / nota          | Status |
| ---- | --- | ----------------------------------------- | ----------------------- | ------ |
| T-40 | P1  | [Página / componente]                     | `frontend/`             | [ ]    |
| T-41 | P0  | Design tokens Inova (não purple/cream AI) | `docs/design/tokens.md` | [ ]    |
| T-42 | P0  | `npm run build` sem erros                 |                         | [ ]    |

---

## Bloco 6 — n8n (se aplicável — só orquestração)

| ID   | Pri | Tarefa                              | Arquivo / nota | Status |
| ---- | --- | ----------------------------------- | -------------- | ------ |
| T-50 | P1  | Workflow: webhook → API → notify    | `n8n/`         | [ ]    |
| T-51 | P0  | Sem regra de negócio em Function/IF | revisão manual | [ ]    |
| T-52 | P1  | API_TOKEN via env / nó Config       |                | [ ]    |

---

## Bloco 7 — Validação e fechamento

| ID   | Pri | Tarefa                                  | Status |
| ---- | --- | --------------------------------------- | ------ |
| T-90 | P0  | `npm run gate` PASS                     | [ ]    |
| T-91 | P0  | Cenários de smoke da spec               | [ ]    |
| T-92 | P1  | Docs atualizados (API/evento/porta)     | [ ]    |
| T-93 | P1  | Atualizar `baseline.md` (se fecha fase) | [ ]    |

---

## Bloqueios

| ID tarefa | Bloqueio | Desde | Ação necessária |
| --------- | -------- | ----- | --------------- |
|           |          |       |                 |

---

## Notas de implementação

[Espaço livre: decisões, PRs, hashes de commit, relatório `reports/quality-gate/<task-id>.md`.]

---

## Checklist rápido antes de marcar "concluído"

- [ ] Todos os itens P0 fechados
- [ ] Quality Gate PASS documentado
- [ ] Nenhum segredo commitado (`.env`, tokens)
- [ ] Constituição respeitada (tenant-first, n8n boundary, API only)
- [ ] Spec atualizada se escopo mudou
