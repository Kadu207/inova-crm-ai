# Spec 031 — Full-text search, idempotência e retry

**Status:** DONE no `main` · commit `0a52666` · gate `2026-09-30T02-32-29-884Z` · versão **1.1.3**  
**VPS:** aguarda CI image load + `prisma migrate deploy` (índices GIN).

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

## Deploy VPS (checklist)

1. CI `Build images (CI)` no SHA `0a52666` (ou tip de `main` que o contenha)
2. `load-ci-images-vps.sh` — ver [`../operations/ci-docker-images.md`](../operations/ci-docker-images.md)
3. `bash infrastructure/scripts/migrate-api-vps.sh` (ou `npx prisma migrate deploy` no container api)
4. Smoke: `GET /api/v1/contacts?q=teste` (e leads) com tenant JWT — sem timeout / 500
5. Workers: logs sem loop de poison; claim Redis ativo se `REDIS_URL` set

## Referências

- Spec: [`../../specs/031-fts-idempotency-retry/spec.md`](../../specs/031-fts-idempotency-retry/spec.md)
- Catálogo eventos: [`../events/catalog-v0.md`](../events/catalog-v0.md)
- Banco: [`../arquitetura-banco-dados.md`](../arquitetura-banco-dados.md) § Índices
- Eventos: [`../arquitetura-event-driven.md`](../arquitetura-event-driven.md)
