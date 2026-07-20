#!/usr/bin/env bash
# One-shot: upgrade Evolution, recreate instance, save QR PNG.
set -euo pipefail
cd "$(dirname "$0")/.."

# Fix phone version (empty = dynamic)
if grep -q '^EVOLUTION_PHONE_VERSION=' evolution.env 2>/dev/null; then
  sed -i 's/^EVOLUTION_PHONE_VERSION=.*/EVOLUTION_PHONE_VERSION=/' evolution.env
else
  echo 'EVOLUTION_PHONE_VERSION=' >> evolution.env
fi
grep -q '^EVOLUTION_SERVER_URL=' evolution.env \
  || echo 'EVOLUTION_SERVER_URL=http://crm_evolution_api:8080' >> evolution.env
grep -q '^EVOLUTION_PUBLIC_URL=' evolution.env \
  || echo 'EVOLUTION_PUBLIC_URL=http://127.0.0.1:9416' >> evolution.env

echo "==> Recreate Evolution API (v2.3.7 + dynamic WA version)"
docker compose -f docker-compose.yml -f docker-compose.vps.yml \
  -f docker-compose.evolution.yml --profile whatsapp-evolution \
  --env-file .env --env-file evolution.env pull evolution-api
docker compose -f docker-compose.yml -f docker-compose.vps.yml \
  -f docker-compose.evolution.yml --profile whatsapp-evolution \
  --env-file .env --env-file evolution.env up -d --force-recreate evolution-api

echo "==> Wait API"
until curl -sf http://127.0.0.1:9416/ >/dev/null; do sleep 2; done
sleep 5

set -a
# shellcheck disable=SC1091
source <(grep -E '^(EVOLUTION_API_KEY|CHATWOOT_TOKEN|CHATWOOT_ACCOUNT_ID|CHATWOOT_PUBLIC_URL|CHATWOOT_INBOX_NAME)=' evolution.env | sed 's/\r$//')
set +a
API=http://127.0.0.1:9416
H=(-H "apikey: ${EVOLUTION_API_KEY}" -H "Content-Type: application/json")

echo "==> Delete old instance (ignore 404)"
curl -sS -X DELETE "$API/instance/delete/crm-whatsapp" "${H[@]}" || true
sleep 2

echo "==> Create instance"
curl -sS -X POST "$API/instance/create" "${H[@]}" \
  -d '{"instanceName":"crm-whatsapp","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | tee /tmp/evo-create.json | python3 -m json.tool

rm -f /tmp/evolution-qr.png
python3 - <<'PY'
import json, base64, re
from pathlib import Path
d = json.load(open("/tmp/evo-create.json"))
b = d.get("base64") or (d.get("qrcode") or {}).get("base64")
if b:
    b = re.sub(r"^data:image/[^;]+;base64,", "", b)
    Path("/tmp/evolution-qr.png").write_bytes(base64.b64decode(b))
    print("QR from create -> /tmp/evolution-qr.png")
PY

if [[ ! -f /tmp/evolution-qr.png ]]; then
  echo "==> Connect until QR"
  for i in $(seq 1 40); do
    curl -sS "$API/instance/connect/crm-whatsapp" "${H[@]}" | tee /tmp/evo-qr.json >/dev/null
    if python3 - <<'PY'
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
    then
      break
    fi
    echo "waiting QR $i"
    sleep 2
  done
fi

if [[ ! -f /tmp/evolution-qr.png ]]; then
  echo "FAIL: still no QR. Logs:"
  docker logs crm_evolution_api --tail 40
  exit 1
fi

ls -la /tmp/evolution-qr.png
echo
echo "Baixe no PC:"
echo "  scp -i \$env:USERPROFILE\\.ssh\\id_ed25519_inova -o IdentitiesOnly=yes gestaoti@128.140.77.31:/tmp/evolution-qr.png ."
echo "Abra o PNG e escaneie: WhatsApp > Aparelhos conectados > Conectar um aparelho"
echo
echo "Opcional Manager (túnel no PC):"
echo "  ssh -i ... -L 9416:127.0.0.1:9416 gestaoti@128.140.77.31"
echo "  depois abra http://127.0.0.1:9416/manager"

curl -sS -X POST "$API/chatwoot/set/crm-whatsapp" "${H[@]}" \
  -d "{\"enabled\":true,\"accountId\":\"${CHATWOOT_ACCOUNT_ID:-1}\",\"token\":\"${CHATWOOT_TOKEN}\",\"url\":\"${CHATWOOT_PUBLIC_URL:-https://chat-crm.inovatitech.com.br}\",\"nameInbox\":\"${CHATWOOT_INBOX_NAME:-CRM WhatsApp Evolution}\",\"signMsg\":false,\"reopenConversation\":true,\"conversationPending\":false,\"mergeBrazilContacts\":true,\"importContacts\":true,\"importMessages\":false,\"autoCreate\":true}" \
  | python3 -m json.tool || true
