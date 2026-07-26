#!/usr/bin/env bash
# load-ci-images-vps.sh — docker load CI tarballs and recreate api/frontend WITHOUT build.
#
# Usage on VPS:
#   mkdir -p /opt/inova-crm-ai/dist/images
#   # copy *.tar.gz (+ images.env) into that dir, then:
#   bash infrastructure/scripts/load-ci-images-vps.sh
#   bash infrastructure/scripts/load-ci-images-vps.sh /path/to/tarballs
set -euo pipefail
cd /opt/inova-crm-ai

IMG_DIR="${1:-dist/images}"
COMPOSE=(docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps)

if [[ ! -d "$IMG_DIR" ]]; then
  echo "Missing ${IMG_DIR}" >&2
  exit 1
fi

shopt -s nullglob
maps=("${IMG_DIR}"/*.tar.gz)
if [[ ${#maps[@]} -eq 0 ]]; then
  echo "No *.tar.gz in ${IMG_DIR}" >&2
  exit 1
fi

echo "==> docker load"
for f in "${maps[@]}"; do
  echo "    loading ${f}"
  gzip -dc "$f" | docker load
done

if [[ -f "${IMG_DIR}/images.env" ]]; then
  # shellcheck disable=SC1090
  set -a
  # strip CR if copied from Windows
  source <(sed 's/\r$//' "${IMG_DIR}/images.env")
  set +a
fi

export CRM_API_IMAGE="${CRM_API_IMAGE:-inova-crm-api:ci}"
export CRM_FRONTEND_IMAGE="${CRM_FRONTEND_IMAGE:-inova-crm-frontend:ci}"

echo "==> Recreate api/frontend --no-build"
echo "    CRM_API_IMAGE=${CRM_API_IMAGE}"
echo "    CRM_FRONTEND_IMAGE=${CRM_FRONTEND_IMAGE}"

"${COMPOSE[@]}" up -d --no-deps --no-build --force-recreate api frontend

sleep 10
curl -sS -o /dev/null -w 'api %{http_code}\n' http://127.0.0.1:9401/health || true
curl -sS -o /dev/null -w 'fe %{http_code}\n' http://127.0.0.1:9400/login || true
echo "LOAD_CI_IMAGES_OK"
