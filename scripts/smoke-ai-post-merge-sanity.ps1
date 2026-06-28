# AI post-merge local sanity pack (PowerShell)
# Deterministic/admin paths only. No secrets printed. Live provider skipped by default.

$ErrorActionPreference = "Stop"
Set-Location C:\dcaosv1

$logPath = Join-Path $env:TEMP ("dca-ai-post-merge-sanity-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
$lines = New-Object System.Collections.Generic.List[string]

function Add-LogLine([string]$Message) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $entry = "[$timestamp] $Message"
  $lines.Add($entry) | Out-Null
  Write-Host $entry
}

function Invoke-SanityCommand([string]$Label, [string[]]$CommandArgs) {
  Add-LogLine "RUN $Label"
  # Re-apply auth seed password for each child npm process (value never logged).
  $env:AUTH_SEED_TEST_PASSWORD = $script:AuthSeedTestPassword
  & npm.cmd @CommandArgs
  if ($LASTEXITCODE -ne 0) {
    Add-LogLine "FAIL $Label exit=$LASTEXITCODE"
    $lines | Set-Content -Path $logPath -Encoding UTF8
    Write-Host "Sanity log: $logPath"
    notepad $logPath
    exit $LASTEXITCODE
  }
  Add-LogLine "PASS $Label"
}

function Restart-LocalApiForSmoke {
  Add-LogLine "Restarting API to reset local in-memory rate limit."
  $connections = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    if ($conn.OwningProcess -gt 0) {
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
  Start-Sleep -Seconds 3
  $env:TENANT_MODULE_ENFORCEMENT = "off"
  $env:AUTH_SEED_TEST_PASSWORD = $script:AuthSeedTestPassword
  Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList "run", "dev:api" -WorkingDirectory (Get-Location).Path
  $deadline = (Get-Date).AddSeconds(45)
  do {
    Start-Sleep -Seconds 2
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:4000/api/v1/health" -TimeoutSec 5
      if ($health.ok -eq $true -and $health.data.database.status -eq "ready") {
        Add-LogLine "API/database ready after restart"
        return
      }
    } catch {
      # API still starting
    }
  } while ((Get-Date) -lt $deadline)
  Add-LogLine "FAIL Local API did not become ready on port 4000 within 45 seconds"
  $lines | Set-Content -Path $logPath -Encoding UTF8
  notepad $logPath
  exit 1
}

Add-LogLine "Starting AI post-merge sanity pack"
Add-LogLine "Recovery: stop stale API for Prisma EPERM; restart API on 429 rate-limit; free ports 4000/5173 if busy"

if (-not $env:AUTH_SEED_TEST_PASSWORD) {
  Add-LogLine "FAIL AUTH_SEED_TEST_PASSWORD is required"
  $lines | Set-Content -Path $logPath -Encoding UTF8
  notepad $logPath
  exit 1
}

$script:AuthSeedTestPassword = $env:AUTH_SEED_TEST_PASSWORD

Invoke-SanityCommand "validate (check+build)" @("run", "check")
Invoke-SanityCommand "validate build" @("run", "build")
Restart-LocalApiForSmoke
Invoke-SanityCommand "smoke:ai-provider-config:local" @("run", "smoke:ai-provider-config:local")
Invoke-SanityCommand "smoke:ai-operations:local" @("run", "smoke:ai-operations:local")
Invoke-SanityCommand "smoke:ai-operations:browser" @("run", "smoke:ai-operations:browser")
Invoke-SanityCommand "smoke:client-safe-ai-visibility:local" @("run", "smoke:client-safe-ai-visibility:local")
Restart-LocalApiForSmoke
Invoke-SanityCommand "smoke:ai-matrix" @("run", "smoke:ai-matrix")

Add-LogLine "All AI post-merge sanity steps passed"
$lines | Set-Content -Path $logPath -Encoding UTF8
Write-Host "Sanity log: $logPath"
notepad $logPath
