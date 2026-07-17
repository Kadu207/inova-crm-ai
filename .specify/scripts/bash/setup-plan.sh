#!/usr/bin/env bash
# Gera plan.md a partir de spec.md — Inova CRM AI (stub Fase 0)

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: setup-plan.sh [--spec-path <path>] [--json] [-h|--help]

Gera plan.md na pasta da feature ativa a partir do plan-template.

Exemplo:
  ./setup-plan.sh --spec-path specs/001-leads/spec.md

Opções:
  --spec-path  Caminho para spec.md
  --json       Saída JSON
  -h           Exibe esta ajuda
EOF
}

SPEC_PATH=""
JSON=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --spec-path) SPEC_PATH="$2"; shift ;;
    --json) JSON=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opção desconhecida: $1" >&2; usage; exit 1 ;;
  esac
  shift
done

echo "Inova CRM AI — setup-plan (stub Fase 0)"
echo "SpecPath: ${SPEC_PATH:-(feature ativa)}"
echo "Implementação completa prevista na Fase 1."
