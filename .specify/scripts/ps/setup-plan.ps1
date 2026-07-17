#Requires -Version 5.1
<#
.SYNOPSIS
  Gera plan.md a partir de spec.md — Inova CRM AI
#>
param(
    [string]$SpecPath,
    [switch]$Json,
    [switch]$Help
)

function Show-Usage {
    Write-Host @"
Usage: .\setup-plan.ps1 [-SpecPath <path>] [-Json] [-Help]

Gera plan.md na pasta da feature ativa a partir do plan-template.

Exemplo:
  .\setup-plan.ps1 -SpecPath specs\001-leads\spec.md

Opções:
  -SpecPath  Caminho para spec.md (default: feature ativa)
  -Json      Saída JSON
  -Help      Exibe esta ajuda
"@
}

if ($Help) { Show-Usage; exit 0 }

Write-Host "Inova CRM AI — setup-plan (stub Fase 0)"
Write-Host "SpecPath: $(if ($SpecPath) { $SpecPath } else { '(feature ativa)' })"
Write-Host "Implementação completa prevista na Fase 1."
