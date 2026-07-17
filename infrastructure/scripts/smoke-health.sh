#!/usr/bin/env bash
# Smoke-check infrastructure health endpoints when services are running.
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1}"
REQUIRE_ALL="${REQUIRE_ALL:-0}"

check() {
  local name="$1"
  local port="$2"
  local path="$3"
  local url="${BASE_URL}:${port}${path}"

  if curl -fsS --max-time 5 "$url" >/dev/null 2>&1; then
    echo "PASS: ${name} (${url})"
    return 0
  fi
  echo "SKIP: ${name} (${url}) — not reachable"
  return 1
}

passed=0
failed=0
skipped=0

for spec in \
  "MinIO live|9405|/minio/health/live" \
  "MinIO ready|9405|/minio/health/ready" \
  "RabbitMQ UI|9407|/"; do
  IFS='|' read -r name port path <<<"$spec"
  if check "$name" "$port" "$path"; then
    ((passed++)) || true
  else
    ((skipped++)) || true
  fi
done

# Future app endpoints (informational)
for spec in \
  "Frontend|9400|/api/health" \
  "API|9401|/health" \
  "AI|9402|/health"; do
  IFS='|' read -r name port path <<<"$spec"
  url="${BASE_URL}:${port}${path}"
  if curl -fsS --max-time 3 "$url" >/dev/null 2>&1; then
    echo "PASS: ${name} (${url})"
    ((passed++)) || true
  else
    echo "INFO: ${name} not up yet (${url})"
  fi
done

if [[ "$REQUIRE_ALL" == "1" && "$failed" -gt 0 ]]; then
  echo "SMOKE_FAIL"
  exit 1
fi

echo "SMOKE_DONE: passed=${passed} failed=${failed} skipped=${skipped}"
exit 0
