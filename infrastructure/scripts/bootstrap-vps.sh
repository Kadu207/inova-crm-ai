#!/usr/bin/env bash
# Bootstrap Inova CRM AI on Hetzner VPS — run ON the server after code is synced.
# Usage (as gestaoti with sudo):
#   cd /opt/inova-crm-ai && bash infrastructure/scripts/bootstrap-vps.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Root: $ROOT"

if [[ ! -f infrastructure/.env ]]; then
  echo "==> Creating infrastructure/.env from example (EDIT SECRETS before production use)"
  cp infrastructure/.env.example infrastructure/.env
  chmod 600 infrastructure/.env
  # Generate random secrets if still placeholders
  if command -v openssl >/dev/null 2>&1; then
    # hex only — avoids +/@ breaking DATABASE_URL / AMQP URLs
    gen() { openssl rand -hex 24; }
    sed -i "s|change_me_postgres_password|$(gen)|" infrastructure/.env
    sed -i "s|change_me_redis_password|$(gen)|" infrastructure/.env
    sed -i "s|change_me_rabbitmq_password|$(gen)|" infrastructure/.env
    sed -i "s|change_me_minio_password|$(gen)|" infrastructure/.env
    sed -i "s|change_me_jwt_secret_min_32_chars|$(gen)|" infrastructure/.env
    sed -i "s|change_me_api_token_for_n8n_and_workers|$(gen)|" infrastructure/.env
    sed -i "s|change_me_webhook_secret|$(gen)|" infrastructure/.env
    sed -i "s|change_me_n8n_encryption_key_32c|$(gen)|" infrastructure/.env
    sed -i "s|change_me_ai_api_token|$(gen)|" infrastructure/.env
    echo "    Secrets auto-generated in infrastructure/.env"
  fi
fi

# Fix CRLF from Windows tar/scp
if command -v sed >/dev/null 2>&1; then
  sed -i 's/\r$//' infrastructure/scripts/*.sh 2>/dev/null || true
  sed -i 's/\r$//' infrastructure/init/*.sh 2>/dev/null || true
fi

# shellcheck disable=SC1091
set -a
# shellcheck source=/dev/null
source infrastructure/.env
set +a

echo "==> Port audit 9400-9419"
bash infrastructure/scripts/check-ports.sh || {
  echo "WARN: some ports in use — ensure they belong to inova-crm or free them"
}

COMPOSE=(docker compose --env-file infrastructure/.env
  -f infrastructure/docker-compose.yml
  -f infrastructure/docker-compose.vps.yml)

echo "==> Compose up (infra first)"
"${COMPOSE[@]}" up -d postgres redis rabbitmq minio

echo "==> Wait for Postgres"
for i in $(seq 1 30); do
  if docker exec inova-crm-postgres pg_isready -U "${POSTGRES_USER:-inova}" >/dev/null 2>&1; then
    echo "    Postgres ready"
    break
  fi
  sleep 2
  if [[ $i -eq 30 ]]; then
    echo "ERROR: Postgres did not become ready"
    exit 1
  fi
done

echo "==> Ensure databases (crm / n8n_crm / chatwoot_crm)"
ensure_db() {
  local db="$1"
  local exists
  exists="$(docker exec inova-crm-postgres psql -U "${POSTGRES_USER:-inova}" -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname='${db}'" 2>/dev/null || true)"
  # If POSTGRES_DB=crm, default DB may be crm — also try connecting via POSTGRES_DB
  if [[ "$exists" != "1" ]]; then
    exists="$(docker exec inova-crm-postgres psql -U "${POSTGRES_USER:-inova}" -d "${POSTGRES_DB:-crm}" -tAc \
      "SELECT 1 FROM pg_database WHERE datname='${db}'" 2>/dev/null || true)"
  fi
  if [[ "$exists" != "1" ]]; then
    docker exec inova-crm-postgres psql -U "${POSTGRES_USER:-inova}" -d "${POSTGRES_DB:-postgres}" \
      -c "CREATE DATABASE \"${db}\"" 2>/dev/null \
      || docker exec inova-crm-postgres psql -U "${POSTGRES_USER:-inova}" -d postgres \
        -c "CREATE DATABASE \"${db}\""
    echo "    created ${db}"
  else
    echo "    ok ${db}"
  fi
}
ensure_db crm
ensure_db "${N8N_DB:-n8n_crm}"
ensure_db chatwoot_crm

echo "==> Compose up (apps)"
"${COMPOSE[@]}" --profile apps up -d --build

echo "==> Wait for API healthy"
for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:9401/health >/dev/null 2>&1; then
    echo "    API healthy"
    break
  fi
  sleep 3
  if [[ $i -eq 60 ]]; then
    echo "ERROR: API did not become healthy"
    docker logs inova-crm-api --tail 80 || true
    exit 1
  fi
done

echo "==> Prisma migrate"
docker compose \
  --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  --profile apps \
  exec -T api npx prisma migrate deploy

echo "==> Seed demo tenant (idempotent)"
docker compose \
  --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  --profile apps \
  exec -T api npx tsx prisma/seed.ts || \
docker compose \
  --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  --profile apps \
  exec -T api node -e "console.log('seed via tsx skipped — run manually if needed')"

echo "==> Local smoke"
curl -sf http://127.0.0.1:9401/health && echo " API OK"
curl -sf http://127.0.0.1:9400/login >/dev/null && echo " Frontend OK"
curl -sf http://127.0.0.1:9402/health && echo " AI OK" || echo " AI not ready yet"

cat <<'EOF'

==> Bootstrap complete (local binds).

Next — Cloudflare Tunnel Public Hostnames (Zero Trust → Tunnels):
  crm.inovatitech.com.br      → http://127.0.0.1:9400
  api-crm.inovatitech.com.br  → http://127.0.0.1:9401
  ai-crm.inovatitech.com.br   → http://127.0.0.1:9402
  chat-crm.inovatitech.com.br → http://127.0.0.1:9403  (Chatwoot, depois)
  n8n-crm.inovatitech.com.br  → http://127.0.0.1:9404
  s3-crm.inovatitech.com.br   → http://127.0.0.1:9405
  storage-crm.inovatitech.com.br → http://127.0.0.1:9406

Or merge infrastructure/cloudflare-tunnel-ingress.example.yml into cloudflared config.

Login after DNS/Tunnel:
  https://crm.inovatitech.com.br/login
  tenant: demo
  email:  admin@demo.inovatitech.com.br
  pass:   InovaDemo@2026   (change after first login)

EOF
