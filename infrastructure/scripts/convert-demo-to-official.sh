#!/usr/bin/env bash
# Convert tenant demo → inova and reset official admin password on VPS.
set -euo pipefail
ROOT="${1:-/opt/inova-crm-ai}"
cd "$ROOT"

OFFICIAL_SLUG="${SEED_TENANT_SLUG:-inova}"
OFFICIAL_NAME="${SEED_TENANT_NAME:-Inova TI}"
OFFICIAL_EMAIL="${SEED_ADMIN_EMAIL:-admin@inovatitech.com.br}"
OFFICIAL_PASS="${SEED_ADMIN_PASSWORD:-}"
OFFICIAL_USER_NAME="${SEED_ADMIN_NAME:-Admin Inova TI}"

if [[ -z "$OFFICIAL_PASS" ]]; then
  echo "SEED_ADMIN_PASSWORD is required" >&2
  exit 1
fi

COMPOSE="docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps"

echo "==> Renaming tenant demo → ${OFFICIAL_SLUG} (if present)"
$COMPOSE exec -T postgres psql -U inova -d crm <<SQL
UPDATE tenants
SET slug = '${OFFICIAL_SLUG}',
    name = '${OFFICIAL_NAME}',
    status = 'ACTIVE',
    plan = 'STARTER',
    updated_at = NOW()
WHERE slug IN ('demo', '${OFFICIAL_SLUG}');
SELECT id, slug, name, status FROM tenants;
SQL

echo "==> Running prisma seed with official credentials"
$COMPOSE exec -T \
  -e SEED_TENANT_SLUG="$OFFICIAL_SLUG" \
  -e SEED_TENANT_NAME="$OFFICIAL_NAME" \
  -e SEED_ADMIN_EMAIL="$OFFICIAL_EMAIL" \
  -e SEED_ADMIN_PASSWORD="$OFFICIAL_PASS" \
  -e SEED_ADMIN_NAME="$OFFICIAL_USER_NAME" \
  -e SEED_CHATWOOT_ACCOUNT_ID="${SEED_CHATWOOT_ACCOUNT_ID:-1}" \
  api sh -c 'cd /app && npx prisma db seed' || \
$COMPOSE exec -T \
  -e SEED_TENANT_SLUG="$OFFICIAL_SLUG" \
  -e SEED_TENANT_NAME="$OFFICIAL_NAME" \
  -e SEED_ADMIN_EMAIL="$OFFICIAL_EMAIL" \
  -e SEED_ADMIN_PASSWORD="$OFFICIAL_PASS" \
  -e SEED_ADMIN_NAME="$OFFICIAL_USER_NAME" \
  -e SEED_CHATWOOT_ACCOUNT_ID="${SEED_CHATWOOT_ACCOUNT_ID:-1}" \
  api node -e "console.log('seed via container — check package')" 

# Prefer API container seed; fallback: run seed from host if mounted
if $COMPOSE exec -T api test -f /app/prisma/seed.ts 2>/dev/null; then
  $COMPOSE exec -T \
    -e SEED_TENANT_SLUG="$OFFICIAL_SLUG" \
    -e SEED_TENANT_NAME="$OFFICIAL_NAME" \
    -e SEED_ADMIN_EMAIL="$OFFICIAL_EMAIL" \
    -e SEED_ADMIN_PASSWORD="$OFFICIAL_PASS" \
    -e SEED_ADMIN_NAME="$OFFICIAL_USER_NAME" \
    -e SEED_CHATWOOT_ACCOUNT_ID="${SEED_CHATWOOT_ACCOUNT_ID:-1}" \
    -e DATABASE_URL \
    api npx tsx prisma/seed.ts
fi

umask 077
cat > .credentials-operator.txt <<EOF
# Inova CRM AI — credenciais oficiais (gerado $(date -u +%Y-%m-%dT%H:%M:%SZ))
crm_tenant=${OFFICIAL_SLUG}
crm_email=${OFFICIAL_EMAIL}
crm_password=${OFFICIAL_PASS}
crm_login_url=https://crm.inovatitech.com.br/login
chatwoot_superadmin_email=admin@inovatitech.com.br
# chatwoot password: keep previous unless rotated separately
EOF
chmod 600 .credentials-operator.txt

echo "==> Login smoke"
HTTP=$(curl -sS -o /tmp/crm-login.json -w '%{http_code}' \
  -X POST https://api-crm.inovatitech.com.br/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${OFFICIAL_EMAIL}\",\"password\":\"${OFFICIAL_PASS}\",\"tenantSlug\":\"${OFFICIAL_SLUG}\"}" || true)
echo "login HTTP ${HTTP}"
head -c 200 /tmp/crm-login.json; echo
