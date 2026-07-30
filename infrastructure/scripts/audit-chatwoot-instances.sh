#!/usr/bin/env bash
# audit-chatwoot-instances.sh — inventário VPS de todas as instâncias Chatwoot.
#
# Usage:
#   bash infrastructure/scripts/audit-chatwoot-instances.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PID_WARN_PCT=80

cgroup_pids() {
  local name="$1"
  local cid current max
  cid=$(docker inspect -f '{{.Id}}' "$name" 2>/dev/null || true)
  if [[ -z "$cid" ]]; then
    echo "?"
    return
  fi
  current=$(cat "/sys/fs/cgroup/system.slice/docker-${cid}.scope/pids.current" 2>/dev/null || echo '?')
  max=$(cat "/sys/fs/cgroup/system.slice/docker-${cid}.scope/pids.max" 2>/dev/null || echo '?')
  echo "${current}/${max}"
}

echo "=== Chatwoot containers (compose / standalone) ==="
printf '%-42s %-28s %-36s %-12s %s\n' NAME STATUS IMAGE PORTS PIDS
while IFS=$'\t' read -r name status image ports; do
  [[ -z "$name" ]] && continue
  printf '%-42s %-28s %-36s %-12s %s\n' "$name" "$status" "$image" "$ports" "$(cgroup_pids "$name")"
done < <(
  docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}' \
    | awk 'BEGIN{IGNORECASE=1} /chatwoot|cw_/ && $0 !~ /evolution/ {print}'
)

echo
echo "=== Swarm services (if any) ==="
if docker info 2>/dev/null | grep -q 'Swarm: active'; then
  docker service ls 2>/dev/null | awk 'BEGIN{IGNORECASE=1} NR==1 || /chatwoot/' || true
else
  echo '(swarm inactive)'
fi

echo
echo "=== FRONTEND_URL / bind deviations ==="
deviations=0
while IFS= read -r name; do
  [[ -z "$name" ]] && continue
  # Skip exited swarm task replicas noise if inspect fails
  if ! docker inspect "$name" >/dev/null 2>&1; then
    continue
  fi
  fe=$(docker inspect "$name" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
    | awk -F= '$1=="FRONTEND_URL"{print $2; exit}')
  ports=$(docker inspect "$name" --format '{{json .HostConfig.PortBindings}}' 2>/dev/null || echo '{}')
  project=$(docker inspect "$name" --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null || true)
  echo "-- ${name} project=${project:-swarm/other}"
  echo "   FRONTEND_URL=${fe:-<unset>}"
  echo "   PortBindings=${ports}"

  if echo "$ports" | grep -q '0.0.0.0'; then
    echo "   DEVIATION: public bind 0.0.0.0 (use 127.0.0.1 + Cloudflare Tunnel)"
    deviations=$((deviations + 1))
  fi

  cid=$(docker inspect -f '{{.Id}}' "$name" 2>/dev/null || true)
  if [[ -n "$cid" ]]; then
    cur=$(cat "/sys/fs/cgroup/system.slice/docker-${cid}.scope/pids.current" 2>/dev/null || echo 0)
    max=$(cat "/sys/fs/cgroup/system.slice/docker-${cid}.scope/pids.max" 2>/dev/null || echo max)
    if [[ "$max" =~ ^[0-9]+$ && "$cur" =~ ^[0-9]+$ && "$max" -gt 0 ]]; then
      pct=$((cur * 100 / max))
      if [[ "$pct" -ge "$PID_WARN_PCT" ]]; then
        echo "   DEVIATION: PID usage ${pct}% (${cur}/${max})"
        deviations=$((deviations + 1))
      fi
    fi
  fi

  # Naming: CRM should be crm_* ; generic "chatwoot" without product prefix is a smell for non-swarm
  if [[ "$name" =~ ^(infra-chatwoot|chatwoot-) ]] || [[ "$name" == "chatwoot" ]]; then
    echo "   NOTE: naming fora do padrão {produto}_chatwoot_* (legado OK se documentado)"
  fi
done < <(docker ps --format '{{.Names}}' | awk 'BEGIN{IGNORECASE=1} /chatwoot/ && $0 !~ /evolution/')

echo
echo "=== Expected inventory (governance) ==="
cat <<'EOF'
| Projeto        | Domínio                              | Bind esperado     | Path / stack                          |
| Inova CRM AI   | chat-crm.inovatitech.com.br          | 127.0.0.1:9403    | /opt/inova-crm-ai/chatwoot            |
| Casa da Paz    | casadapaz-chat.inovatitech.com.br    | 127.0.0.1:<port>  | /home/gestaoti/casadapaz/infra        |
| Swarm InovaTI  | chat.inovatitech.com.br              | tunnel/swarm only | chatwoot-admin / chatwoot-sidekiq     |
EOF
echo
echo "Doc: docs/operations/vps-chatwoot-instances.md"
echo "deviations=${deviations}"
if [[ "$deviations" -gt 0 ]]; then
  echo "AUDIT_CHATWOOT_INSTANCES_WARN"
  exit 2
fi
echo "AUDIT_CHATWOOT_INSTANCES_OK"
