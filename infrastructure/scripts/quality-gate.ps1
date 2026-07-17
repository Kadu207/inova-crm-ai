param(
    [int]$Phase = -1,
    [string]$Task = "",
    [switch]$Soft
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$nodeArgs = @("$root\infrastructure\scripts\quality-gate.mjs")

if ($Phase -ge 0) {
    $nodeArgs += "--phase=$Phase"
}
if ($Task) {
    $nodeArgs += "--task=$Task"
}
if ($Soft) {
    $nodeArgs += "--soft"
}

& node @nodeArgs
exit $LASTEXITCODE
