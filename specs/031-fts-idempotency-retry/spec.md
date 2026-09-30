# Especificação: Full-text search + idempotência + retry

**ID:** `031-fts-idempotency-retry`  
**Status:** implementado  
**Autor:** Squad Build  
**Data:** 2026-09-29  
**Fase do roadmap:** pós-fase (1.1.x)

---

## 1. Contexto e problema

Listagens usam Prisma `contains` (= `LIKE '%q%'`), sem índice adequado e com risco de wildcards. Workers usam `Set` em memória para idempotência (perde no restart / multi-réplica). Falhas no consumer fazem `nack` sem requeue — sem retry/backoff.

**Problema:** busca cara/insegura; eventos podem reprocessar ou sumir em falha transitória.

**Impacto se não resolver:** lentidão em escala, duplicata de side-effects, perda de eventos.

---

## 2. Objetivo

Substituir busca `q` por PostgreSQL FTS (`plainto_tsquery` + GIN); persistir claim de idempotência (Redis); retry com backoff nos workers/API client.

### Fora de escopo

- Elasticsearch / Meilisearch
- Cutover Meta/WABA (027)
- UI de busca avançada nova

---

## 3. Usuários e papéis

| Ator        | Papel               | Interesse                       |
| ----------- | ------------------- | ------------------------------- |
| Vendedor    | USER/MANAGER        | Busca rápida em leads/contatos  |
| Workers CRM | serviço (API_TOKEN) | Idempotência e retry confiáveis |

**Tenant:** toda operação com `tenantId` + RLS.

---

## 4. Requisitos funcionais

### RF-01 — Full-text search nas listagens `?q=`

**Critérios de aceite:**

- [ ] Contatos, leads, empresas, produtos, serviços, tarefas, oportunidades usam FTS (não `LIKE '%q%'`)
- [ ] Índices GIN por expressão no Postgres (`portuguese`)
- [ ] Query sanitizada; `plainto_tsquery` (sem operadores tsquery do usuário)

### RF-02 — FilterEngine `contains` seguro

**Critérios de aceite:**

- [ ] Caracteres `%` `_` `\` escapados / removidos do valor do usuário
- [ ] Testes atualizados

### RF-03 — Idempotência persistente

**Critérios de aceite:**

- [ ] Claim via Redis `SET NX` (API platform) com TTL
- [ ] Workers chamam claim antes de processar; duplicata = skip
- [ ] `outbox_events` com unique `(tenant_id, idempotency_key)`

### RF-04 — Retry com backoff

**Critérios de aceite:**

- [ ] ApiClient: até 3 tentativas em 5xx/rede com backoff exponencial
- [ ] Consumer: republica com `x-retry` até N; depois descarta/log (poison)
- [ ] Testes unitários cobrem claim duplicado e retry

---

## 5. Requisitos não funcionais

| ID     | Categoria    | Requisito                                   |
| ------ | ------------ | ------------------------------------------- |
| RNF-01 | Multi-tenant | FTS e claim sempre filtrados por `tenantId` |
| RNF-02 | Mensageria   | Redis = claim/cache; RabbitMQ = eventos     |
| RNF-03 | Performance  | GIN FTS; listagens `q` usam índice          |
| RNF-04 | Quality Gate | `GATE_PASS` antes de DONE                   |

---

## 6. Integrações e camadas afetadas

- [x] **Backend API** (`backend/`)
- [x] **Workers** (`workers/`)
- [x] **Docs** (`docs/`)
- [ ] Frontend / n8n / Chatwoot / AI

---

## 7. Eventos

Sem novos `eventType`. Catálogo: nota de claim Redis em regras de idempotência.

---

## 8. Riscos e conformidade

| Risco                        | Mitigação                        |
| ---------------------------- | -------------------------------- |
| FTS `portuguese` vs nomes EN | `simple` fallback documentado    |
| Redis down                   | claim falha aberta → processa 1x |
| Poison message loop          | max retries + log                |
