# Especificacao: Bulk export/import CSV

**ID:** `024-bulk-export-import`
**Status:** implementado (MinIO)
**Data:** 2026-07-24

## Objetivo

Bulk export/import CSV com arquivos em object storage MinIO (ADR 002), prefixo `{tenantId}/bulk/`.

## Comportamento

- `POST /bulk/export` → CSV em MinIO (`MINIO_BUCKET`, default `inova-crm`)
- `POST /bulk/import` → processa CSV + arquiva copia no mesmo prefixo
- `GET /bulk/jobs/:id/download` → le do MinIO
- Fallback local (`.data/bulk` / `BULK_STORAGE_DIR`) somente quando MinIO env nao esta configurado (testes/dev)
