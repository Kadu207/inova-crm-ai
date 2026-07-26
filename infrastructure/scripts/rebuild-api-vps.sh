#!/usr/bin/env bash
# Rebuild API on VPS with RAM guard + VPS compose overlay.
set -euo pipefail
cd /opt/inova-crm-ai

COMPOSE=(docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps)
GUARD=infrastructure/scripts/vps-ram-guard.sh

bash "$GUARD" with-build -- env NODE_OPTIONS=--max-old-space-size=1536 "${COMPOSE[@]}" build api

"${COMPOSE[@]}" up -d --no-deps --force-recreate api

sleep 10
curl -sS -o /dev/null -w 'api %{http_code}\n' http://127.0.0.1:9401/health || true
echo API_REBUILD_OK
