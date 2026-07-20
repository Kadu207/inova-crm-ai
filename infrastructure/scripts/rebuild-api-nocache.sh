#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai
# bust cache so COPY src picks up conversation fix
touch backend/src/conversations/conversations.service.ts
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps build --no-cache api
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps up -d --force-recreate --no-deps api
for i in $(seq 1 20); do
  st=$(docker inspect inova-crm-api --format '{{.State.Health.Status}}' 2>/dev/null || echo starting)
  echo "api $i $st"
  if [ "$st" = "healthy" ]; then exit 0; fi
  sleep 4
done
exit 1
