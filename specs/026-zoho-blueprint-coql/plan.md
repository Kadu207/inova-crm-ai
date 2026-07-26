# Plano de implementação: Zoho Blueprint light + filtros avançados + COQL

**Spec:** [`026-zoho-blueprint-coql`](./spec.md)  
**Status:** em execução  
**Autor:** Squad Build  
**Data:** 2026-07-26

---

## 1. Resumo executivo

Implementar em três fatias: (A) Blueprint light no move de oportunidade, (B) engine de filtros avançados reutilizável, (C) COQL read-only com AST whitelist. Validar com testes de isolamento tenant + `npm run gate`.

**Entrega mínima (MVP):** RF-01 completo + filtros AND/OR em Lead/Opportunity + COQL SELECT em um módulo (Leads) — depois expandir Contacts/Deals.

---

## 2. Alinhamento com a constituição

| Princípio         | Como este plano respeita                           |
| ----------------- | -------------------------------------------------- |
| Incremental       | Fatias A → B → C com gate entre blocos             |
| API/toolbelt only | Tudo via Nest; n8n só HTTP COQL                    |
| Tenant-first      | Schema + queries com `tenantId`; COQL força filtro |
| n8n orquestrador  | Sem Function/Code de negócio                       |
| TDD               | Parser COQL e Blueprint guard primeiro             |
| Quality Gate      | PASS antes de DONE                                 |

---

## 3. Arquitetura da solução

```
UI Admin Blueprint ──► Nest Pipeline/Blueprint API ──► Postgres (tenantId)
UI List Filters   ──► Nest FilterEngine ──► Prisma where
n8n / API_TOKEN   ──► POST /coql/query ──► CoqlParser → Prisma
```

### Componentes tocados

| Caminho                                 | Mudança prevista                         |
| --------------------------------------- | ---------------------------------------- |
| `backend/prisma/`                       | `BlueprintTransition` (+ RLS)            |
| `backend/src/pipeline/` ou `blueprint/` | CRUD regras + guard no move              |
| `backend/src/opportunities/`            | Validar transição                        |
| `backend/src/common/filters-query/`     | Engine AND/OR                            |
| `backend/src/coql/`                     | Parser + endpoint                        |
| `frontend/`                             | Admin Blueprint + filter builder mínimo  |
| `docs/`                                 | OpenAPI, histórico 1.1.0                 |
| `n8n/`                                  | Opcional: exemplo HTTP COQL (sem lógica) |

---

## 4. Fases de implementação

### Fase A — Blueprint light (P0)

1. Migration + RLS
2. Service validateTransition
3. Hook no move/PATCH opportunity stage
4. API admin CRUD transitions
5. UI mínima admin
6. Testes isolamento

### Fase B — Filtros avançados (P0)

1. DTO `AdvancedFilter`
2. Tradutor → Prisma `where`
3. Aplicar em leads + opportunities (+ contacts se couber)
4. UI filter builder (ou JSON avançado no MVP)
5. Testes operadores + custom fields

### Fase C — COQL (P0)

1. Gramática mínima / tokenizer
2. Whitelist módulos + campos
3. Endpoint + throttling
4. Testes injection + tenant
5. Docs OpenAPI

### Fase D — Docs / release (P0)

1. Gate PASS
2. Baseline + historico → 1.1.0
3. Liberar início da Spec 027 (ainda BLOCKED por WABA)

---

## 5. Ordem de tasks

Ver [`tasks.md`](./tasks.md). Ordem: A → B → C → D.

---

## 6. Critérios de gate

- Unit tests Blueprint + FilterEngine + CoqlParser
- Nenhum `$queryRaw` com string interpolada do usuário
- `npm run gate` PASS
