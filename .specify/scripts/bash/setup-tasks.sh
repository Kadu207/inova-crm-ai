#!/usr/bin/env bash
# Gera tasks.md a partir de plan.md — Inova CRM AI (stub Fase 0)

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: setup-tasks.sh [--plan-path <path>] [--json] [-h|--help]

Gera tasks.md na pasta da feature a partir do tasks-template.

Exemplo:
  ./setup-tasks.sh --plan-path specs/001-leads/plan.md

Opções:
  --plan-path  Caminho para plan.md
  --json       Saída JSON
  -h           Exibe esta ajuda
EOF
}

PLAN_PATH=""
JSON=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan-path) PLAN_PATH="$2"; shift ;;
    --json) JSON=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opção desconhecida: $1" >&2; usage; exit 1 ;;
  esac
  shift
done

echo "Inova CRM AI — setup-tasks (stub Fase 0)"
echo "PlanPath: ${PLAN_PATH:-(feature ativa)}"
echo "Implementação completa prevista na Fase 1."
