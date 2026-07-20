#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai

echo "=== extract sync ==="
tar -xzf /tmp/crm-sla-atendimento.tgz

echo "=== rebuild api ==="
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps build --no-cache api
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps up -d --force-recreate --no-deps api

for i in $(seq 1 30); do
  st=$(docker inspect inova-crm-api --format '{{.State.Health.Status}}' 2>/dev/null || echo starting)
  echo "api $i $st"
  if [ "$st" = "healthy" ]; then break; fi
  sleep 4
done

# migrate as table owner (inova), not crm_app
PGUSER=$(grep ^POSTGRES_USER= infrastructure/.env | cut -d= -f2- | tr -d '\r')
PGPASS=$(grep ^POSTGRES_PASSWORD= infrastructure/.env | cut -d= -f2- | tr -d '\r')

docker exec -e PGPASSWORD="$PGPASS" inova-crm-postgres \
  psql -U "$PGUSER" -d crm -v ON_ERROR_STOP=1 -c \
  "DELETE FROM _prisma_migrations WHERE migration_name = '20260720180000_opportunity_stage_sla' AND finished_at IS NULL;" || true

docker exec -e PGPASSWORD="$PGPASS" -i inova-crm-postgres \
  psql -U "$PGUSER" -d crm -v ON_ERROR_STOP=1 < backend/prisma/migrations/20260720180000_opportunity_stage_sla/migration.sql

docker exec -e PGPASSWORD="$PGPASS" inova-crm-postgres \
  psql -U "$PGUSER" -d crm -v ON_ERROR_STOP=1 -c \
  "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
   SELECT gen_random_uuid()::text, '', NOW(), '20260720180000_opportunity_stage_sla', NULL, NULL, NOW(), 1
   WHERE NOT EXISTS (SELECT 1 FROM _prisma_migrations WHERE migration_name = '20260720180000_opportunity_stage_sla' AND finished_at IS NOT NULL);"

echo "=== rebuild frontend ==="
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps build frontend
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps up -d --force-recreate --no-deps frontend

echo "=== columns check ==="
docker exec -e PGPASSWORD="$PGPASS" inova-crm-postgres \
  psql -U "$PGUSER" -d crm -c "\d opportunities" | grep -E 'stage_entered|sla_breached' || true

echo DEPLOY_SLA_ATENDIMENTO_OK
