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
  $apiOut = Join-Path $env:TEMP ("dca-ai-post-merge-sanity-api-" + (Get-Date -Format "yyyyMMdd-HHmmssfff") + ".stdout.log")
  $apiErr = Join-Path $env:TEMP ("dca-ai-post-merge-sanity-api-" + (Get-Date -Format "yyyyMMdd-HHmmssfff") + ".stderr.log")
  Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev:api" -WorkingDirectory (Get-Location).Path -RedirectStandardOutput $apiOut -RedirectStandardError $apiErr
  Wait-ForLocalApiReady
}

function Test-LocalApiReady {
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:4000/api/v1/health" -TimeoutSec 5
    return ($health.ok -eq $true -and $health.data.database.status -eq "ready")
  } catch {
    return $false
  }
}

function Wait-ForLocalApiReady {
  $deadline = (Get-Date).AddSeconds(45)
  do {
    Start-Sleep -Seconds 2
    if (Test-LocalApiReady) {
      Add-LogLine "API/database ready at http://127.0.0.1:4000/api/v1/health"
      return
    }
  } while ((Get-Date) -lt $deadline)
  Add-LogLine "FAIL Local API did not become ready on port 4000 within 45 seconds"
  $lines | Set-Content -Path $logPath -Encoding UTF8
  notepad $logPath
  exit 1
}

function Ensure-LocalBrowserSmokeServices {
  Add-LogLine "Ensure local API and web services for browser smoke"

  if (-not (Test-LocalApiReady)) {
    $apiListening = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($apiListening) {
      Restart-LocalApiForSmoke
    } else {
      Add-LogLine "Starting local API on port 4000"
      $env:TENANT_MODULE_ENFORCEMENT = "off"
      $env:AUTH_SEED_TEST_PASSWORD = $script:AuthSeedTestPassword
      $apiOut = Join-Path $env:TEMP ("dca-ai-post-merge-sanity-api-" + (Get-Date -Format "yyyyMMdd-HHmmssfff") + ".stdout.log")
      $apiErr = Join-Path $env:TEMP ("dca-ai-post-merge-sanity-api-" + (Get-Date -Format "yyyyMMdd-HHmmssfff") + ".stderr.log")
      Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev:api" -WorkingDirectory (Get-Location).Path -RedirectStandardOutput $apiOut -RedirectStandardError $apiErr
      Wait-ForLocalApiReady
    }
  } else {
    Add-LogLine "API/database ready at http://127.0.0.1:4000/api/v1/health"
  }

  $webListening = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $webListening) {
    Add-LogLine "Starting local web dev server on port 5173"
    $webOut = Join-Path $env:TEMP ("dca-ai-post-merge-sanity-web-" + (Get-Date -Format "yyyyMMdd-HHmmssfff") + ".stdout.log")
    $webErr = Join-Path $env:TEMP ("dca-ai-post-merge-sanity-web-" + (Get-Date -Format "yyyyMMdd-HHmmssfff") + ".stderr.log")
    Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev:web" -WorkingDirectory (Get-Location).Path -RedirectStandardOutput $webOut -RedirectStandardError $webErr
  }

  $webDeadline = (Get-Date).AddSeconds(30)
  $webUrls = @("http://127.0.0.1:5173", "http://localhost:5173")
  do {
    foreach ($webUrl in $webUrls) {
      try {
        $webResponse = Invoke-WebRequest -Uri $webUrl -Method GET -TimeoutSec 5 -UseBasicParsing
        if ($webResponse.StatusCode -ge 200 -and $webResponse.StatusCode -lt 500) {
          Add-LogLine "Web reachable at $webUrl"
          return
        }
      } catch {
        # try next URL or retry
      }
    }
    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $webDeadline)

  Add-LogLine "FAIL Web not reachable at http://127.0.0.1:5173 or http://localhost:5173 within 30 seconds"
  [System.IO.File]::WriteAllLines($logPath, [string[]]$lines)
  notepad $logPath
  throw "Local web not reachable for browser smoke"
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
Ensure-LocalBrowserSmokeServices
Invoke-SanityCommand "smoke:ai-operations:browser" @("run", "smoke:ai-operations:browser")
Invoke-SanityCommand "smoke:client-safe-ai-visibility:local" @("run", "smoke:client-safe-ai-visibility:local")
Restart-LocalApiForSmoke
Invoke-SanityCommand "smoke:ai-matrix" @("run", "smoke:ai-matrix")

Add-LogLine "All AI post-merge sanity steps passed"
$lines | Set-Content -Path $logPath -Encoding UTF8
Write-Host "Sanity log: $logPath"
notepad $logPath
