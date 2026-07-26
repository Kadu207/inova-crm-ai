#!/usr/bin/env bash
# Rebuild frontend on VPS with RAM guard (pause n8n/sidekiq, ensure swap).
# Always uses docker-compose.yml + docker-compose.vps.yml.
set -euo pipefail
cd /opt/inova-crm-ai

COMPOSE=(docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps)
GUARD=infrastructure/scripts/vps-ram-guard.sh

bash "$GUARD" with-build -- env NODE_OPTIONS=--max-old-space-size=1536 "${COMPOSE[@]}" build frontend

"${COMPOSE[@]}" up -d --no-deps --force-recreate frontend

sleep 8
curl -sS -o /dev/null -w 'fe %{http_code}\n' http://127.0.0.1:9400/login || true
docker inspect inova-crm-frontend --format 'created={{.Created}} status={{.State.Status}}'
echo FRONTEND_REBUILD_OK
