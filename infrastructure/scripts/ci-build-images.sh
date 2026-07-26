#!/usr/bin/env bash
# ci-build-images.sh — build api/frontend locally or on a fat CI runner, save tarballs.
# Usage:
#   bash infrastructure/scripts/ci-build-images.sh
#   NEXT_PUBLIC_API_URL=https://api-crm.inovatitech.com.br bash infrastructure/scripts/ci-build-images.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

OUT_DIR="${CI_IMAGE_OUT:-dist/images}"
SHA="$(git rev-parse --short=12 HEAD 2>/dev/null || date +%Y%m%d%H%M)"
API_IMAGE="${CRM_API_IMAGE_NAME:-inova-crm-api}"
FE_IMAGE="${CRM_FRONTEND_IMAGE_NAME:-inova-crm-frontend}"
API_URL="${NEXT_PUBLIC_API_URL:-https://api-crm.inovatitech.com.br}"

mkdir -p "$OUT_DIR"

echo "==> Build ${API_IMAGE}:ci-${SHA}"
docker build -t "${API_IMAGE}:ci-${SHA}" -t "${API_IMAGE}:ci" -f backend/Dockerfile backend

echo "==> Build ${FE_IMAGE}:ci-${SHA}"
docker build \
  --build-arg "NEXT_PUBLIC_API_URL=${API_URL}" \
  -t "${FE_IMAGE}:ci-${SHA}" -t "${FE_IMAGE}:ci" \
  -f frontend/Dockerfile frontend

echo "==> docker save → ${OUT_DIR}"
docker save "${API_IMAGE}:ci-${SHA}" "${API_IMAGE}:ci" | gzip -1 >"${OUT_DIR}/${API_IMAGE}-ci-${SHA}.tar.gz"
docker save "${FE_IMAGE}:ci-${SHA}" "${FE_IMAGE}:ci" | gzip -1 >"${OUT_DIR}/${FE_IMAGE}-ci-${SHA}.tar.gz"

echo "${SHA}" >"${OUT_DIR}/SHA.txt"
cat >"${OUT_DIR}/images.env" <<EOF
CRM_API_IMAGE=${API_IMAGE}:ci
CRM_FRONTEND_IMAGE=${FE_IMAGE}:ci
EOF

ls -lh "${OUT_DIR}"
echo "CI_BUILD_IMAGES_OK sha=${SHA}"
echo "Next: scp ${OUT_DIR}/*.tar.gz to VPS and run load-ci-images-vps.sh"
