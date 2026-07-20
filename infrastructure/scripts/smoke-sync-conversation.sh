#!/usr/bin/env bash
# Smoke: Chatwoot-shaped payload → n8n sync-conversation → CRM conversations
set -euo pipefail
CONV_ID="${1:-$((1000 + RANDOM % 9000))}"
PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "event": "conversation_status_changed",
  "account": {"id": 1},
  "conversation": {
    "id": ${CONV_ID},
    "status": "open",
    "meta": {"assignee": {"id": 3}}
  }
}))
PY
)
echo "POST sync-conversation conversationId=${CONV_ID}"
RESP=$(curl -sS -X POST "https://n8n-crm.inovatitech.com.br/webhook/sync-conversation" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")
echo "n8n=$RESP"

PASS="${DEMO_ADMIN_PASSWORD:?set DEMO_ADMIN_PASSWORD}"
LOGIN=$(curl -sS -X POST http://127.0.0.1:9401/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@demo.inovatitech.com.br\",\"password\":\"${PASS}\",\"tenantSlug\":\"demo\"}")
AT=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["accessToken"])' <<<"$LOGIN")
TID=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["tenantId"])' <<<"$LOGIN")
curl -sS "http://127.0.0.1:9401/api/v1/conversations" \
  -H "Authorization: Bearer ${AT}" \
  -H "x-tenant-id: ${TID}" | python3 -c "
import json,sys
items=json.load(sys.stdin)
if isinstance(items, dict): items=items.get('items',[])
print('conversations_count=', len(items))
match=[c for c in items if c.get('chatwootId')==${CONV_ID}]
print('matched=', match[:1] or 'NONE')
"
