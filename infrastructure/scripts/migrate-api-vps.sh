#!/usr/bin/env bash
# migrate-api-vps.sh — prisma migrate deploy no container api (após load-ci-images).
#
# Uso na VPS:
#   bash infrastructure/scripts/migrate-api-vps.sh
set -euo pipefail
cd /opt/inova-crm-ai

COMPOSE=(docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps)

echo "==> prisma migrate deploy (api)"
"${COMPOSE[@]}" exec -T api npx prisma migrate deploy

echo "==> migrate status"
"${COMPOSE[@]}" exec -T api npx prisma migrate status || true

echo "MIGRATE_API_OK"
