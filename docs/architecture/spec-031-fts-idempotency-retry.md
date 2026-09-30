# Spec 031 — Full-text search, idempotência e retry

## Problema

- Listagens `?q=` usavam Prisma `contains` → SQL `LIKE '%q%'` (sem índice, wildcards do usuário).
- Idempotência dos workers era `Set` em memória (some no restart / multi-réplica).
- Consumer fazia `nack` sem requeue — falha transitória descartava o evento.

## Solução

### Full-text search (Postgres)

- Índices GIN por expressão (`to_tsvector('portuguese', …)`) nas tabelas de domínio.
- Helper `backend/src/common/full-text-search.ts` com `plainto_tsquery` + sanitização.
- Listagens (contacts, leads, companies, products, services, tasks, opportunities) usam FTS quando `q` está presente.

### FilterEngine `contains`

- Remove `%` `_` `\` do valor (mitiga wildcard injection).
- Busca livre continua preferindo `?q=` (FTS).

### Idempotência

- `POST /api/v1/platform/idempotency/claim` (`@PlatformApi` / `API_TOKEN`).
- Redis `SET NX` com TTL 7 dias (`crm:idem:{tenantId}:{key}`).
- Workers claimam antes de processar.
- `outbox_events` unique `(tenant_id, idempotency_key)`.

### Retry

- `ApiClient`: até 3 tentativas em 5xx/429/rede com backoff exponencial.
- Consumer: até 5 republicações com header `x-retry` + backoff; depois poison discard.

## Migração

`backend/prisma/migrations/20260930010000_fts_idempotency/`

## Referências

- Spec: `specs/031-fts-idempotency-retry/spec.md`
- Catálogo eventos: `docs/events/catalog-v0.md`
