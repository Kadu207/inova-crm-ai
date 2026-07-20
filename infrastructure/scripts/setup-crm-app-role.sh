#!/usr/bin/env bash
# Create crm_app role (NOSUPERUSER / NOBYPASSRLS) and grant table access.
# Run once per Postgres volume (or after reset). API uses POSTGRES_APP_USER=crm_app.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
ENV_FILE="${ENV_FILE:-infrastructure/.env}"
PGUSER=$(grep ^POSTGRES_USER= "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
PGPASS=$(grep ^POSTGRES_PASSWORD= "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
APP_DB=$(grep ^POSTGRES_APP_DB= "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
APP_DB="${APP_DB:-crm}"

docker exec -i inova-crm-postgres psql -U "$PGUSER" -d "$APP_DB" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crm_app') THEN
    CREATE ROLE crm_app LOGIN PASSWORD '${PGPASS}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  ELSE
    ALTER ROLE crm_app WITH LOGIN PASSWORD '${PGPASS}' NOSUPERUSER NOBYPASSRLS;
  END IF;
END
\$\$;
GRANT CONNECT ON DATABASE ${APP_DB} TO crm_app;
GRANT USAGE ON SCHEMA public TO crm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crm_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO crm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO crm_app;
SQL

echo "crm_app role ready (NOBYPASSRLS). Ensure POSTGRES_APP_USER=crm_app and recreate api."
