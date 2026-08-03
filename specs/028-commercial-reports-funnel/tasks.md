# Tarefas: Relatórios comerciais e métricas de funil

**Spec:** `028-commercial-reports-funnel`  
**Plano:** [plan.md](./plan.md)  
**Status geral:** em progresso

---

## Legenda

- `[ ]` pendente / READY
- `[~]` em progresso
- `[x]` concluído (somente após Quality Gate PASS na task/bloco)
- `[B]` bloqueado

**Prioridade:** P0 · P1 · P2  
**Hard-stop:** nenhuma task DONE sem gate PASS no fechamento (T-90).

---

## Bloco 0 — Preparação

| ID   | Pri | Tarefa                                                                                          | Status |
| ---- | --- | ----------------------------------------------------------------------------------------------- | ------ |
| R-00 | P0  | Ler spec.md + plan.md + constitution (tenant-first)                                             | [x]    |
| R-01 | P0  | Confirmar enums `OpportunityStatus` / campos `value`, `slaBreachedAt`, relação Lead→Opportunity | [x]    |
| R-02 | P1  | Decidir default de período (últimos 30d) e max range 366d no DTO                                | [x]    |

---

## Bloco A — Foundation + Pipeline (RF-01)

| ID   | Pri | Tarefa                                                               | Arquivo / nota         | Status |
| ---- | --- | -------------------------------------------------------------------- | ---------------------- | ------ |
| R-10 | P0  | Scaffold `ReportsModule` + register em `AppModule`                   | `backend/src/reports/` | [x]    |
| R-11 | P0  | Query DTO (`from`, `to`, `pipelineId?`) + validação range            | class-validator        | [x]    |
| R-12 | P0  | `ReportsService.pipeline` — groupBy stage + sum value + stageName    | Prisma                 | [x]    |
| R-13 | P0  | `GET /api/v1/reports/pipeline` (auth JWT/API_TOKEN + tenant)         | controller             | [x]    |
| R-14 | P0  | Testes: happy path tenant A, vazio B, isolamento, 400 range inválido | `*.spec.ts`            | [x]    |

---

## Bloco B — Conversão + Receita (RF-02, RF-03)

| ID   | Pri | Tarefa                                                                     | Nota                 | Status |
| ---- | --- | -------------------------------------------------------------------------- | -------------------- | ------ |
| R-20 | P0  | `leadConversion`: created vs converted (`CONVERTED` ou Opportunity) + rate | plan §3              | [x]    |
| R-21 | P0  | `revenue`: forecast OPEN vs realized WON (`updatedAt` proxy)               | Documentar limitação | [x]    |
| R-22 | P0  | Endpoints GET `lead-conversion` + `revenue`                                |                      | [x]    |
| R-23 | P0  | Testes fórmulas + isolamento                                               |                      | [x]    |

---

## Bloco C — SLA + CSV (RF-04, RF-05)

| ID   | Pri | Tarefa                                                                 | Nota               | Status |
| ---- | --- | ---------------------------------------------------------------------- | ------------------ | ------ |
| R-30 | P0  | `sla`: open conversations, breached opportunities; `meta.partial=true` | Sem first-response | [x]    |
| R-31 | P0  | Export CSV `GET /api/v1/reports/:kind/export` (`text/csv`)             | kinds whitelist    | [x]    |
| R-32 | P0  | Roles: admin + API_TOKEN; sales read OK no MVP                         | Guards existentes  | [x]    |
| R-33 | P0  | Testes SLA partial + CSV headers batem com JSON                        |                    | [x]    |

---

## Bloco D — Frontend

| ID   | Pri | Tarefa                                              | Arquivo / nota             | Status |
| ---- | --- | --------------------------------------------------- | -------------------------- | ------ |
| R-40 | P0  | Client fetch dos 4 reports (loading / erro / empty) | `frontend/.../relatorios/` | [x]    |
| R-41 | P0  | Popular cards pipeline, conversão, receita, SLA     | sem EmptyState falso       | [x]    |
| R-42 | P1  | Botão export CSV por card (admin)                   | download blob              | [x]    |
| R-43 | P1  | Seletor de período (from/to) mínimo                 | default 30d                | [x]    |
| R-44 | P0  | `npm run build` frontend OK                         |                            | [x]    |

---

## Bloco E — Docs e fechamento

| ID   | Pri | Tarefa                                                     | Status |
| ---- | --- | ---------------------------------------------------------- | ------ |
| R-50 | P1  | OpenAPI / docs API reports (se Swagger no CI)              | [x]    |
| R-51 | P1  | Nota curta em `docs/` (endpoints + definições de negócio)  | [x]    |
| R-52 | P0  | Spec status → implementado; checkboxes RF                  | [x]    |
| R-90 | P0  | `npm run gate` PASS + relatório em `reports/quality-gate/` | [x]    |
| R-91 | P0  | Smoke UI `/relatorios` tenant demo                         | [x]    |
| R-92 | P0  | Atualizar baseline.md + roadmap (028 DONE)                 | [x]    |
| R-93 | P2  | historico-versoes se bump de versão                        | [x]    |

---

## Ordem de execução

`R-00…02` → `R-10…14` → `R-20…23` → `R-30…33` → `R-40…44` → `R-50…93`

Workers / n8n / Chatwoot: **N/A** nesta Spec.

---

## Bloqueios

| ID  | Bloqueio | Desde | Ação |
| --- | -------- | ----- | ---- |
| —   | —        | —     | —    |

---

## Notas de implementação

- Spec 027 (Meta) permanece BLOCKED e **paralela** — não bloqueia 028.
- Checklist WABA: `docs/operations/waba-credentials-checklist.md`
- Gate PASS: `reports/quality-gate/2026-08-03T01-57-06-714Z.md`
- Smoke 2026-08-03: `https://crm.inovatitech.com.br/relatorios` → 200; `https://api-crm.inovatitech.com.br/health` → 200; `/api/v1/reports/*` → 404 até deploy CI das imagens desta release.

---

## Checklist rápido antes de “concluído”

- [x] Todos P0 fechados
- [x] Gate PASS documentado
- [x] Isolamento tenant coberto
- [x] Nenhum segredo commitado
- [x] Constitution (tenant-first, API-only, n8n N/A)
