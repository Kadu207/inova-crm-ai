#!/usr/bin/env bash
# backup.sh — Postgres pg_dump + MinIO mirror notes
# Cron: 0 3 * * * gestaoti /opt/inova-crm-ai/infrastructure/scripts/backup.sh >> /var/log/inova-crm-backup.log 2>&1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/inova-crm}"
DATE_STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Load env if present
if [ -f "${ROOT_DIR}/infrastructure/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/infrastructure/.env"
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-inova}"
POSTGRES_DB="${POSTGRES_DB:-crm}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-inova-crm-postgres}"

mkdir -p "${BACKUP_ROOT}/postgres" "${BACKUP_ROOT}/minio"

echo "[${DATE_STAMP}] Starting Inova CRM backup"

# --- PostgreSQL ---
PG_FILE="${BACKUP_ROOT}/postgres/inova-crm-${DATE_STAMP}.sql.gz"
echo "==> pg_dump -> ${PG_FILE}"
docker exec "${POSTGRES_CONTAINER}" pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${PG_FILE}"
ln -sf "$(basename "${PG_FILE}")" "${BACKUP_ROOT}/postgres/latest.sql.gz"
echo "    Postgres backup OK ($(du -h "${PG_FILE}" | cut -f1))"

# --- MinIO ---
# Requires mc (MinIO Client) configured: mc alias set inova http://127.0.0.1:9405 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
MINIO_ALIAS="${MINIO_ALIAS:-inova}"
MINIO_BUCKET="${MINIO_BUCKET:-inova-crm}"
MINIO_DIR="${BACKUP_ROOT}/minio/${DATE_STAMP}"

if command -v mc >/dev/null 2>&1; then
  echo "==> mc mirror ${MINIO_ALIAS}/${MINIO_BUCKET} -> ${MINIO_DIR}"
  mc mirror --overwrite "${MINIO_ALIAS}/${MINIO_BUCKET}" "${MINIO_DIR}"
  ln -sfn "${DATE_STAMP}" "${BACKUP_ROOT}/minio/latest"
  echo "    MinIO mirror OK"
else
  echo "==> mc not installed — MinIO backup skipped"
  echo "    Install: https://min.io/docs/minio/linux/reference/minio-mc.html"
  echo "    Example:"
  echo "      mc alias set ${MINIO_ALIAS} http://127.0.0.1:9405 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD"
  echo "      mc mirror ${MINIO_ALIAS}/${MINIO_BUCKET} ${MINIO_DIR}"
fi

# --- Retention ---
echo "==> Pruning backups older than ${RETENTION_DAYS} days"
find "${BACKUP_ROOT}/postgres" -name '*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true
find "${BACKUP_ROOT}/minio" -maxdepth 1 -type d -mtime +"${RETENTION_DAYS}" ! -name minio -exec rm -rf {} + 2>/dev/null || true

echo "[${DATE_STAMP}] Backup complete"
