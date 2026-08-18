#!/usr/bin/env bash
# Hotfix login page defaults + rebuild frontend; rebuild API auth alias.
set -euo pipefail
cd /opt/inova-crm-ai

LOGIN_FILE=frontend/app/login/page.tsx
if [[ -f "$LOGIN_FILE" ]]; then
  python3 - <<'PY'
from pathlib import Path
p = Path('frontend/app/login/page.tsx')
t = p.read_text(encoding='utf-8')
t2 = t
t2 = t2.replace("useState('demo')", "useState('inova')")
t2 = t2.replace("useState(\"demo\")", "useState('inova')")
t2 = t2.replace("useState('admin@demo.inovatitech.com.br')", "useState('admin@inovatitech.com.br')")
t2 = t2.replace("useState(\"admin@demo.inovatitech.com.br\")", "useState('admin@inovatitech.com.br')")
t2 = t2.replace("useState('InovaDemo@2026')", "useState('')")
t2 = t2.replace("useState(\"InovaDemo@2026\")", "useState('')")
t2 = t2.replace('placeholder="demo"', 'placeholder="inova"')
t2 = t2.replace("seed local: tenant <code>demo</code>", "tenant oficial: <code>inova</code>")
if t2 == t:
    print('login page: no string replacements needed (may already be updated)')
else:
    p.write_text(t2, encoding='utf-8')
    print('login page: defaults updated on disk')
PY
fi

# Auth alias in API source if present on host
AUTH=backend/src/auth/auth.service.ts
if [[ -f "$AUTH" ]] && ! grep -q "tenant legado" "$AUTH"; then
  echo "NOTE: auth.service.ts on host may need sync from git — will rebuild from image context"
fi

COMPOSE='docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps'

echo "==> Rebuild frontend (login defaults)"
$COMPOSE build --no-cache frontend

echo "==> Rebuild api (login alias demo->inova)"
# Copy auth fix into build context if file exists in repo mount
$COMPOSE build api

echo "==> Recreate containers"
$COMPOSE up -d --force-recreate frontend api

EMAIL="${SEED_ADMIN_EMAIL:-admin@inovatitech.com.br}"
PASS="${SEED_ADMIN_PASSWORD:?SEED_ADMIN_PASSWORD is required for login smoke}"

sleep 8
echo "==> Smoke login with demo slug (alias)"
curl -sS -o /tmp/l1.json -w 'HTTP %{http_code}\n' -X POST https://api-crm.inovatitech.com.br/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\",\"tenantSlug\":\"demo\"}"
head -c 180 /tmp/l1.json; echo

echo "==> Smoke login inova"
curl -sS -o /tmp/l2.json -w 'HTTP %{http_code}\n' -X POST https://api-crm.inovatitech.com.br/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\",\"tenantSlug\":\"inova\"}"
head -c 180 /tmp/l2.json; echo

echo DONE
