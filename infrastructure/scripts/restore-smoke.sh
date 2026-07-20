#!/usr/bin/env bash
# restore-smoke.sh — non-destructive restore into crm_restore_smoke, validate, drop.
# Does NOT touch the production database (crm).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/inova-crm}"
SMOKE_DB="${SMOKE_DB:-crm_restore_smoke}"

if [ -f "${ROOT_DIR}/infrastructure/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/infrastructure/.env"
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-inova}"
POSTGRES_DB="${POSTGRES_DB:-crm}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-inova-crm-postgres}"
PG_FILE="${1:-${BACKUP_ROOT}/postgres/latest.sql.gz}"

if [ ! -f "${PG_FILE}" ]; then
  echo "ERROR: backup file not found: ${PG_FILE}" >&2
  exit 1
fi

if [ "${SMOKE_DB}" = "${POSTGRES_DB}" ] || [ "${SMOKE_DB}" = "crm" ]; then
  echo "ERROR: SMOKE_DB must not be the production database" >&2
  exit 1
fi

echo "==> restore-smoke from ${PG_FILE} into ${SMOKE_DB}"

docker exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${SMOKE_DB}' AND pid <> pg_backend_pid();" \
  >/dev/null 2>&1 || true

docker exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS ${SMOKE_DB};"

docker exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE ${SMOKE_DB};"

gunzip -c "${PG_FILE}" | docker exec -i "${POSTGRES_CONTAINER}" \
  psql -U "${POSTGRES_USER}" -d "${SMOKE_DB}" -v ON_ERROR_STOP=1 >/dev/null

for table in tenants opportunities; do
  count=$(docker exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${SMOKE_DB}" -tAc \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}';")
  if [ "${count}" != "1" ]; then
    echo "ERROR: expected table ${table} after restore" >&2
    docker exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${SMOKE_DB};" || true
    exit 1
  fi
  echo "    OK table ${table}"
done

docker exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS ${SMOKE_DB};"

echo "RESTORE_SMOKE_OK"
