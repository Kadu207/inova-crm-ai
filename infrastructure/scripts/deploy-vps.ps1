# deploy-vps.ps1 — Deploy stub for Hetzner VPS /opt/inova-crm-ai (Windows)
# Usage: .\infrastructure\scripts\deploy-vps.ps1 -VpsHost "your-vps" -VpsUser "deploy"
param(
    [string]$VpsHost = "your-vps.example.com",
    [string]$VpsUser = "deploy",
    [string]$RemoteDir = "/opt/inova-crm-ai"
)

$ErrorActionPreference = "Stop"
$LocalDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")

Write-Host "==> Inova CRM AI — deploy to ${VpsUser}@${VpsHost}:${RemoteDir}"

Write-Host "==> [1/6] Local port check"
& (Join-Path $PSScriptRoot "check-ports.ps1")

Write-Host "==> [2/6] Rsync via WSL or scp"
$rsyncCmd = @(
    "rsync", "-avz", "--delete",
    "--exclude", "node_modules",
    "--exclude", ".next",
    "--exclude", "dist",
    "--exclude", ".git",
    "--exclude", "infrastructure/.env",
    "$($LocalDir)/",
    "${VpsUser}@${VpsHost}:${RemoteDir}/"
)

if (Get-Command wsl -ErrorAction SilentlyContinue) {
    wsl bash -c ($rsyncCmd -join " ")
} else {
    Write-Warning "WSL/rsync not found. Use Git pull on VPS or install rsync."
    Write-Host "  scp -r `"$LocalDir\infrastructure`" ${VpsUser}@${VpsHost}:${RemoteDir}/"
}

Write-Host "==> [3/6] Remote port check"
ssh "${VpsUser}@${VpsHost}" "cd ${RemoteDir} && bash infrastructure/scripts/check-ports.sh"

Write-Host "==> [4/6] Remote backup"
ssh "${VpsUser}@${VpsHost}" "cd ${RemoteDir} && bash infrastructure/scripts/backup.sh || true"

Write-Host "==> [5/6] Docker compose up (profile apps)"
ssh "${VpsUser}@${VpsHost}" @"
cd ${RemoteDir} && docker compose \
  --env-file infrastructure/.env \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.vps.yml \
  --profile apps \
  up -d --build
"@

Write-Host "==> [6/6] Migrations + seed"
ssh "${VpsUser}@${VpsHost}" @"
cd ${RemoteDir} && \
docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps exec -T api npx prisma migrate deploy && \
docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.vps.yml --profile apps exec -T api npx tsx prisma/seed.ts || true
"@

Write-Host "==> Deploy complete. Prefer on-server: bash infrastructure/scripts/bootstrap-vps.sh"
Write-Host "    Tunnel checklist: docs/deploy-proximo-passo.md"
Write-Host "    https://crm.inovatitech.com.br/login"
