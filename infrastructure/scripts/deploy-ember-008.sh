#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai

echo "=== extract sync ==="
tar -xzf /tmp/crm-ember-008.tgz

echo "=== rebuild api ==="
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps build --no-cache api
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps up -d --force-recreate --no-deps api

for i in $(seq 1 40); do
  st=$(docker inspect inova-crm-api --format '{{.State.Health.Status}}' 2>/dev/null || echo starting)
  echo "api $i $st"
  if [ "$st" = "healthy" ]; then break; fi
  sleep 4
done

echo "=== rebuild frontend ==="
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps build frontend
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps up -d --force-recreate --no-deps frontend

for i in $(seq 1 20); do
  st=$(docker inspect inova-crm-frontend --format '{{.State.Status}}' 2>/dev/null || echo starting)
  echo "frontend $i $st"
  if [ "$st" = "running" ]; then break; fi
  sleep 3
done

sleep 5
curl -fsS http://127.0.0.1:9401/health >/dev/null && echo API_HEALTH_OK
curl -fsS -o /dev/null -w "crm_http=%{http_code}\n" http://127.0.0.1:9400/ || true
echo DEPLOY_EMBER_008_OK
