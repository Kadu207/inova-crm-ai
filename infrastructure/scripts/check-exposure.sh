#!/usr/bin/env bash
# Exposure / smoke checks on VPS.
# Requires: SEED_ADMIN_PASSWORD (and optional SEED_ADMIN_EMAIL, SEED_TENANT_SLUG)
set -euo pipefail
cd /opt/inova-crm-ai

EMAIL="${SEED_ADMIN_EMAIL:-admin@inovatitech.com.br}"
PASS="${SEED_ADMIN_PASSWORD:?SEED_ADMIN_PASSWORD is required}"
SLUG="${SEED_TENANT_SLUG:-demo}"

echo '--- ports ---'
docker ps --format '{{.Names}} | {{.Ports}}'
echo '--- public ---'
curl -sS -o /dev/null -w 'public-api %{http_code}\n' https://api-crm.inovatitech.com.br/api/v1/health || true
curl -sS -o /dev/null -w 'public-fe %{http_code}\n' https://crm.inovatitech.com.br/login || true
echo '--- via docker network ---'
docker exec inova-crm-api node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>r.text()).then(console.log).catch(e=>console.error(e))"
docker exec -e EMAIL="$EMAIL" -e PASS="$PASS" -e SLUG="$SLUG" inova-crm-api node -e "
const email=process.env.EMAIL, password=process.env.PASS, tenantSlug=process.env.SLUG;
fetch('http://127.0.0.1:3000/api/v1/auth/login',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({email,password,tenantSlug})
}).then(async r=>{console.log('login',r.status); console.log((await r.text()).slice(0,180))})
"
docker exec inova-crm-frontend node -e "fetch('http://127.0.0.1:3000/login').then(r=>r.text()).then(t=>{const m=[...t.matchAll(/value=\"([^\"]+)\"/g)].map(x=>x[1]); console.log(m.slice(0,5))})"
ls infrastructure/*compose* 2>/dev/null || true
grep -n '9400\|9401\|ports' infrastructure/docker-compose.yml | head -30
# cloudflared?
docker ps -a --format '{{.Names}}' | grep -i cloud || true
systemctl is-active cloudflared 2>/dev/null || true
