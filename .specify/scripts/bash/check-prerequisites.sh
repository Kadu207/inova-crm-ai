#!/usr/bin/env bash
# Verifica pré-requisitos do Spec Kit — Inova CRM AI (stub Fase 0)

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: check-prerequisites.sh [--json] [-h|--help]

Verifica:
  - .specify/memory/constitution.md
  - .specify/templates/
  - .cursor/rules/specify-rules.mdc
  - git disponível

Opções:
  --json   Saída JSON
  -h       Exibe esta ajuda
EOF
}

JSON=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opção desconhecida: $1" >&2; usage; exit 1 ;;
  esac
  shift
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

checks_ok=true
for f in \
  ".specify/memory/constitution.md" \
  ".specify/templates/spec-template.md" \
  ".cursor/rules/specify-rules.mdc"
do
  if [[ ! -f "$REPO_ROOT/$f" ]]; then
    checks_ok=false
    echo "[MISSING] $f" >&2
  fi
done

git_ok=false
command -v git >/dev/null 2>&1 && git_ok=true

if $JSON; then
  printf '{"ok":%s,"git":%s}\n' "$checks_ok" "$git_ok"
else
  echo "Inova CRM AI — check-prerequisites (stub Fase 0)"
  echo "  Git: $( $git_ok && echo OK || echo NOT FOUND )"
  $checks_ok || exit 1
fi
