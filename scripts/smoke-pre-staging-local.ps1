Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-NpmStep {
  param(
    [string]$Label,
    [string]$ScriptName
  )

  Write-Step $Label
  npm.cmd run $ScriptName
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed (npm run $ScriptName exit $LASTEXITCODE)."
  }
}

function Restart-LocalApiForSmoke {
  param([string]$Reason)

  Write-Step $Reason
  $conn = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }
  $env:TENANT_MODULE_ENFORCEMENT = "off"
  Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList "run", "dev:api" -WorkingDirectory (Get-Location).Path
  Start-Sleep -Seconds 8
}

function Ensure-LocalWebForBrowserSmoke {
  Write-Step "Ensure local web dev server on port 5173 for browser smokes"
  $web = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $web) {
    Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList "run", "dev:web" -WorkingDirectory (Get-Location).Path
    Start-Sleep -Seconds 10
  }
}

try {
  Write-Host "[SMOKE][PRE_STAGING] local repo closeout gate" -ForegroundColor Yellow

  Invoke-NpmStep "validate" "validate"

  Restart-LocalApiForSmoke "Restart local API with TENANT_MODULE_ENFORCEMENT=off for smoke suite"

  Invoke-NpmStep "API health (smoke:local)" "smoke:local"
  Invoke-NpmStep "MVP local smoke" "smoke:mvp:local"
  Invoke-NpmStep "Client portal local smoke" "smoke:client-portal:local"
  Invoke-NpmStep "Client access admin smoke" "smoke:client-access:local"
  Ensure-LocalWebForBrowserSmoke
  Invoke-NpmStep "Client portal browser smoke" "smoke:client-portal:browser"
  Invoke-NpmStep "Client portal edge cases browser smoke" "smoke:client-portal:edge-cases:browser"
  Invoke-NpmStep "Client domain browser smoke" "smoke:client-domain:browser"
  Invoke-NpmStep "Client portal monthly report browser smoke" "smoke:client-portal-monthly-report:browser"
  Invoke-NpmStep "AI Market Intelligence local smoke" "smoke:ai-market-intelligence"

  Restart-LocalApiForSmoke "Restart local API to clear login rate limits before AI Delivery smoke"

  Invoke-NpmStep "AI Delivery reviews smoke" "smoke:ai-delivery-reviews"
  Invoke-NpmStep "Credential encryption local smoke" "smoke:credential-encryption:local"
  Invoke-NpmStep "WordPress publish local smoke" "smoke:wordpress-publish:local"
  Invoke-NpmStep "Tenant module local smoke" "smoke:tenant-module:local"
  Invoke-NpmStep "Legacy WordPress sunset local smoke" "smoke:legacy-wordpress-sunset:local"

  Write-Host ""
  Write-Host "[SMOKE][PRE_STAGING] PASS - local repo gate complete (no VPS deploy)." -ForegroundColor Green
  exit 0
} catch {
  Write-Host ""
  Write-Host "[SMOKE][PRE_STAGING] FAIL - $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Tip: stop local API if validate failed with Prisma EPERM, then rerun." -ForegroundColor Yellow
  exit 1
}
