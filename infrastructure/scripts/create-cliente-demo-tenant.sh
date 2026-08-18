#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai

# Requires: CLIENTE_DEMO_PASSWORD (or SEED_ADMIN_PASSWORD)
SLUG='cliente-demo'
NAME='Cliente Demo'
EMAIL='admin@cliente-demo.example'
PASS="${CLIENTE_DEMO_PASSWORD:-${SEED_ADMIN_PASSWORD:?CLIENTE_DEMO_PASSWORD or SEED_ADMIN_PASSWORD is required}}"
ADMIN_NAME='Admin Cliente Demo'
API='https://api-crm.inovatitech.com.br/api/v1'
COMPOSE='docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps'

echo "==> Register tenant ${SLUG} (ignore if already exists)"
curl -sS -X POST "${API}/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"tenantName\":\"${NAME}\",\"tenantSlug\":\"${SLUG}\",\"name\":\"${ADMIN_NAME}\",\"email\":\"${EMAIL}\",\"password\":\"${PASS}\"}" \
  | tee /tmp/reg-cliente-demo.json | head -c 400
echo

echo "==> Login"
curl -sS -X POST "${API}/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\",\"tenantSlug\":\"${SLUG}\"}" \
  > /tmp/login-cliente-demo.json
head -c 400 /tmp/login-cliente-demo.json; echo

TOKEN=$(python3 -c "import json; print(json.load(open('/tmp/login-cliente-demo.json')).get('accessToken',''))")
TENANT_ID=$(python3 -c "import json; print(json.load(open('/tmp/login-cliente-demo.json')).get('tenantId',''))")

if [[ -z "$TOKEN" || -z "$TENANT_ID" ]]; then
  echo "Login failed — abort sample data" >&2
  cat /tmp/login-cliente-demo.json >&2
  exit 1
fi

echo "tenantId=${TENANT_ID}"

echo "==> Sample lead + company (isolation markers)"
curl -sS -X POST "${API}/leads" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H 'Content-Type: application/json' \
  -d '{"title":"[cliente-demo] Lead isolamento UI","notes":"Nao deve aparecer no tenant inova"}' | head -c 300
echo
curl -sS -X POST "${API}/companies" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H 'Content-Type: application/json' \
  -d '{"name":"[cliente-demo] Empresa Isolada","industry":"Teste"}' | head -c 300
echo

echo "==> Ensure default pipeline via seed"
$COMPOSE exec -T \
  -e SEED_TENANT_SLUG="$SLUG" \
  -e SEED_TENANT_NAME="$NAME" \
  -e SEED_ADMIN_EMAIL="$EMAIL" \
  -e SEED_ADMIN_PASSWORD="$PASS" \
  -e SEED_ADMIN_NAME="$ADMIN_NAME" \
  -e SEED_CHATWOOT_ACCOUNT_ID=1 \
  api npx tsx prisma/seed.ts

echo "==> Tenants"
$COMPOSE exec -T postgres psql -U inova -d crm -c "SELECT slug, name, status FROM tenants ORDER BY slug;"

umask 077
if [[ -f .credentials-operator.txt ]] && ! grep -q 'cliente_demo_tenant=' .credentials-operator.txt; then
  cat >> .credentials-operator.txt <<EOF

# Tenant exemplo isolamento UI
cliente_demo_tenant=${SLUG}
cliente_demo_email=${EMAIL}
cliente_demo_password=${PASS}
EOF
fi

echo "DONE"
