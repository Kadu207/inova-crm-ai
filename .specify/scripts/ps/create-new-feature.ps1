#Requires -Version 5.1
<#
.SYNOPSIS
  Cria nova feature Spec Kit — Inova CRM AI
#>
param(
    [Parameter(Position = 0)]
    [string]$FeatureDescription,
    [switch]$Json,
    [switch]$DryRun,
    [switch]$Help
)

function Show-Usage {
    Write-Host @"
Usage: .\create-new-feature.ps1 [-Json] [-DryRun] [-Help] <feature description>

Cria branch e pasta specs/NNN-slug/ com spec.md a partir do template.

Exemplo:
  .\create-new-feature.ps1 "Qualificação automática de leads"

Opções:
  -Json     Saída JSON
  -DryRun   Apenas calcula paths sem criar arquivos
  -Help     Exibe esta ajuda
"@
}

if ($Help) { Show-Usage; exit 0 }
if (-not $FeatureDescription) { Show-Usage; exit 1 }

Write-Host "Inova CRM AI — create-new-feature (stub Fase 0)"
Write-Host "Descrição: $FeatureDescription"
if ($DryRun) { Write-Host "[DryRun] Nenhum arquivo criado." }
Write-Host "Implementação completa prevista na Fase 1."
