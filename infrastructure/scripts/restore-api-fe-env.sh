#!/usr/bin/env bash
# restore-api-fe-env.sh — recreate api/frontend with infrastructure/.env (no image load).
# Use when load-ci-images ran WITHOUT --env-file and api went unhealthy.
#
# Usage on VPS:
#   bash infrastructure/scripts/restore-api-fe-env.sh
set -euo pipefail
cd /opt/inova-crm-ai

ENV_FILE="${ENV_FILE:-infrastructure/.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}" >&2
  exit 1
fi

# Optional: pick up CRM_*_IMAGE from last CI load
if [[ -f dist/images/images.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(sed 's/\r$//' dist/images/images.env)
  set +a
fi

export CRM_API_IMAGE="${CRM_API_IMAGE:-inova-crm-api:ci}"
export CRM_FRONTEND_IMAGE="${CRM_FRONTEND_IMAGE:-inova-crm-frontend:ci}"

COMPOSE=(
  docker compose
  --env-file "$ENV_FILE"
  -f infrastructure/docker-compose.yml
  -f infrastructure/docker-compose.vps.yml
  --profile apps
)

echo "==> Recreate api/frontend with ${ENV_FILE}"
echo "    CRM_API_IMAGE=${CRM_API_IMAGE}"
echo "    CRM_FRONTEND_IMAGE=${CRM_FRONTEND_IMAGE}"
"${COMPOSE[@]}" up -d --no-deps --no-build --force-recreate api frontend

for i in $(seq 1 30); do
  api_code=$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:9401/health 2>/dev/null || echo 000)
  fe_code=$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:9400/login 2>/dev/null || echo 000)
  echo "    try ${i}/30  api=${api_code}  fe=${fe_code}"
  if [[ "$api_code" == "200" && "$fe_code" == "200" ]]; then
    echo "RESTORE_API_FE_OK"
    exit 0
  fi
  sleep 3
done

echo "RESTORE_API_FE_FAIL" >&2
docker logs inova-crm-api --tail 40 >&2 || true
exit 1
