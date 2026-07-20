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

create_db_if_missing "crm"
create_db_if_missing "n8n_crm"
create_db_if_missing "chatwoot_crm"

# Non-superuser role for Nest API (RLS enforced under FORCE)
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "crm" <<EOSQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crm_app') THEN
    CREATE ROLE crm_app LOGIN PASSWORD '${POSTGRES_PASSWORD}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
\$\$;
GRANT CONNECT ON DATABASE crm TO crm_app;
GRANT USAGE ON SCHEMA public TO crm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crm_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO crm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO crm_app;
EOSQL

echo "Databases crm, n8n_crm, chatwoot_crm ensured."
echo "Role crm_app ensured for RLS-aware API access."
