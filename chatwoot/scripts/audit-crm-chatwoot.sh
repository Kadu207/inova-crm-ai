#!/usr/bin/env bash
# audit-crm-chatwoot.sh — health + PID usage for Inova CRM AI Chatwoot only.
#
# Usage (VPS):
#   bash chatwoot/scripts/audit-crm-chatwoot.sh
#   bash /opt/inova-crm-ai/chatwoot/scripts/audit-crm-chatwoot.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

RAILS=crm_chatwoot_rails
SIDEKIQ=crm_chatwoot_sidekiq
PORT=9403
EXPECTED_URL='https://chat-crm.inovatitech.com.br'
PID_WARN_PCT=80

cgroup_pids() {
  local name="$1"
  local cid current max
  cid=$(docker inspect -f '{{.Id}}' "$name" 2>/dev/null || true)
  if [[ -z "$cid" ]]; then
    echo "missing"
    return
  fi
  current=$(cat "/sys/fs/cgroup/system.slice/docker-${cid}.scope/pids.current" 2>/dev/null || echo '?')
  max=$(cat "/sys/fs/cgroup/system.slice/docker-${cid}.scope/pids.max" 2>/dev/null || echo '?')
  echo "${current}/${max}"
}

echo "=== CRM Chatwoot audit ==="
echo "root=${ROOT}"

for c in "$RAILS" "$SIDEKIQ" crm_cw_postgres crm_cw_redis; do
  if docker inspect "$c" >/dev/null 2>&1; then
    st=$(docker inspect -f '{{.State.Status}}{{if .State.Health}} health={{.State.Health.Status}}{{end}}' "$c")
    img=$(docker inspect -f '{{.Config.Image}}' "$c")
    echo "OK  ${c}  status=${st}  image=${img}  pids=$(cgroup_pids "$c")"
  else
    echo "MISS ${c}"
  fi
done

echo
echo "=== bind / FRONTEND_URL ==="
ports=$(docker inspect "$RAILS" --format '{{json .NetworkSettings.Ports}}' 2>/dev/null || echo '{}')
echo "ports=${ports}"
fe=$(docker inspect "$RAILS" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | awk -F= '$1=="FRONTEND_URL"{print $2; exit}')
echo "FRONTEND_URL=${fe:-<unset>}"
if [[ -n "${fe:-}" && "$fe" != "$EXPECTED_URL" ]]; then
  echo "WARN FRONTEND_URL expected ${EXPECTED_URL}"
fi

echo
echo "=== localhost smoke :${PORT} ==="
code=$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 5 -L --max-redirs 2 \
  -H "Host: chat-crm.inovatitech.com.br" "http://127.0.0.1:${PORT}/app/login" || echo '000')
echo "login_http=${code}"

echo
echo "=== PID pressure ==="
cid=$(docker inspect -f '{{.Id}}' "$RAILS" 2>/dev/null || true)
if [[ -n "$cid" ]]; then
  cur=$(cat "/sys/fs/cgroup/system.slice/docker-${cid}.scope/pids.current" 2>/dev/null || echo 0)
  max=$(cat "/sys/fs/cgroup/system.slice/docker-${cid}.scope/pids.max" 2>/dev/null || echo max)
  echo "rails_pids=${cur}/${max}"
  if [[ "$max" =~ ^[0-9]+$ && "$cur" =~ ^[0-9]+$ && "$max" -gt 0 ]]; then
    pct=$((cur * 100 / max))
    if [[ "$pct" -ge "$PID_WARN_PCT" ]]; then
      echo "FAIL rails PID usage ${pct}% >= ${PID_WARN_PCT}% — recreate rails before 500/can't fork"
      exit 2
    fi
    echo "OK rails PID usage ${pct}%"
  fi
fi

if [[ "$code" != "200" && "$code" != "302" ]]; then
  echo "FAIL login smoke http=${code}"
  exit 1
fi
echo "AUDIT_CRM_CHATWOOT_OK"
