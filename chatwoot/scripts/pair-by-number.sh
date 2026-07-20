#!/usr/bin/env bash
# Pair WhatsApp via phone number (pairing code) — no QR scan.
# Usage:
#   EVOLUTION_PAIRING_NUMBER=5511999999999 ./scripts/pair-by-number.sh
# or set EVOLUTION_PAIRING_NUMBER in evolution.env
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
source <(grep -E '^(EVOLUTION_API_KEY|EVOLUTION_PAIRING_NUMBER|CHATWOOT_TOKEN|CHATWOOT_ACCOUNT_ID|CHATWOOT_PUBLIC_URL|CHATWOOT_INBOX_NAME)=' evolution.env | sed 's/\r$//' || true)
set +a

NUMBER="${1:-${EVOLUTION_PAIRING_NUMBER:-}}"
NUMBER="$(echo "$NUMBER" | tr -d ' +()-')"
if [[ -z "$NUMBER" || ! "$NUMBER" =~ ^[0-9]{10,15}$ ]]; then
  echo "Usage: EVOLUTION_PAIRING_NUMBER=5511999999999 $0"
  echo "   or: $0 5511999999999"
  exit 1
fi

API="${EVOLUTION_PUBLIC_URL:-http://127.0.0.1:9416}"
H=(-H "apikey: ${EVOLUTION_API_KEY:?Set EVOLUTION_API_KEY}" -H "Content-Type: application/json" --max-time 60)

echo "==> API check"
until curl -sf --max-time 3 "$API/" >/dev/null; do sleep 2; done

echo "==> delete old instance"
curl -sS --max-time 30 -X DELETE "$API/instance/delete/crm-whatsapp" "${H[@]}" || true
sleep 2

echo "==> create instance (Baileys)"
curl -sS --max-time 90 -X POST "$API/instance/create" "${H[@]}" \
  -d "{\"instanceName\":\"crm-whatsapp\",\"integration\":\"WHATSAPP-BAILEYS\",\"qrcode\":true,\"number\":\"${NUMBER}\"}" \
  | tee /tmp/evo-pair-create.json | python3 -m json.tool || true

sleep 2

echo "==> connect with pairing number ${NUMBER}"
PAIR_JSON=$(curl -sS --max-time 60 "$API/instance/connect/crm-whatsapp?number=${NUMBER}" \
  -H "apikey: ${EVOLUTION_API_KEY}" || true)
echo "$PAIR_JSON" | tee /tmp/evo-pair.json | python3 -m json.tool || echo "$PAIR_JSON"

CODE=$(python3 - <<'PY'
import json
from pathlib import Path
raw = Path("/tmp/evo-pair.json").read_text(encoding="utf-8")
try:
    d = json.loads(raw)
except Exception:
    print("")
    raise SystemExit(0)
code = (
    d.get("pairingCode")
    or (d.get("qrcode") or {}).get("pairingCode")
    or d.get("code")
)
# ignore long baileys qr "code" (starts with 2@)
if code and isinstance(code, str) and code.startswith("2@"):
    code = (d.get("qrcode") or {}).get("pairingCode")
print(code or "")
PY
)

if [[ -z "$CODE" ]]; then
  echo
  echo "FAIL: pairingCode não veio. Resposta completa em /tmp/evo-pair.json"
  echo "Tente de novo em 30s ou confira logs: docker logs crm_evolution_api --tail 40"
  exit 1
fi

echo
echo "============================================"
echo "  CÓDIGO DE PAREAMENTO:  $CODE"
echo "============================================"
echo
echo "No celular WhatsApp:"
echo "  1) Aparelhos conectados > Conectar um aparelho"
echo "  2) Conectar com número de telefone"
echo "  3) Digite: $CODE"
echo "  (válido ~1 minuto — se expirar, rode este script de novo)"
echo

# Chatwoot bind
curl -sS --max-time 30 -X POST "$API/chatwoot/set/crm-whatsapp" "${H[@]}" \
  -d "{\"enabled\":true,\"accountId\":\"${CHATWOOT_ACCOUNT_ID:-1}\",\"token\":\"${CHATWOOT_TOKEN:-}\",\"url\":\"${CHATWOOT_PUBLIC_URL:-https://chat-crm.inovatitech.com.br}\",\"nameInbox\":\"${CHATWOOT_INBOX_NAME:-CRM WhatsApp Evolution}\",\"signMsg\":false,\"reopenConversation\":true,\"conversationPending\":false,\"mergeBrazilContacts\":true,\"importContacts\":true,\"importMessages\":false,\"autoCreate\":true}" \
  | python3 -m json.tool || true

echo
echo "Depois de parear, confira:"
echo "  curl -sS $API/instance/connectionState/crm-whatsapp -H \"apikey: \$EVOLUTION_API_KEY\" | python3 -m json.tool"
