param(
    [int]$StartPort = 9400,
    [int]$EndPort = 9419,
    [string]$HostName = "127.0.0.1",
    [string]$SshTarget = "",
    [switch]$StrictFree
)

$ErrorActionPreference = "Stop"

function Test-PortInUse {
    param([int]$Port, [string]$TargetHost)

    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect($TargetHost, $Port, $null, $null)
        $waited = $async.AsyncWaitHandle.WaitOne(300)
        if (-not $waited) {
            $client.Close()
            return $false
        }
        $client.EndConnect($async)
        $client.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Get-InovaCrmPorts {
    $owned = @{}
    try {
        $rows = docker ps --format "{{.Names}}|{{.Ports}}" 2>$null
        if (-not $rows) { return $owned }
        foreach ($row in $rows) {
            if ($row -notmatch '^inova-crm-') { continue }
            $portsPart = ($row -split '\|', 2)[1]
            $matches_ = [regex]::Matches($portsPart, '127\.0\.0\.1:(\d+)->')
            foreach ($m in $matches_) {
                $owned[[int]$m.Groups[1].Value] = $true
            }
        }
    }
    catch {
        # docker not available — ignore ownership
    }
    return $owned
}

Write-Host "Checking ports $StartPort-$EndPort on $HostName ..."

$crmOwned = Get-InovaCrmPorts
$inUseForeign = @()
$inUseCrm = @()

for ($port = $StartPort; $port -le $EndPort; $port++) {
    if (-not (Test-PortInUse -Port $port -TargetHost $HostName)) {
        continue
    }
    if (-not $StrictFree -and $crmOwned.ContainsKey($port)) {
        $inUseCrm += $port
        Write-Host "  [CRM OK] $port (inova-crm container)"
    }
    else {
        $inUseForeign += $port
        Write-Host "  [IN USE] $port"
    }
}

if ($SshTarget) {
    Write-Host "Remote SSH check on $SshTarget (placeholder - run manually):"
    Write-Host ('  ssh ' + $SshTarget + ' ss -tln')
}

if ($inUseForeign.Count -gt 0) {
    Write-Host "FAIL: $($inUseForeign.Count) port(s) in use by non-CRM process: $($inUseForeign -join ', ')"
    exit 1
}

if ($inUseCrm.Count -gt 0) {
    Write-Host "PASS: ports free or owned by inova-crm ($($inUseCrm -join ', '))"
}
else {
    Write-Host "PASS: all ports $StartPort-$EndPort are free on $HostName"
}
exit 0
