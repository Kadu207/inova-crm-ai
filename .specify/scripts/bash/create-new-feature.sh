#!/usr/bin/env bash
# Cria nova feature Spec Kit — Inova CRM AI (stub Fase 0)

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: create-new-feature.sh [--json] [--dry-run] [-h|--help] <feature description>

Cria branch e pasta specs/NNN-slug/ com spec.md a partir do template.

Exemplo:
  ./create-new-feature.sh "Qualificação automática de leads"

Opções:
  --json      Saída JSON
  --dry-run   Apenas calcula paths sem criar arquivos
  -h          Exibe esta ajuda
EOF
}

JSON=false
DRY_RUN=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON=true ;;
    --dry-run) DRY_RUN=true ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "Opção desconhecida: $1" >&2; usage; exit 1 ;;
    *) break ;;
  esac
  shift
done

if [[ $# -lt 1 ]]; then usage; exit 1; fi

DESC="$*"
echo "Inova CRM AI — create-new-feature (stub Fase 0)"
echo "Descrição: $DESC"
$DRY_RUN && echo "[DryRun] Nenhum arquivo criado."
echo "Implementação completa prevista na Fase 1."
