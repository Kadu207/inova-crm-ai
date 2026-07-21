#!/usr/bin/env bash
# setup-minio-mc.sh — install mc (if needed) and configure alias for CRM MinIO backup
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if [ -f "${ROOT_DIR}/infrastructure/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source <(sed 's/\r$//' "${ROOT_DIR}/infrastructure/.env")
  set +a
fi

MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://127.0.0.1:9405}"
MINIO_ALIAS="${MINIO_ALIAS:-inova}"
MINIO_BUCKET="${MINIO_BUCKET:-inova-crm}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-}"

if [ -z "${MINIO_ROOT_USER}" ] || [ -z "${MINIO_ROOT_PASSWORD}" ]; then
  echo "ERROR: MINIO_ROOT_USER / MINIO_ROOT_PASSWORD missing in infrastructure/.env" >&2
  exit 1
fi

if ! command -v mc >/dev/null 2>&1; then
  echo "==> Installing mc (MinIO Client)"
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64|amd64) MC_ARCH=amd64 ;;
    aarch64|arm64) MC_ARCH=arm64 ;;
    *) echo "Unsupported arch: $ARCH" >&2; exit 1 ;;
  esac
  curl -fsSL "https://dl.min.io/client/mc/release/linux-${MC_ARCH}/mc" -o /tmp/mc
  chmod +x /tmp/mc
  if [ -w /usr/local/bin ]; then
    mv /tmp/mc /usr/local/bin/mc
  else
    mkdir -p "${HOME}/bin"
    mv /tmp/mc "${HOME}/bin/mc"
    export PATH="${HOME}/bin:${PATH}"
  fi
fi

echo "==> mc alias set ${MINIO_ALIAS} ${MINIO_ENDPOINT}"
mc alias set "${MINIO_ALIAS}" "${MINIO_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

if ! mc ls "${MINIO_ALIAS}/${MINIO_BUCKET}" >/dev/null 2>&1; then
  echo "==> Creating bucket ${MINIO_BUCKET}"
  mc mb "${MINIO_ALIAS}/${MINIO_BUCKET}" || true
fi

mc ls "${MINIO_ALIAS}/${MINIO_BUCKET}" >/dev/null
echo "MINIO_MC_OK alias=${MINIO_ALIAS} endpoint=${MINIO_ENDPOINT} bucket=${MINIO_BUCKET}"
