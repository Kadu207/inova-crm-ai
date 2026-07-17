#!/usr/bin/env bash
# Check local ports 9400-9419.
# Compatible with bash; CRLF-safe if dos2unix/sed applied after Windows sync.
set -eu

START_PORT="${START_PORT:-9400}"
END_PORT="${END_PORT:-9419}"
HOST="${HOST:-127.0.0.1}"
SSH_TARGET="${SSH_TARGET:-}"

check_port() {
  local port="$1"
  if command -v nc >/dev/null 2>&1; then
    nc -z -w1 "$HOST" "$port" >/dev/null 2>&1
    return $?
  fi
  if (echo >/dev/tcp/"$HOST"/"$port") >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

echo "Checking ports ${START_PORT}-${END_PORT} on ${HOST} ..."

in_use=""
port=$START_PORT
while [ "$port" -le "$END_PORT" ]; do
  if check_port "$port"; then
    in_use="${in_use} ${port}"
    echo "  [IN USE] $port"
  fi
  port=$((port + 1))
done

if [ -n "$SSH_TARGET" ]; then
  echo "Remote SSH check on ${SSH_TARGET} (placeholder — run manually):"
  echo "  ssh ${SSH_TARGET} 'ss -tln | grep -E \":(94[0-1][0-9])\"'"
fi

if [ -n "$in_use" ]; then
  echo "FAIL: port(s) in use:${in_use}"
  exit 1
fi

echo "PASS: all ports ${START_PORT}-${END_PORT} are free on ${HOST}"
exit 0
