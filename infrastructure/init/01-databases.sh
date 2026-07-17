#!/bin/bash
# Creates application databases on first PostgreSQL init (empty data volume only).
# Avoid pipefail / CRLF issues from Windows sync — keep this file LF-only.
set -eu

create_db_if_missing() {
  local db="$1"
  local exists
  exists="$(psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB:-postgres}" -tAc \
    "SELECT 1 FROM pg_database WHERE datname='${db}'")"
  if [ "$exists" != "1" ]; then
    psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB:-postgres}" \
      -c "CREATE DATABASE \"${db}\""
    echo "Created database: ${db}"
  else
    echo "Database already exists: ${db}"
  fi
}

# App DB (if POSTGRES_DB is already crm, this is a no-op)
create_db_if_missing "crm"
create_db_if_missing "n8n_crm"
create_db_if_missing "chatwoot_crm"

echo "Databases crm, n8n_crm, chatwoot_crm ensured."
