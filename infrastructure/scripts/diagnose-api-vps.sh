#!/usr/bin/env bash
# Diagnose unhealthy inova-crm-api on VPS — run on the server:
#   bash infrastructure/scripts/diagnose-api-vps.sh
set -eu

echo "==> Container status"
docker ps -a --filter name=inova-crm-api --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo ""
echo "==> Last logs"
docker logs inova-crm-api --tail 80 2>&1 || true

echo ""
echo "==> Health inspect"
docker inspect inova-crm-api --format '{{json .State.Health}}' 2>&1 | head -c 2000 || true
echo ""

echo "==> Probe from host"
curl -sv http://127.0.0.1:9401/health 2>&1 | tail -20 || true
curl -sv http://127.0.0.1:9401/api/v1/health 2>&1 | tail -10 || true

echo ""
echo "==> Env keys present (no secrets printed)"
docker exec inova-crm-api sh -c 'echo DATABASE_URL=${DATABASE_URL:+set}; echo JWT_SECRET=${JWT_SECRET:+set}; echo REDIS_URL=${REDIS_URL:+set}; echo RABBITMQ_URL=${RABBITMQ_URL:+set}' 2>&1 || true
