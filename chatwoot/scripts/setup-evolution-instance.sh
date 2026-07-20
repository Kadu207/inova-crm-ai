#!/usr/bin/env bash
# Create Evolution instance, print QR connect payload, wire Chatwoot integration.
# Prerequisites: profile whatsapp-evolution up; evolution.env filled.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${EVOLUTION_ENV_FILE:-$ROOT/evolution.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

API_KEY="${EVOLUTION_API_KEY:?Set EVOLUTION_API_KEY}"
BASE_URL="${EVOLUTION_PUBLIC_URL:-${EVOLUTION_SERVER_URL:-http://127.0.0.1:9416}}"
INSTANCE="${EVOLUTION_INSTANCE_NAME:-crm-whatsapp}"
CW_URL="${CHATWOOT_PUBLIC_URL:-${CHATWOOT_URL:-https://chat-crm.inovatitech.com.br}}"
CW_ACCOUNT="${CHATWOOT_ACCOUNT_ID:-1}"
CW_TOKEN="${CHATWOOT_TOKEN:?Set CHATWOOT_TOKEN (Chatwoot user access token)}"
CW_INBOX="${CHATWOOT_INBOX_NAME:-CRM WhatsApp Evolution}"

hdr=(-H "apikey: ${API_KEY}" -H "Content-Type: application/json")

echo "==> Create instance ${INSTANCE}"
curl -sS -X POST "${BASE_URL}/instance/create" "${hdr[@]}" \
  -d "$(python3 - <<PY
import json
print(json.dumps({
  "instanceName": "${INSTANCE}",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": True,
}))
PY
)" | python3 -m json.tool || true

echo
echo "==> Connect / QR (base64 in response — scan WhatsApp > Dispositivos vinculados)"
curl -sS "${BASE_URL}/instance/connect/${INSTANCE}" "${hdr[@]}" | python3 -m json.tool || true

echo
echo "==> Configure Chatwoot integration on instance"
# Use public Chatwoot URL so Evolution callbacks work via tunnel/host
curl -sS -X POST "${BASE_URL}/chatwoot/set/${INSTANCE}" "${hdr[@]}" \
  -d "$(python3 - <<PY
import json
print(json.dumps({
  "enabled": True,
  "accountId": str(${CW_ACCOUNT}),
  "token": "${CW_TOKEN}",
  "url": "${CW_URL}",
  "nameInbox": "${CW_INBOX}",
  "signMsg": False,
  "reopenConversation": True,
  "conversationPending": False,
  "mergeBrazilContacts": True,
  "importContacts": True,
  "importMessages": False,
  "autoCreate": True,
}))
PY
)" | python3 -m json.tool || true

echo
echo "DONE. Next: scan QR, then send a WhatsApp message and confirm Chatwoot inbox + CRM lead."
echo "Cutover Meta: docs/chatwoot-whatsapp-setup.md"
