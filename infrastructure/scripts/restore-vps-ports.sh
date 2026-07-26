#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai
COMPOSE='docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps'

echo '==> Recreate api+frontend with VPS ports'
$COMPOSE up -d --force-recreate --no-deps api frontend

sleep 12
echo '==> Host ports'
docker ps --filter name=inova-crm-api --filter name=inova-crm-frontend --format '{{.Names}} | {{.Ports}}'
curl -sS -o /dev/null -w 'host-api %{http_code}\n' http://127.0.0.1:9401/api/v1/health || true
# health path may be /health
curl -sS -o /dev/null -w 'host-api-alt %{http_code}\n' http://127.0.0.1:9401/health || true
curl -sS -o /dev/null -w 'host-fe %{http_code}\n' http://127.0.0.1:9400/login || true
curl -sS -o /dev/null -w 'public-api %{http_code}\n' https://api-crm.inovatitech.com.br/health || true
curl -sS -o /dev/null -w 'public-fe %{http_code}\n' https://crm.inovatitech.com.br/login || true

echo '==> Login smoke public'
curl -sS -o /tmp/l.json -w 'login %{http_code}\n' -X POST https://api-crm.inovatitech.com.br/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@inovatitech.com.br","password":"InovaCrm#Oficial2026xK9!","tenantSlug":"inova"}'
head -c 200 /tmp/l.json; echo

echo '==> FE defaults'
curl -sS http://127.0.0.1:9400/login | grep -oE 'value="[^"]+"' | head -5
echo DONE
