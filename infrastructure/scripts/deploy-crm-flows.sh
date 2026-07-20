#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai
tar -xzf /tmp/crm-flows.tgz

echo "=== migrate ==="
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps build api
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps up -d --force-recreate --no-deps api

for i in $(seq 1 30); do
  st=$(docker inspect inova-crm-api --format '{{.State.Health.Status}}' 2>/dev/null || echo starting)
  echo "api $i $st"
  if [ "$st" = "healthy" ]; then break; fi
  sleep 4
done

docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps exec -T api npx prisma migrate deploy

echo "=== frontend ==="
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps build frontend
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps up -d --force-recreate --no-deps frontend

echo "=== reimport n8n workflows ==="
PGUSER=$(grep ^POSTGRES_USER= infrastructure/.env | cut -d= -f2- | tr -d '\r')
python3 - <<'PY'
import json
from pathlib import Path
out = Path('/tmp/n8n-import')
out.mkdir(exist_ok=True)
for name in ['lead-inbound.json', 'sync-conversation.json']:
    data = json.loads(Path(f'n8n/workflows/{name}').read_text())
    # keep existing IDs if present by matching name later — import as inactive list
    if isinstance(data, list):
        payload = data
    else:
        data['active'] = False
        payload = [data]
    (out / name).write_text(json.dumps(payload))
    print('ready', name)
PY

# Update nodes in DB for known workflow names
for name in lead-inbound sync-conversation; do
  case $name in
    lead-inbound) WFNAME='CRM — Lead Inbound (Chatwoot)'; SRC=n8n/workflows/lead-inbound.json ;;
    sync-conversation) WFNAME='CRM — Sync Conversation (Chatwoot)'; SRC=n8n/workflows/sync-conversation.json ;;
  esac
  python3 - <<PY
import json
from pathlib import Path
wf=json.loads(Path('$SRC').read_text())
Path('/tmp/wf_nodes.json').write_text(json.dumps(wf['nodes']))
Path('/tmp/wf_connections.json').write_text(json.dumps(wf['connections']))
print('nodes', '$WFNAME', len(wf['nodes']))
PY
  docker cp /tmp/wf_nodes.json inova-crm-postgres:/tmp/wf_nodes.json
  docker cp /tmp/wf_connections.json inova-crm-postgres:/tmp/wf_connections.json
  docker exec inova-crm-postgres psql -U "$PGUSER" -d n8n_crm -v ON_ERROR_STOP=1 -c \
    "UPDATE workflow_entity SET nodes = pg_read_file('/tmp/wf_nodes.json')::json, connections = pg_read_file('/tmp/wf_connections.json')::json, \"updatedAt\" = NOW() WHERE name = '$WFNAME';"
done

docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  up -d --force-recreate --no-deps n8n
sleep 8
curl -sf http://127.0.0.1:9404/healthz >/dev/null && echo n8n_ok

PASS='E6qfmZ2ZPA7PhzwwuJi7xW58JcWcAa1!'
LOGIN=$(curl -sS -X POST http://127.0.0.1:9401/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@demo.inovatitech.com.br\",\"password\":\"${PASS}\",\"tenantSlug\":\"demo\"}")
AT=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["accessToken"])' <<<"$LOGIN")
TID=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["tenantId"])' <<<"$LOGIN")

# smoke inbound + convert
INB=$(curl -sS -X POST http://127.0.0.1:9404/webhook/lead-inbound \
  -H 'Content-Type: application/json' \
  -d '{"event":"message_created","account":{"id":1},"conversation":{"id":9001},"sender":{"name":"Fluxo Teste","phone_number":"+5511988776655"},"content":"quero orcamento CRM"}')
echo "inbound_n8n=$INB"

LEADS=$(curl -sS http://127.0.0.1:9401/api/v1/leads -H "Authorization: Bearer $AT" -H "x-tenant-id: $TID")
LEAD_ID=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(next(x["id"] for x in d if "Fluxo Teste" in x.get("title","")))' <<<"$LEADS")
echo "lead_id=$LEAD_ID"
curl -sS -X POST "http://127.0.0.1:9401/api/v1/leads/${LEAD_ID}/qualify" \
  -H "Authorization: Bearer $AT" -H "x-tenant-id: $TID" -H 'Content-Type: application/json' -d '{"score":85}' | python3 -c 'import json,sys; print("qualify", json.load(sys.stdin)["status"])'
CONV=$(curl -sS -X POST "http://127.0.0.1:9401/api/v1/leads/${LEAD_ID}/convert" \
  -H "Authorization: Bearer $AT" -H "x-tenant-id: $TID" -H 'Content-Type: application/json' -d '{}')
echo "$CONV" | python3 -c 'import json,sys; d=json.load(sys.stdin); print("convert", d["lead"]["status"], d["opportunity"]["id"][:8])'

echo FLOWS_DEPLOY_OK
