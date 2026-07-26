#!/usr/bin/env bash
# Apply Spec 019–025 migration as Postgres owner (inova), then re-grant crm_app.
set -euo pipefail
cd /opt/inova-crm-ai

MIG_NAME='20260723230000_system_webhooks_bulk_custom'
MIG_DIR="backend/prisma/migrations/${MIG_NAME}"
MIG_SQL="${MIG_DIR}/migration.sql"
ENV_FILE=infrastructure/.env
COMPOSE='docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps'

PGUSER=$(grep ^POSTGRES_USER= "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
APP_DB=$(grep ^POSTGRES_APP_DB= "$ENV_FILE" | cut -d= -f2- | tr -d '\r' || true)
APP_DB="${APP_DB:-crm}"

if [[ ! -f "$MIG_SQL" ]]; then
  echo "Missing ${MIG_SQL}" >&2
  exit 1
fi

echo "==> Migration status (before)"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$APP_DB" -c \
  "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC NULLS LAST LIMIT 8;"

echo "==> Apply SQL as owner ${PGUSER}"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$APP_DB" < "$MIG_SQL"

echo "==> Record in _prisma_migrations if missing"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$APP_DB" <<SQL
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
SELECT
  md5(random()::text || clock_timestamp()::text),
  md5(clock_timestamp()::text),
  NOW(),
  '${MIG_NAME}',
  NULL,
  NULL,
  NOW(),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations WHERE migration_name = '${MIG_NAME}'
);
SQL

echo "==> Re-grant crm_app"
bash infrastructure/scripts/setup-crm-app-role.sh

echo "==> Verify new tables/columns"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$APP_DB" -c \
  "SELECT to_regclass('public.webhook_subscriptions') AS webhook_subscriptions,
          to_regclass('public.bulk_jobs') AS bulk_jobs,
          to_regclass('public.custom_field_definitions') AS custom_field_definitions;"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$APP_DB" -c \
  "SELECT column_name FROM information_schema.columns
   WHERE table_name='leads' AND column_name IN ('created_by_id','updated_by_id','custom_fields')
   ORDER BY column_name;"

echo "==> Ensure api/frontend with VPS ports"
$COMPOSE up -d --no-deps api frontend
sleep 8
curl -sS -o /dev/null -w 'api-health %{http_code}\n' http://127.0.0.1:9401/health || true
curl -sS -o /dev/null -w 'fe %{http_code}\n' http://127.0.0.1:9400/login || true

echo "MIGRATION_OK"
