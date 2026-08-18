# Ops note — Spec 029 (security hardening)

## Admin password

**Pode manter** a senha admin atual na VPS. A remoção de literais nos scripts **não obriga** rotação — só evita versionar a senha no git. Scripts de smoke passam a ler `SEED_ADMIN_PASSWORD` do ambiente (ex.: `.credentials-operator.txt` / export manual).

Rotação continua recomendada **somente** se a senha já vazou fora do time.

## Deploy checklist (Delivery)

1. Confirmar em `infrastructure/.env` na VPS:
   - `JWT_SECRET` — ≥ 32 chars, não placeholder
   - `AI_API_TOKEN` — valor forte; compose injeta no serviço `ai`
2. Aplicar RLS: migration `20260818013000_rls_webhook_bulk_custom` (owner Postgres se `crm_app` sem DDL)
3. Smoke: API `/health`, AI `/health`, login com `SEED_ADMIN_PASSWORD`
4. Load images: `bash infrastructure/scripts/load-ci-images-vps.sh dist/images`  
   — carrega **somente** o SHA de `SHA.txt` (não todos os `.tar.gz` da pasta)

## Webhook secrets por tenant

A API resolve `chatwootWebhookSecret` / `n8nWebhookSecret` em `tenant_configs` antes do env global.

Seed a partir do `.env` (todos os tenants ACTIVE, ou um slug):

```bash
# VPS
bash infrastructure/scripts/seed-tenant-webhook-secrets.sh
TENANT_SLUG=inova bash infrastructure/scripts/seed-tenant-webhook-secrets.sh
```

Variáveis: `CHATWOOT_WEBHOOK_SECRET`, `N8N_WEBHOOK_SECRET`, ou fallback `WEBHOOK_SECRET`.

Admin também pode `PUT /api/v1/config` com key/value (role ADMIN).

See `specs/029-security-hardening-p0/`.
