#!/usr/bin/env bash
# Seed per-tenant webhook secrets into TenantConfig (Spec 029 T-43).
#
# Reads global secrets from infrastructure/.env and upserts:
#   chatwootWebhookSecret
#   n8nWebhookSecret
# for each ACTIVE tenant (or TENANT_SLUG=inova only).
#
# Usage on VPS:
#   bash infrastructure/scripts/seed-tenant-webhook-secrets.sh
#   TENANT_SLUG=inova bash infrastructure/scripts/seed-tenant-webhook-secrets.sh
#
# Requires: API container healthy; uses postgres as owner (bypasses RLS for seed).
set -euo pipefail
cd /opt/inova-crm-ai

ENV_FILE="${ENV_FILE:-infrastructure/.env}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps)

PGUSER=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
APP_DB=$(grep -E '^POSTGRES_APP_DB=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' || true)
APP_DB="${APP_DB:-crm}"

# Prefer dedicated vars; fall back to WEBHOOK_SECRET for both (compat).
CHATWOOT_SECRET=$(grep -E '^CHATWOOT_WEBHOOK_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' || true)
N8N_SECRET=$(grep -E '^N8N_WEBHOOK_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' || true)
WEBHOOK_SECRET=$(grep -E '^WEBHOOK_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' || true)
CHATWOOT_SECRET="${CHATWOOT_SECRET:-$WEBHOOK_SECRET}"
N8N_SECRET="${N8N_SECRET:-$WEBHOOK_SECRET}"

if [[ -z "$CHATWOOT_SECRET" || -z "$N8N_SECRET" ]]; then
  echo "Missing CHATWOOT_WEBHOOK_SECRET/N8N_WEBHOOK_SECRET/WEBHOOK_SECRET in ${ENV_FILE}" >&2
  exit 1
fi

SLUG_FILTER="${TENANT_SLUG:-}"

echo "==> Seed tenant webhook secrets (slug filter: ${SLUG_FILTER:-ALL ACTIVE})"

# Escape single quotes for SQL string literals
esc() { printf "%s" "$1" | sed "s/'/''/g"; }
CW=$(esc "$CHATWOOT_SECRET")
N8=$(esc "$N8N_SECRET")

SQL=$(cat <<SQL
DO \$\$
DECLARE
  r RECORD;
  slug_filter text := '${SLUG_FILTER}';
BEGIN
  FOR r IN
    SELECT id, slug FROM tenants
    WHERE status = 'ACTIVE'
      AND (slug_filter = '' OR slug = slug_filter)
  LOOP
    INSERT INTO tenant_configs (id, tenant_id, key, value, created_at, updated_at)
    VALUES (
      'c' || substr(md5(random()::text || clock_timestamp()::text), 1, 24),
      r.id,
      'chatwootWebhookSecret',
      to_jsonb('${CW}'::text),
      NOW(),
      NOW()
    )
    ON CONFLICT (tenant_id, key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW();

    INSERT INTO tenant_configs (id, tenant_id, key, value, created_at, updated_at)
    VALUES (
      'c' || substr(md5(random()::text || clock_timestamp()::text), 1, 24),
      r.id,
      'n8nWebhookSecret',
      to_jsonb('${N8}'::text),
      NOW(),
      NOW()
    )
    ON CONFLICT (tenant_id, key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW();

    RAISE NOTICE 'seeded tenant % (%)', r.slug, r.id;
  END LOOP;
END
\$\$;

SELECT t.slug, c.key, length(c.value::text) AS value_len
FROM tenant_configs c
JOIN tenants t ON t.id = c.tenant_id
WHERE c.key IN ('chatwootWebhookSecret', 'n8nWebhookSecret')
ORDER BY t.slug, c.key;
SQL
)

"${COMPOSE[@]}" exec -T postgres psql -U "$PGUSER" -d "$APP_DB" -v ON_ERROR_STOP=1 -c "$SQL"

echo "SEED_TENANT_WEBHOOK_SECRETS_OK"
