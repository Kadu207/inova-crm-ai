#!/usr/bin/env bash
# Deploy bulk MinIO + Admin SaaS UI; promote inova admin to SUPER_ADMIN.
set -euo pipefail
cd /opt/inova-crm-ai

COMPOSE='docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps'
ENV_FILE=infrastructure/.env

# Ensure bucket env for API
if ! grep -q '^MINIO_BUCKET=' "$ENV_FILE" 2>/dev/null; then
  echo 'MINIO_BUCKET=inova-crm' >> "$ENV_FILE"
fi

echo "==> Ensure MinIO bucket via mc (best-effort)"
bash infrastructure/scripts/setup-minio-mc.sh || true

echo "==> Promote inova admin to SUPER_ADMIN"
PGUSER=$(grep ^POSTGRES_USER= "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
APP_DB=$(grep ^POSTGRES_APP_DB= "$ENV_FILE" | cut -d= -f2- | tr -d '\r' || true)
APP_DB="${APP_DB:-crm}"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$APP_DB" <<'SQL'
UPDATE users u
SET role = 'SUPER_ADMIN'
FROM tenants t
WHERE u.tenant_id = t.id
  AND t.slug = 'inova'
  AND u.email = 'admin@inovatitech.com.br';
SELECT t.slug, u.email, u.role FROM users u JOIN tenants t ON t.id = u.tenant_id
WHERE t.slug IN ('inova','cliente-demo') ORDER BY t.slug;
SQL

echo "==> Rebuild api + frontend (with VPS ports)"
$COMPOSE build api frontend
$COMPOSE up -d --no-deps --force-recreate api frontend

sleep 12
curl -sS -o /dev/null -w 'api-health %{http_code}\n' http://127.0.0.1:9401/health || true
curl -sS -o /dev/null -w 'fe %{http_code}\n' http://127.0.0.1:9400/login || true
echo "DEPLOY_PRODUCT_OK"
