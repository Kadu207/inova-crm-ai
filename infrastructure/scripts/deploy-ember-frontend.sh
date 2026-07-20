#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai

echo "=== extract frontend sync ==="
tar -xzf /tmp/crm-ember-frontend.tgz

echo "=== rebuild frontend ==="
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps build frontend
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps up -d --force-recreate --no-deps frontend

for i in $(seq 1 30); do
  st=$(docker inspect inova-crm-frontend --format '{{.State.Status}}' 2>/dev/null || echo starting)
  echo "frontend $i $st"
  if [ "$st" = "running" ]; then break; fi
  sleep 3
done

curl -fsS -o /dev/null -w "crm_http=%{http_code}\n" http://127.0.0.1:9400/ || true
echo DEPLOY_EMBER_FRONTEND_OK
