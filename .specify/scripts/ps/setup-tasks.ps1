#Requires -Version 5.1
<#
.SYNOPSIS
  Gera tasks.md a partir de plan.md — Inova CRM AI
#>
param(
    [string]$PlanPath,
    [switch]$Json,
    [switch]$Help
)

function Show-Usage {
    Write-Host @"
Usage: .\setup-tasks.ps1 [-PlanPath <path>] [-Json] [-Help]

Gera tasks.md na pasta da feature a partir do tasks-template.

Exemplo:
  .\setup-tasks.ps1 -PlanPath specs\001-leads\plan.md

Opções:
  -PlanPath  Caminho para plan.md (default: feature ativa)
  -Json      Saída JSON
  -Help      Exibe esta ajuda
"@
}

if ($Help) { Show-Usage; exit 0 }

Write-Host "Inova CRM AI — setup-tasks (stub Fase 0)"
Write-Host "PlanPath: $(if ($PlanPath) { $PlanPath } else { '(feature ativa)' })"
Write-Host "Implementação completa prevista na Fase 1."
