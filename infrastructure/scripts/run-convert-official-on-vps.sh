#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai

# Requires: SEED_ADMIN_PASSWORD (never hardcode credentials in git)
OFFICIAL_SLUG="${SEED_TENANT_SLUG:-inova}"
OFFICIAL_NAME="${SEED_TENANT_NAME:-Inova TI}"
OFFICIAL_EMAIL="${SEED_ADMIN_EMAIL:-admin@inovatitech.com.br}"
OFFICIAL_PASS="${SEED_ADMIN_PASSWORD:?SEED_ADMIN_PASSWORD is required}"
OFFICIAL_USER_NAME="${SEED_ADMIN_NAME:-Admin Inova TI}"
OLD_EMAIL='admin@demo.inovatitech.com.br'

COMPOSE='docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps'

echo '==> Convert tenant demo -> inova + rename admin email'
$COMPOSE exec -T postgres psql -U inova -d crm <<'SQL'
UPDATE tenants
SET slug = 'inova',
    name = 'Inova TI',
    status = 'ACTIVE',
    plan = 'STARTER',
    updated_at = NOW()
WHERE slug = 'demo';

UPDATE users u
SET email = 'admin@inovatitech.com.br',
    name = 'Admin Inova TI',
    role = 'ADMIN',
    is_active = true,
    updated_at = NOW()
FROM tenants t
WHERE u.tenant_id = t.id
  AND t.slug = 'inova'
  AND u.email IN ('admin@demo.inovatitech.com.br', 'admin@inovatitech.com.br');

SELECT t.slug, t.name, u.email, u.role, u.is_active
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
ORDER BY t.slug, u.email;
SQL

echo '==> Seed password hash via API container'
$COMPOSE exec -T \
  -e SEED_TENANT_SLUG="$OFFICIAL_SLUG" \
  -e SEED_TENANT_NAME="$OFFICIAL_NAME" \
  -e SEED_ADMIN_EMAIL="$OFFICIAL_EMAIL" \
  -e SEED_ADMIN_PASSWORD="$OFFICIAL_PASS" \
  -e SEED_ADMIN_NAME="$OFFICIAL_USER_NAME" \
  -e SEED_CHATWOOT_ACCOUNT_ID=1 \
  api npx tsx prisma/seed.ts

umask 077
# preserve chatwoot lines if present
CHATWOOT_BLOCK=''
if [[ -f .credentials-operator.txt ]]; then
  CHATWOOT_BLOCK=$(grep -E 'chatwoot_|n8n_|agent@' .credentials-operator.txt || true)
fi

cat > .credentials-operator.txt <<EOF
# Inova CRM AI — credenciais OFICIAIS ($(date -u +%Y-%m-%dT%H:%M:%SZ))
crm_tenant=${OFFICIAL_SLUG}
crm_email=${OFFICIAL_EMAIL}
crm_password=${OFFICIAL_PASS}
crm_login_url=https://crm.inovatitech.com.br/login
${CHATWOOT_BLOCK}
EOF
chmod 600 .credentials-operator.txt

echo '==> Smoke login'
curl -sS -X POST https://api-crm.inovatitech.com.br/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${OFFICIAL_EMAIL}\",\"password\":\"${OFFICIAL_PASS}\",\"tenantSlug\":\"${OFFICIAL_SLUG}\"}" | head -c 300
echo
