#!/usr/bin/env bash
# load-ci-images-vps.sh — docker load CI tarballs and recreate api/frontend WITHOUT build.
#
# Usage on VPS:
#   mkdir -p /opt/inova-crm-ai/dist/images
#   # copy *.tar.gz (+ images.env + SHA.txt) into that dir, then:
#   bash infrastructure/scripts/load-ci-images-vps.sh
#   bash infrastructure/scripts/load-ci-images-vps.sh /path/to/tarballs
#
# Loads ONLY the SHA listed in SHA.txt (or CRM_IMAGE_SHA / --sha=).
# Avoids old *.tar.gz in the same folder overwriting the :ci tag.
#
# REQUIRES infrastructure/.env (POSTGRES_*, JWT_SECRET, REDIS_*, etc.).
set -euo pipefail
cd /opt/inova-crm-ai

IMG_DIR="${1:-dist/images}"
ENV_FILE="${ENV_FILE:-infrastructure/.env}"
SHA_OVERRIDE="${CRM_IMAGE_SHA:-}"

for arg in "$@"; do
  case "$arg" in
    --sha=*) SHA_OVERRIDE="${arg#--sha=}" ;;
  esac
done
# If first arg looks like a path, keep IMG_DIR; optional second --sha=
if [[ "${1:-}" == --sha=* ]]; then
  IMG_DIR=dist/images
  SHA_OVERRIDE="${1#--sha=}"
elif [[ -n "${2:-}" && "${2}" == --sha=* ]]; then
  SHA_OVERRIDE="${2#--sha=}"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE} — aborting (api would start with blank secrets)." >&2
  exit 1
fi

COMPOSE=(
  docker compose
  --env-file "$ENV_FILE"
  -f infrastructure/docker-compose.yml
  -f infrastructure/docker-compose.vps.yml
  --profile apps
)

if [[ ! -d "$IMG_DIR" ]]; then
  echo "Missing ${IMG_DIR}" >&2
  exit 1
fi

SHA="${SHA_OVERRIDE}"
if [[ -z "$SHA" && -f "${IMG_DIR}/SHA.txt" ]]; then
  SHA=$(tr -d '[:space:]\r' < "${IMG_DIR}/SHA.txt")
fi
if [[ -z "$SHA" ]]; then
  echo "Missing SHA — provide ${IMG_DIR}/SHA.txt or CRM_IMAGE_SHA / --sha=<12hex>" >&2
  exit 1
fi

API_TAR="${IMG_DIR}/inova-crm-api-ci-${SHA}.tar.gz"
FE_TAR="${IMG_DIR}/inova-crm-frontend-ci-${SHA}.tar.gz"
if [[ ! -f "$API_TAR" || ! -f "$FE_TAR" ]]; then
  echo "Missing tarballs for SHA=${SHA}:" >&2
  echo "  ${API_TAR}" >&2
  echo "  ${FE_TAR}" >&2
  exit 1
fi

echo "==> docker load (SHA=${SHA} only)"
echo "    loading ${API_TAR}"
gzip -dc "$API_TAR" | docker load
echo "    loading ${FE_TAR}"
gzip -dc "$FE_TAR" | docker load

if [[ -f "${IMG_DIR}/images.env" ]]; then
  # shellcheck disable=SC1090
  set -a
  source <(sed 's/\r$//' "${IMG_DIR}/images.env")
  set +a
fi

export CRM_API_IMAGE="${CRM_API_IMAGE:-inova-crm-api:ci}"
export CRM_FRONTEND_IMAGE="${CRM_FRONTEND_IMAGE:-inova-crm-frontend:ci}"

echo "==> Recreate api/frontend --no-build (with ${ENV_FILE})"
echo "    CRM_API_IMAGE=${CRM_API_IMAGE}"
echo "    CRM_FRONTEND_IMAGE=${CRM_FRONTEND_IMAGE}"

"${COMPOSE[@]}" up -d --no-deps --no-build --force-recreate api frontend

echo "==> Wait health"
ok=0
for i in $(seq 1 30); do
  api_code=$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:9401/health 2>/dev/null || echo 000)
  fe_code=$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:9400/login 2>/dev/null || echo 000)
  echo "    try ${i}/30  api=${api_code}  fe=${fe_code}"
  if [[ "$api_code" == "200" && "$fe_code" == "200" ]]; then
    ok=1
    break
  fi
  sleep 3
done

if [[ "$ok" -ne 1 ]]; then
  echo "LOAD_CI_IMAGES_FAIL — api/frontend not healthy" >&2
  echo "Hint: docker logs inova-crm-api --tail 80" >&2
  echo "Hint: confirm ${ENV_FILE} has POSTGRES_PASSWORD JWT_SECRET REDIS_PASSWORD" >&2
  exit 1
fi

echo "LOAD_CI_IMAGES_OK"
echo "api 200"
echo "fe 200"
echo "sha ${SHA}"
