#!/usr/bin/env bash
# Login smoke against local API ports.
# Requires: SEED_ADMIN_PASSWORD
set -euo pipefail

EMAIL="${SEED_ADMIN_EMAIL:-admin@inovatitech.com.br}"
PASS="${SEED_ADMIN_PASSWORD:?SEED_ADMIN_PASSWORD is required}"

sleep 5
curl -sS -o /tmp/h.json -w 'health %{http_code}\n' http://127.0.0.1:9401/api/v1/health || true
curl -sS -o /tmp/l1.json -w 'demo-alias %{http_code}\n' -X POST http://127.0.0.1:9401/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\",\"tenantSlug\":\"demo\"}"
head -c 200 /tmp/l1.json; echo
curl -sS -o /tmp/l2.json -w 'inova %{http_code}\n' -X POST http://127.0.0.1:9401/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\",\"tenantSlug\":\"inova\"}"
head -c 200 /tmp/l2.json; echo
echo '--- login page defaults ---'
curl -sS http://127.0.0.1:9400/login | grep -oE 'value="[^"]+"' | head -6
