# Tarefas: Security hardening P0

**Spec:** `029-security-hardening-p0`  
**Plano:** [plan.md](./plan.md)  
**Status geral:** concluído (P0+P1 · GATE_PASS · Delivery)

---

## Legenda

- `[ ]` pendente / READY
- `[~]` em progresso
- `[x]` concluído (somente após Quality Gate PASS)
- `[—]` cancelado / fora de escopo
- `[B]` bloqueado

**Prioridade:** P0 (bloqueante) · P1 (importante) · P2 (desejável)

**Regra hard-stop:** nenhuma task P0 → DONE sem `npm run gate` PASS.

---

## Bloco 1 — Preparação

| ID   | Pri | Tarefa                       | Status |
| ---- | --- | ---------------------------- | ------ |
| T-01 | P0  | Ler spec, plan, constitution | [x]    |
| T-02 | P0  | Spec/plan/tasks versionados  | [x]    |

---

## Bloco 2 — P0 Secrets

| ID   | Pri | Tarefa                                                           | Arquivo / nota             | Status |
| ---- | --- | ---------------------------------------------------------------- | -------------------------- | ------ |
| T-10 | P0  | Remover literais de senha; exigir `SEED_ADMIN_PASSWORD` (ou env) | `infrastructure/scripts/*` | [x]    |
| T-11 | P0  | Documentar vars nos headers dos scripts tocados                  | scripts                    | [x]    |

---

## Bloco 3 — P0 RLS

| ID   | Pri | Tarefa                                      | Arquivo / nota                               | Status |
| ---- | --- | ------------------------------------------- | -------------------------------------------- | ------ |
| T-20 | P0  | Migration ENABLE+FORCE+policy nas 3 tabelas | `backend/prisma/migrations/20260818013000_…` | [x]    |
| T-21 | P0  | Estender teste SQL em `rls.spec.ts`         | `backend/src/tenancy/rls.spec.ts`            | [x]    |

---

## Bloco 4 — P0 JWT + AI auth

| ID   | Pri | Tarefa                                                    | Arquivo / nota              | Status |
| ---- | --- | --------------------------------------------------------- | --------------------------- | ------ |
| T-30 | P0  | `resolveJwtSecret` + uso em strategy/module + unit tests  | `backend/src/auth/`         | [x]    |
| T-31 | P0  | Bearer middleware AI; `/health` público; fail-closed prod | `ai-services/app/`          | [x]    |
| T-32 | P0  | Atualizar pytest + README AI                              | `ai-services/tests`, README | [x]    |

---

## Bloco 5 — Gate

| ID   | Pri | Tarefa                              | Status |
| ---- | --- | ----------------------------------- | ------ |
| T-90 | P0  | `npm run gate` PASS                 | [x]    |
| T-91 | P1  | Nota ops: rotacionar senha se vazou | [x]    |
| T-92 | P1  | Docs sync (AI auth)                 | [x]    |

**Gate report P0:** `reports/quality-gate/2026-08-18T04-41-59-900Z.md` → **GATE_PASS**  
**Gate report P1:** `reports/quality-gate/2026-08-18T05-07-57-461Z.md` → **GATE_PASS**

---

## Bloco 6 — P1 (security hardening follow-up)

| ID   | Pri | Tarefa                                             | Status |
| ---- | --- | -------------------------------------------------- | ------ |
| T-40 | P1  | Travar `/auth/register` em produção                | [x]    |
| T-41 | P1  | Bloquear assignment `SUPER_ADMIN` via identity DTO | [x]    |
| T-42 | P1  | `@Roles` em mutações CRM sem role                  | [x]    |
| T-43 | P1  | Webhook secret por tenant                          | [x]    |
| T-44 | P1  | LGPD purge por tenant (`withTenant`)               | [x]    |
| T-45 | P1  | `where: { id, tenantId }` nos updates pós-findOne  | [x]    |

---

## Bloqueios

| ID tarefa | Bloqueio | Desde | Ação necessária |
| --------- | -------- | ----- | --------------- |
|           |          |       |                 |

---

## Notas de implementação

- Senha admin na VPS **pode ser mantida**; scripts só deixam de versionar literais (ver ops note).
- Deploy migration RLS + env JWT/AI na VPS via Delivery após merge.
- `fix-login-deploy.sh` ainda busca string antiga `InovaDemo@2026` só para **remover** default da UI — não usa como credencial.

---

## Checklist rápido antes de marcar "concluído"

- [x] Todos os itens P0 fechados
- [x] Quality Gate PASS documentado
- [x] Nenhum segredo commitado
- [x] Constituição respeitada (tenant-first, API only)
- [x] P1 (T-40…T-45) — GATE_PASS `2026-08-18T05-07-57-461Z`
