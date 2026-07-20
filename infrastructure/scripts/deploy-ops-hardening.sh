#!/usr/bin/env bash
# VPS: sync ops hardening — backup scripts, API SLA check-all, cron
set -euo pipefail
cd /opt/inova-crm-ai

echo "=== extract sync ==="
tar -xzf /tmp/crm-ops-hardening.tgz

chmod +x infrastructure/scripts/backup.sh infrastructure/scripts/restore-smoke.sh

export BACKUP_ROOT="${BACKUP_ROOT:-/opt/inova-crm-ai/backups}"
LOG_DIR="/opt/inova-crm-ai/logs"
mkdir -p "${BACKUP_ROOT}/postgres" "${BACKUP_ROOT}/minio" "${LOG_DIR}"

echo "=== run backup ==="
bash infrastructure/scripts/backup.sh | tee -a "${LOG_DIR}/backup.log"

echo "=== restore-smoke ==="
bash infrastructure/scripts/restore-smoke.sh

echo "=== install cron (03:00) ==="
CRON_LINE="0 3 * * * BACKUP_ROOT=${BACKUP_ROOT} /opt/inova-crm-ai/infrastructure/scripts/backup.sh >> ${LOG_DIR}/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v 'inova-crm-ai/infrastructure/scripts/backup.sh' || true; echo "$CRON_LINE") | crontab -
crontab -l | grep 'inova-crm-ai/infrastructure/scripts/backup.sh' || { echo "ERROR: cron not installed"; exit 1; }

echo "=== rebuild api ==="
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps build --no-cache api
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps up -d --force-recreate --no-deps api

for i in $(seq 1 45); do
  st=$(docker inspect inova-crm-api --format '{{.State.Health.Status}}' 2>/dev/null || echo starting)
  echo "api $i $st"
  if [ "$st" = "healthy" ]; then break; fi
  sleep 4
done

API_TOKEN=$(grep ^API_TOKEN= infrastructure/.env | cut -d= -f2- | tr -d '\r' || true)
if [ -n "${API_TOKEN:-}" ]; then
  code=$(curl -sS -o /tmp/sla-all.json -w '%{http_code}' \
    -X POST http://127.0.0.1:9401/api/v1/opportunities/sla/check-all \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" || echo 000)
  echo "sla/check-all HTTP $code"
  head -c 400 /tmp/sla-all.json 2>/dev/null || true
  echo
fi

curl -fsS http://127.0.0.1:9401/health >/dev/null && echo API_HEALTH_OK
echo DEPLOY_OPS_HARDENING_OK
