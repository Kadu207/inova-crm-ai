# Ops note — Spec 029 (security hardening)

## Admin password

**Pode manter** a senha admin atual na VPS. A remoção de literais nos scripts **não obriga** rotação — só evita versionar a senha no git. Scripts de smoke passam a ler `SEED_ADMIN_PASSWORD` do ambiente (ex.: `.credentials-operator.txt` / export manual).

Rotação continua recomendada **somente** se a senha já vazou fora do time.

## Deploy checklist (Delivery)

1. Confirmar em `infrastructure/.env` na VPS:
   - `JWT_SECRET` — ≥ 32 chars, não placeholder
   - `AI_API_TOKEN` — valor forte; compose injeta no serviço `ai`
2. Aplicar RLS: `prisma migrate deploy` (migration `20260818013000_rls_webhook_bulk_custom`)
3. Smoke: API `/health`, AI `/health`, login com `SEED_ADMIN_PASSWORD`

See `specs/029-security-hardening-p0/`.
