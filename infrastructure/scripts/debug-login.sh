#!/usr/bin/env bash
# Debug login attempts against production API.
# Requires: SEED_ADMIN_PASSWORD
# Optional: SEED_ADMIN_EMAIL, SEED_TENANT_SLUG, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, CLIENTE_DEMO_PASSWORD
set -euo pipefail
API='https://api-crm.inovatitech.com.br/api/v1'

EMAIL="${SEED_ADMIN_EMAIL:-admin@inovatitech.com.br}"
PASS="${SEED_ADMIN_PASSWORD:?SEED_ADMIN_PASSWORD is required}"
SLUG="${SEED_TENANT_SLUG:-inova}"
DEMO_EMAIL="${DEMO_ADMIN_EMAIL:-admin@demo.inovatitech.com.br}"
DEMO_PASS="${DEMO_ADMIN_PASSWORD:-}"
CLIENTE_PASS="${CLIENTE_DEMO_PASSWORD:-}"

try_login() {
  local slug="$1" email="$2" pass="$3" label="$4"
  if [[ -z "$pass" ]]; then
    echo "=== ${label} SKIPPED (password env empty)"
    return 0
  fi
  code=$(curl -sS -o /tmp/login-try.json -w '%{http_code}' -X POST "${API}/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${pass}\",\"tenantSlug\":\"${slug}\"}")
  echo "=== ${label} HTTP ${code}"
  head -c 220 /tmp/login-try.json; echo
}

try_login "$SLUG" "$EMAIL" "$PASS" "${SLUG} + SEED_ADMIN_PASSWORD"
try_login 'demo' "$EMAIL" "$PASS" 'demo slug + SEED_ADMIN_PASSWORD'
try_login 'demo' "$DEMO_EMAIL" "$PASS" 'demo email + SEED_ADMIN_PASSWORD'
try_login 'demo' "$DEMO_EMAIL" "$DEMO_PASS" 'demo + DEMO_ADMIN_PASSWORD'
try_login 'cliente-demo' 'admin@cliente-demo.example' "$CLIENTE_PASS" 'cliente-demo'

cd /opt/inova-crm-ai
docker compose -f infrastructure/docker-compose.yml exec -T postgres psql -U inova -d crm -c \
  "SELECT t.slug, u.email, u.is_active FROM tenants t JOIN users u ON u.tenant_id=t.id WHERE t.slug IN ('inova','demo','cliente-demo') ORDER BY t.slug;"

docker compose -f infrastructure/docker-compose.yml exec -T frontend sh -c \
  'grep -R "demo\|admin@demo\|inova" /app/.next/server 2>/dev/null | head -5 || grep -R "tenantSlug\|admin@" /app -g "*.js" 2>/dev/null | head -5 || ls /app | head'
