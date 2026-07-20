#!/usr/bin/env bash
# Smoke: login demo + list leads. Requires DEMO_ADMIN_PASSWORD in env.
set -euo pipefail
PASS="${DEMO_ADMIN_PASSWORD:?set DEMO_ADMIN_PASSWORD}"
RESP=$(curl -sS -X POST http://127.0.0.1:9401/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@demo.inovatitech.com.br\",\"password\":\"${PASS}\",\"tenantSlug\":\"demo\"}")
AT=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["accessToken"])' <<<"$RESP")
TID=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["tenantId"])' <<<"$RESP")
curl -sS "http://127.0.0.1:9401/api/v1/leads" \
  -H "Authorization: Bearer ${AT}" \
  -H "x-tenant-id: ${TID}" | python3 -c '
import json,sys
d=json.load(sys.stdin)
items=d if isinstance(d,list) else d.get("items",[])
print("leads_count=", len(items))
for x in items[:5]:
    print("-", x.get("title","")[:80], "|", x.get("source"), "|", x.get("status"))
'
