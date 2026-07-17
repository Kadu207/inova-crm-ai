#!/usr/bin/env bash
# Wrapper around quality-gate.mjs for POSIX shells.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --phase=*)
      ARGS+=("$1")
      ;;
    --task=*)
      ARGS+=("$1")
      ;;
    --soft)
      ARGS+=("--soft")
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
  shift
done

node "${ROOT}/infrastructure/scripts/quality-gate.mjs" "${ARGS[@]}"
