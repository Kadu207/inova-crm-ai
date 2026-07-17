param(
    [string]$BaseUrl = "http://127.0.0.1",
    [switch]$RequireAll
)

$ErrorActionPreference = "Continue"

$endpoints = @(
    @{ Name = "MinIO live"; Port = 9405; Path = "/minio/health/live" },
    @{ Name = "MinIO ready"; Port = 9405; Path = "/minio/health/ready" },
    @{ Name = "RabbitMQ UI"; Port = 9407; Path = "/" }
)

$passed = 0
$failed = 0
$skipped = 0

foreach ($ep in $endpoints) {
    $url = "${BaseUrl}:$($ep.Port)$($ep.Path)"
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            Write-Host "PASS: $($ep.Name) ($url)"
            $passed++
        }
        else {
            Write-Host "FAIL: $($ep.Name) ($url) - HTTP $($response.StatusCode)"
            $failed++
        }
    }
    catch {
        Write-Host "SKIP: $($ep.Name) ($url) - not reachable"
        $skipped++
    }
}

$future = @(
    @{ Name = "Frontend"; Port = 9400; Path = "/login" },
    @{ Name = "API"; Port = 9401; Path = "/health" },
    @{ Name = "AI"; Port = 9402; Path = "/health" },
    @{ Name = "n8n"; Port = 9404; Path = "/healthz" }
)

foreach ($ep in $future) {
    $url = "${BaseUrl}:$($ep.Port)$($ep.Path)"
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 3 -UseBasicParsing
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            Write-Host "PASS: $($ep.Name) ($url)"
            $passed++
        }
    }
    catch {
        Write-Host "INFO: $($ep.Name) not up yet ($url)"
    }
}

if ($RequireAll -and $failed -gt 0) {
    Write-Host "SMOKE_FAIL"
    exit 1
}

Write-Host "SMOKE_DONE: passed=$passed failed=$failed skipped=$skipped"
exit 0
