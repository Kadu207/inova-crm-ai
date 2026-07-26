# Tarefas: Zoho Blueprint light + filtros avançados + COQL

**Spec:** `026-zoho-blueprint-coql`  
**Plano:** [plan.md](./plan.md)  
**Status geral:** concluído

---

## Bloco 0 — Preparação

| ID   | Pri | Tarefa                                           | Status |
| ---- | --- | ------------------------------------------------ | ------ |
| Z-00 | P0  | Spec/plan/tasks + baseline IN PROGRESS           | [x]    |
| Z-01 | P0  | Ler constitution + Spec 023/025 (filtros/custom) | [x]    |

---

## Bloco A — Blueprint light

| ID   | Pri | Tarefa                                           | Status |
| ---- | --- | ------------------------------------------------ | ------ |
| Z-10 | P0  | Migration `BlueprintTransition` + RLS + tenantId | [x]    |
| Z-11 | P0  | Service `validateTransition` + testes            | [x]    |
| Z-12 | P0  | Integrar no move/PATCH de Opportunity            | [x]    |
| Z-13 | P0  | API admin CRUD + UI mínima                       | [x]    |

---

## Bloco B — Filtros avançados

| ID   | Pri | Tarefa                                        | Status |
| ---- | --- | --------------------------------------------- | ------ |
| Z-20 | P0  | `AdvancedFilter` DTO + FilterEngine → Prisma  | [x]    |
| Z-21 | P0  | Aplicar em Leads + Opportunities (+ Contacts) | [x]    |
| Z-22 | P1  | UI filter builder ou painel JSON avançado     | [x]    |
| Z-23 | P0  | Testes AND/OR + custom fields + tenant        | [x]    |

---

## Bloco C — COQL read-only

| ID   | Pri | Tarefa                                    | Status |
| ---- | --- | ----------------------------------------- | ------ |
| Z-30 | P0  | Parser AST whitelist (SELECT only)        | [x]    |
| Z-31 | P0  | `POST /api/v1/coql/query` + rate-limit    | [x]    |
| Z-32 | P0  | Módulos Leads → Contacts → Deals/Accounts | [x]    |
| Z-33 | P0  | Testes injection + isolamento tenant      | [x]    |

---

## Bloco D — Fechamento

| ID   | Pri | Tarefa                                                   | Status |
| ---- | --- | -------------------------------------------------------- | ------ |
| Z-40 | P0  | OpenAPI + docs APIs                                      | [x]    |
| Z-41 | P0  | `npm run gate` PASS                                      | [x]    |
| Z-42 | P0  | Baseline + historico-versoes → **1.1.0**                 | [x]    |
| Z-43 | P1  | Desbloquear início docs da Spec 027 (WABA ainda BLOCKED) | [x]    |

---

## Próxima Spec

[`027-meta-cloud-api-waba`](../027-meta-cloud-api-waba/spec.md) — **BLOCKED** até credenciais WABA.
