#!/usr/bin/env bash
# Create Evolution instance, print QR connect payload, wire Chatwoot integration.
# Prerequisites: profile whatsapp-evolution up; evolution.env filled.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${EVOLUTION_ENV_FILE:-$ROOT/evolution.env}"

load_env() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      local key="${BASH_REMATCH[1]}"
      local val="${BASH_REMATCH[2]}"
      if [[ "$val" =~ ^\".*\"$ ]]; then
        val="${val:1:${#val}-2}"
      elif [[ "$val" =~ ^\'.*\'$ ]]; then
        val="${val:1:${#val}-2}"
      fi
      export "$key=$val"
    fi
  done < "$file"
}

load_env "$ENV_FILE"

API_KEY="${EVOLUTION_API_KEY:?Set EVOLUTION_API_KEY}"
# Always curl via host publish for setup on VPS
BASE_URL="${EVOLUTION_PUBLIC_URL:-http://127.0.0.1:9416}"
INSTANCE="${EVOLUTION_INSTANCE_NAME:-crm-whatsapp}"
CW_URL="${CHATWOOT_PUBLIC_URL:-${CHATWOOT_URL:-https://chat-crm.inovatitech.com.br}}"
CW_ACCOUNT="${CHATWOOT_ACCOUNT_ID:-1}"
CW_TOKEN="${CHATWOOT_TOKEN:?Set CHATWOOT_TOKEN (Chatwoot user access token)}"
CW_INBOX="${CHATWOOT_INBOX_NAME:-CRM WhatsApp Evolution}"

echo "==> Waiting for Evolution API at ${BASE_URL}"
ready=0
for i in $(seq 1 60); do
  if curl -sf -m 3 "${BASE_URL}/" >/dev/null 2>&1; then
    ready=1
    echo "API ready (attempt ${i})"
    break
  fi
  sleep 2
done
if [[ "$ready" -ne 1 ]]; then
  echo "ERROR: Evolution API not responding on ${BASE_URL}"
  echo "Check: docker logs crm_evolution_api --tail 100"
  exit 1
fi

hdr=(-H "apikey: ${API_KEY}" -H "Content-Type: application/json")

echo "==> Create instance ${INSTANCE} (ignore error if already exists)"
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
echo "==> Connect / QR (retries until base64 appears)"
QR_JSON="{}"
for i in $(seq 1 20); do
  QR_JSON=$(curl -sS "${BASE_URL}/instance/connect/${INSTANCE}" "${hdr[@]}" || echo '{}')
  if echo "$QR_JSON" | python3 -c 'import json,sys
d=json.load(sys.stdin)
b=d.get("base64") or (d.get("qrcode") or {}).get("base64") or d.get("code")
sys.exit(0 if b else 1)' 2>/dev/null; then
    echo "QR ready (attempt ${i})"
    break
  fi
  echo "waiting QR… (${i}/20)"
  sleep 2
done
echo "$QR_JSON" | python3 -m json.tool || echo "$QR_JSON"

echo "$QR_JSON" | python3 - <<'PY'
import json, sys, base64, re
from pathlib import Path
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
b64 = d.get("base64") or (d.get("qrcode") or {}).get("base64")
if not b64:
    print("No QR base64 yet — retry: curl -sS http://127.0.0.1:9416/instance/connect/crm-whatsapp -H \"apikey: \$EVOLUTION_API_KEY\"")
    sys.exit(0)
b64 = re.sub(r"^data:image/[^;]+;base64,", "", b64)
out = Path("/tmp/evolution-qr.png")
out.write_bytes(base64.b64decode(b64))
print(f"QR saved to {out}")
print("Copy to PC: scp gestaoti@128.140.77.31:/tmp/evolution-qr.png .")
PY

echo
echo "==> Configure Chatwoot integration on instance"
CW_SET=$(curl -sS -X POST "${BASE_URL}/chatwoot/set/${INSTANCE}" "${hdr[@]}" \
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
)" || true)
echo "$CW_SET" | python3 -m json.tool || echo "$CW_SET"
if echo "$CW_SET" | grep -q '127.0.0.1:9416'; then
  echo "WARN: webhook_url uses 127.0.0.1 — Chatwoot cannot reach it."
  echo "Fix: set EVOLUTION_SERVER_URL=http://crm_evolution_api:8080 in evolution.env,"
  echo "     then: docker compose ... up -d --force-recreate evolution-api"
  echo "     and re-run this script (or chatwoot/set only)."
fi

echo
echo "DONE. Scan QR (WhatsApp > Dispositivos vinculados)."
echo "Cutover Meta: docs/chatwoot-whatsapp-setup.md"
