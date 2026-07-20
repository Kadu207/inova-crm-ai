#!/usr/bin/env bash
# Fast QR regen with curl timeouts (avoids hanging forever).
set -euo pipefail
cd /opt/inova-crm-ai/chatwoot

set -a
source <(grep -E '^(EVOLUTION_API_KEY|CHATWOOT_TOKEN|CHATWOOT_ACCOUNT_ID|CHATWOOT_PUBLIC_URL|CHATWOOT_INBOX_NAME)=' evolution.env | sed 's/\r$//')
set +a

API=http://127.0.0.1:9416
H=(-H "apikey: ${EVOLUTION_API_KEY}" -H "Content-Type: application/json" --max-time 60)

echo "==> ensure API up"
until curl -sf --max-time 3 "$API/" >/dev/null; do sleep 2; done

echo "==> delete"
curl -sS --max-time 30 -X DELETE "$API/instance/delete/crm-whatsapp" "${H[@]}" || true
sleep 2

echo "==> create"
curl -sS --max-time 90 -X POST "$API/instance/create" "${H[@]}" \
  -d '{"instanceName":"crm-whatsapp","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | tee /tmp/evo-create.json >/dev/null

python3 - <<'PY'
import json, base64, re, sys
from pathlib import Path
d = json.load(open("/tmp/evo-create.json"))
b = d.get("base64") or (d.get("qrcode") or {}).get("base64")
if not b:
    print("no QR on create, trying connect…")
    sys.exit(3)
b = re.sub(r"^data:image/[^;]+;base64,", "", b)
Path("/tmp/evolution-qr.png").write_bytes(base64.b64decode(b))
print("QR_OK", Path("/tmp/evolution-qr.png").stat().st_size)
PY

if [[ ! -f /tmp/evolution-qr.png ]]; then
  for i in $(seq 1 20); do
    curl -sS --max-time 30 "$API/instance/connect/crm-whatsapp" -H "apikey: ${EVOLUTION_API_KEY}" \
      | tee /tmp/evo-qr.json >/dev/null
    python3 - <<'PY' && break
import json, base64, re
from pathlib import Path
d = json.load(open("/tmp/evo-qr.json"))
b = d.get("base64") or (d.get("qrcode") or {}).get("base64")
if not b:
    raise SystemExit(1)
b = re.sub(r"^data:image/[^;]+;base64,", "", b)
Path("/tmp/evolution-qr.png").write_bytes(base64.b64decode(b))
print("QR_OK")
PY
    echo "waiting $i"; sleep 2
  done
fi

ls -la /tmp/evolution-qr.png
curl -sS --max-time 30 -X POST "$API/chatwoot/set/crm-whatsapp" "${H[@]}" \
  -d "{\"enabled\":true,\"accountId\":\"${CHATWOOT_ACCOUNT_ID:-1}\",\"token\":\"${CHATWOOT_TOKEN}\",\"url\":\"${CHATWOOT_PUBLIC_URL:-https://chat-crm.inovatitech.com.br}\",\"nameInbox\":\"${CHATWOOT_INBOX_NAME:-CRM WhatsApp Evolution}\",\"signMsg\":false,\"reopenConversation\":true,\"conversationPending\":false,\"mergeBrazilContacts\":true,\"importContacts\":true,\"importMessages\":false,\"autoCreate\":true}" \
  >/dev/null || true
echo DONE
