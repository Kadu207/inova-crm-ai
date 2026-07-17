#Requires -Version 5.1
<#
.SYNOPSIS
  Verifica pré-requisitos do Spec Kit — Inova CRM AI
.DESCRIPTION
  Stub Fase 0. Valida presença de constitution, templates e ferramentas básicas.
#>
param(
    [switch]$Json,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Show-Usage {
    Write-Host @"
Usage: .\check-prerequisites.ps1 [-Json] [-Help]

Verifica:
  - .specify/memory/constitution.md
  - .specify/templates/
  - .cursor/rules/specify-rules.mdc
  - Git disponível

Opções:
  -Json   Saída JSON
  -Help   Exibe esta ajuda
"@
}

if ($Help) { Show-Usage; exit 0 }

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$checks = @(
    @{ name = "constitution"; path = Join-Path $repoRoot ".specify\memory\constitution.md" },
    @{ name = "spec-template"; path = Join-Path $repoRoot ".specify\templates\spec-template.md" },
    @{ name = "specify-rules"; path = Join-Path $repoRoot ".cursor\rules\specify-rules.mdc" }
)

$results = foreach ($c in $checks) {
    @{ name = $c.name; ok = (Test-Path $c.path); path = $c.path }
}

$gitOk = $null -ne (Get-Command git -ErrorAction SilentlyContinue)
$allOk = ($results | Where-Object { -not $_.ok }).Count -eq 0

if ($Json) {
    @{ ok = $allOk; git = $gitOk; checks = $results } | ConvertTo-Json -Depth 4
} else {
    Write-Host "Inova CRM AI — check-prerequisites (stub Fase 0)"
    foreach ($r in $results) {
        $status = if ($r.ok) { "OK" } else { "MISSING" }
        Write-Host "  [$status] $($r.name)"
    }
    Write-Host "  Git: $(if ($gitOk) { 'OK' } else { 'NOT FOUND' })"
    if (-not $allOk) { exit 1 }
}
