#!/usr/bin/env bash
# vps-ram-guard.sh — pause/resume heavy containers and optionally ensure swap
# before Docker image builds on the shared Hetzner VPS.
#
# Usage:
#   bash infrastructure/scripts/vps-ram-guard.sh status
#   bash infrastructure/scripts/vps-ram-guard.sh pause
#   bash infrastructure/scripts/vps-ram-guard.sh resume
#   bash infrastructure/scripts/vps-ram-guard.sh ensure-swap   # 4G file /swapfile-inova if missing
#   bash infrastructure/scripts/vps-ram-guard.sh with-build -- <command...>
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STATE_FILE="${VPS_RAM_GUARD_STATE:-/tmp/inova-crm-ram-guard-stopped.txt}"
MIN_AVAIL_MB="${VPS_RAM_MIN_AVAIL_MB:-1800}"
SWAP_FILE="${VPS_SWAP_FILE:-/swapfile-inova}"
SWAP_SIZE_GB="${VPS_SWAP_SIZE_GB:-4}"

# Heavy / non-critical during CRM image builds (CRM + noisy neighbors on same VPS).
DEFAULT_PAUSE=(
  inova-crm-n8n-worker
  inova-crm-n8n
  inova-crm-workers
  crm_chatwoot_sidekiq
)

# Optional extras (set VPS_RAM_PAUSE_EXTRA="infra-n8n-1 excellence-n8n")
read -r -a EXTRA_PAUSE <<< "${VPS_RAM_PAUSE_EXTRA:-}"

avail_mb() {
  free -m | awk '/^Mem:/{print $7}'
}

cmd_status() {
  echo "==> Memory"
  free -h
  echo
  echo "==> Swap"
  (command -v swapon >/dev/null && swapon --show) || (/usr/sbin/swapon --show 2>/dev/null) || echo "(swapon not in PATH)"
  echo
  echo "==> Guard state file: ${STATE_FILE}"
  if [[ -f "$STATE_FILE" ]]; then
    echo "Paused containers:"
    cat "$STATE_FILE"
  else
    echo "(none paused by guard)"
  fi
  local avail
  avail="$(avail_mb)"
  echo
  echo "available_mb=${avail} (min recommended for Next build: ${MIN_AVAIL_MB})"
  if (( avail < MIN_AVAIL_MB )); then
    echo "WARN: available RAM below ${MIN_AVAIL_MB} MiB — run: $0 pause"
    return 1
  fi
  echo "RAM_OK"
}

cmd_ensure_swap() {
  local swapon_bin
  swapon_bin="$(command -v swapon || true)"
  [[ -z "$swapon_bin" && -x /usr/sbin/swapon ]] && swapon_bin=/usr/sbin/swapon
  [[ -z "$swapon_bin" && -x /sbin/swapon ]] && swapon_bin=/sbin/swapon

  if [[ -n "$swapon_bin" ]] && "$swapon_bin" --show 2>/dev/null | grep -q .; then
    echo "Swap already active:"
    "$swapon_bin" --show
    return 0
  fi

  if ! command -v sudo >/dev/null 2>&1; then
    echo "WARN: sudo unavailable — skip swap setup. Prefer CI docker load or pause more containers." >&2
    return 1
  fi

  if [[ -f "$SWAP_FILE" ]]; then
    echo "Enabling existing ${SWAP_FILE}"
    if ! sudo -n chmod 600 "$SWAP_FILE" 2>/dev/null; then
      echo "WARN: sudo requires password for swap — run interactively: sudo bash $0 ensure-swap" >&2
      return 1
    fi
    sudo -n "$swapon_bin" "$SWAP_FILE" 2>/dev/null || sudo -n swapon "$SWAP_FILE" || true
    [[ -n "$swapon_bin" ]] && "$swapon_bin" --show || true
    return 0
  fi

  echo "Creating ${SWAP_SIZE_GB}G swap at ${SWAP_FILE} (passwordless sudo required)"
  if ! sudo -n true 2>/dev/null; then
    echo "WARN: cannot create swap without passwordless sudo." >&2
    echo "  Run once as root: fallocate -l ${SWAP_SIZE_GB}G ${SWAP_FILE} && mkswap ${SWAP_FILE} && swapon ${SWAP_FILE}" >&2
    return 1
  fi
  sudo -n fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE" || sudo -n dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$((SWAP_SIZE_GB * 1024))
  sudo -n chmod 600 "$SWAP_FILE"
  sudo -n mkswap "$SWAP_FILE"
  sudo -n swapon "$SWAP_FILE"
  if ! grep -q "$SWAP_FILE" /etc/fstab 2>/dev/null; then
    echo "${SWAP_FILE} none swap sw 0 0" | sudo -n tee -a /etc/fstab >/dev/null
  fi
  swapon --show 2>/dev/null || "$swapon_bin" --show || true
  echo "SWAP_OK"
}

cmd_pause() {
  : >"$STATE_FILE"
  local name
  for name in "${DEFAULT_PAUSE[@]}" "${EXTRA_PAUSE[@]}"; do
    [[ -z "$name" ]] && continue
    if docker inspect "$name" >/dev/null 2>&1; then
      local st
      st="$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null || echo false)"
      if [[ "$st" == "true" ]]; then
        echo "Stopping ${name}"
        docker stop "$name" >/dev/null
        echo "$name" >>"$STATE_FILE"
      fi
    fi
  done
  sync || true
  free -m | head -2
  echo "PAUSE_OK ($(wc -l <"$STATE_FILE" | tr -d ' ') containers)"
}

cmd_resume() {
  if [[ ! -f "$STATE_FILE" ]]; then
    echo "Nothing to resume (no state file)"
    # Best-effort start CRM services anyway
    docker start inova-crm-n8n inova-crm-n8n-worker inova-crm-workers 2>/dev/null || true
    return 0
  fi
  local name
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    echo "Starting ${name}"
    docker start "$name" >/dev/null 2>&1 || true
  done <"$STATE_FILE"
  rm -f "$STATE_FILE"
  echo "RESUME_OK"
}

cmd_with_build() {
  if [[ "${1:-}" == "--" ]]; then
    shift
  fi
  if [[ $# -lt 1 ]]; then
    echo "Usage: $0 with-build -- <command...>" >&2
    exit 2
  fi
  cmd_ensure_swap || true
  cmd_pause
  local avail
  avail="$(avail_mb)"
  if (( avail < MIN_AVAIL_MB )); then
    echo "WARN: still only ${avail} MiB available after pause - build may OOM" >&2
  fi
  local rc=0
  set +e
  "$@"
  rc=$?
  set +e
  cmd_resume || true
  set -e
  exit "$rc"
}

usage() {
  sed -n '2,12p' "$0"
}

main() {
  local action="${1:-status}"
  shift || true
  case "$action" in
    status) cmd_status "$@" ;;
    pause) cmd_pause "$@" ;;
    resume) cmd_resume "$@" ;;
    ensure-swap) cmd_ensure_swap "$@" ;;
    with-build) cmd_with_build "$@" ;;
    -h|--help|help) usage ;;
    *)
      echo "Unknown action: $action" >&2
      usage
      exit 2
      ;;
  esac
}

main "$@"
