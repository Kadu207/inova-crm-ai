#!/usr/bin/env bash
set -euo pipefail
cd /opt/inova-crm-ai

# Apply pending schema as table owner (inova), not crm_app
PGUSER=$(grep ^POSTGRES_USER= infrastructure/.env | cut -d= -f2- | tr -d '\r')
PGPASS=$(grep ^POSTGRES_PASSWORD= infrastructure/.env | cut -d= -f2- | tr -d '\r')

# Recover failed prisma migration state if present
docker exec -e PGPASSWORD="$PGPASS" inova-crm-postgres \
  psql -U "$PGUSER" -d crm -v ON_ERROR_STOP=1 -c \
  "DELETE FROM _prisma_migrations WHERE migration_name = '20260720060000_lead_conversion_links' AND finished_at IS NULL;"

docker exec -e PGPASSWORD="$PGPASS" -i inova-crm-postgres \
  psql -U "$PGUSER" -d crm -v ON_ERROR_STOP=1 < backend/prisma/migrations/20260720060000_lead_conversion_links/migration.sql

# Record migration as applied
docker exec -e PGPASSWORD="$PGPASS" inova-crm-postgres \
  psql -U "$PGUSER" -d crm -v ON_ERROR_STOP=1 -c \
  "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
   SELECT gen_random_uuid()::text, '', NOW(), '20260720060000_lead_conversion_links', NULL, NULL, NOW(), 1
   WHERE NOT EXISTS (SELECT 1 FROM _prisma_migrations WHERE migration_name = '20260720060000_lead_conversion_links' AND finished_at IS NOT NULL);"

echo "=== migration applied ==="

docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps build frontend
docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  --profile apps up -d --force-recreate --no-deps frontend

# Update n8n workflow nodes in DB
for pair in "CRM — Lead Inbound (Chatwoot)|n8n/workflows/lead-inbound.json" "CRM — Sync Conversation (Chatwoot)|n8n/workflows/sync-conversation.json"; do
  WFNAME="${pair%%|*}"
  SRC="${pair##*|}"
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
  docker exec -e PGPASSWORD="$PGPASS" inova-crm-postgres \
    psql -U "$PGUSER" -d n8n_crm -v ON_ERROR_STOP=1 -c \
    "UPDATE workflow_entity SET nodes = pg_read_file('/tmp/wf_nodes.json')::json, connections = pg_read_file('/tmp/wf_connections.json')::json, \"updatedAt\" = NOW() WHERE name = '$WFNAME';"
done

docker compose --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
  up -d --force-recreate --no-deps n8n
sleep 10
curl -sf http://127.0.0.1:9404/healthz >/dev/null && echo n8n_ok

# credentials from operator file
PASS=$(grep -E 'CRM demo|admin@demo|password' .credentials-operator.txt 2>/dev/null | head -5 || true)
DEMO_PASS=$(python3 - <<'PY'
from pathlib import Path
p=Path('.credentials-operator.txt')
text=p.read_text(encoding='utf-8', errors='ignore') if p.exists() else ''
# try common patterns
import re
m=re.search(r'admin@demo\.inovatitech\.com\.br\s*[|:]\s*(\S+)', text)
if not m:
  m=re.search(r'(?:CRM|demo).*password[:\s]+(\S+)', text, re.I)
if not m:
  m=re.search(r'DEMO_PASSWORD[=:\s]+(\S+)', text)
print(m.group(1) if m else '')
PY
)
if [ -z "$DEMO_PASS" ]; then
  DEMO_PASS='E6qfmZ2ZPA7PhzwwuJi7xW58JcWcAa1!'
fi

LOGIN=$(curl -sS -X POST http://127.0.0.1:9401/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@demo.inovatitech.com.br\",\"password\":\"${DEMO_PASS}\",\"tenantSlug\":\"demo\"}")
echo "login_keys=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(list(d.keys()))' <<<"$LOGIN")"
AT=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("accessToken",""))' <<<"$LOGIN")
TID=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tenantId",""))' <<<"$LOGIN")
if [ -z "$AT" ]; then echo "LOGIN_FAIL $LOGIN"; exit 1; fi

INB=$(curl -sS -X POST http://127.0.0.1:9404/webhook/lead-inbound \
  -H 'Content-Type: application/json' \
  -d '{"event":"message_created","account":{"id":1},"conversation":{"id":9001},"sender":{"name":"Fluxo Teste","phone_number":"+5511988776655","email":"fluxo@teste.com"},"content":"quero orcamento CRM"}')
echo "inbound_n8n=$INB"

LEADS=$(curl -sS http://127.0.0.1:9401/api/v1/leads -H "Authorization: Bearer $AT" -H "x-tenant-id: $TID")
LEAD_ID=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(next((x["id"] for x in d if "Fluxo Teste" in (x.get("title") or "") or (x.get("source")=="chatwoot" and x.get("status")=="NEW")), ""))' <<<"$LEADS")
if [ -z "$LEAD_ID" ]; then
  LEAD_ID=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[0]["id"] if d else "")' <<<"$LEADS")
fi
echo "lead_id=$LEAD_ID"
curl -sS -X POST "http://127.0.0.1:9401/api/v1/leads/${LEAD_ID}/qualify" \
  -H "Authorization: Bearer $AT" -H "x-tenant-id: $TID" -H 'Content-Type: application/json' -d '{"score":85}' | python3 -c 'import json,sys; print("qualify", json.load(sys.stdin).get("status"))'
CONV=$(curl -sS -X POST "http://127.0.0.1:9401/api/v1/leads/${LEAD_ID}/convert" \
  -H "Authorization: Bearer $AT" -H "x-tenant-id: $TID" -H 'Content-Type: application/json' -d '{}')
echo "$CONV" | python3 -c 'import json,sys; d=json.load(sys.stdin); print("convert", d["lead"]["status"], d["opportunity"]["id"][:8])'

OPP_ID=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["opportunity"]["id"])' <<<"$CONV")
PIPE=$(curl -sS http://127.0.0.1:9401/api/v1/pipelines/default -H "Authorization: Bearer $AT" -H "x-tenant-id: $TID")
STAGE2=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(sorted(d["stages"], key=lambda s:s["order"])[1]["id"])' <<<"$PIPE")
curl -sS -X POST "http://127.0.0.1:9401/api/v1/opportunities/${OPP_ID}/move" \
  -H "Authorization: Bearer $AT" -H "x-tenant-id: $TID" -H 'Content-Type: application/json' -d "{\"stageId\":\"$STAGE2\"}" | python3 -c 'import json,sys; print("move", json.load(sys.stdin)["stageId"][:8])'
curl -sS -X POST "http://127.0.0.1:9401/api/v1/opportunities/${OPP_ID}/won" \
  -H "Authorization: Bearer $AT" -H "x-tenant-id: $TID" | python3 -c 'import json,sys; print("won", json.load(sys.stdin)["status"])'

echo FLOWS_DEPLOY_OK
