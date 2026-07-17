#!/usr/bin/env bash
# deploy-vps.sh — Deploy stub for Hetzner VPS /opt/inova-crm-ai
# Usage: ./infrastructure/scripts/deploy-vps.sh [VPS_HOST] [VPS_USER]
set -euo pipefail

VPS_HOST="${1:-your-vps.example.com}"
VPS_USER="${2:-deploy}"
REMOTE_DIR="/opt/inova-crm-ai"
LOCAL_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "==> Inova CRM AI — deploy to ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}"

echo "==> [1/6] Local port check (optional on CI)"
if [ -f "${LOCAL_DIR}/infrastructure/scripts/check-ports.sh" ]; then
  bash "${LOCAL_DIR}/infrastructure/scripts/check-ports.sh" || true
fi

echo "==> [2/6] Rsync code (excludes node_modules, .next, .git)"
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude dist \
  --exclude .git \
  --exclude infrastructure/.env \
  "${LOCAL_DIR}/" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"

echo "==> [3/6] Remote port check"
ssh "${VPS_USER}@${VPS_HOST}" "cd ${REMOTE_DIR} && bash infrastructure/scripts/check-ports.sh"

echo "==> [4/6] Remote backup (pre-deploy)"
ssh "${VPS_USER}@${VPS_HOST}" "cd ${REMOTE_DIR} && bash infrastructure/scripts/backup.sh || true"

echo "==> [5/6] Docker compose up"
ssh "${VPS_USER}@${VPS_HOST}" "cd ${REMOTE_DIR} && \
  docker compose \
    -f infrastructure/docker-compose.yml \
    -f infrastructure/docker-compose.vps.yml \
    --env-file infrastructure/.env \
    up -d --build"

echo "==> [6/6] Migrations + smoke hints"
ssh "${VPS_USER}@${VPS_HOST}" "cd ${REMOTE_DIR} && \
  docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml \
    exec -T api npx prisma migrate deploy 2>/dev/null || echo 'Prisma migrate skipped (API not ready)'"

echo "==> Deploy complete. Run smoke checklist:"
echo "    curl -sf https://api-crm.inovatitech.com.br/health"
echo "    curl -sf https://ai-crm.inovatitech.com.br/health"
echo "    open https://crm.inovatitech.com.br/login"
echo "    See docs/manual-implantacao-producao.md"
