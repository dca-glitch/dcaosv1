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
  $connections = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    if ($conn.OwningProcess -gt 0) {
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
  Start-Sleep -Seconds 3
}

function Stop-LocalDevServers {
  Write-Step "Stop local API/web before post-smoke validate (Prisma EPERM guard)"
  foreach ($port in 4000, 5173) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
      if ($conn.OwningProcess -gt 0) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
      }
    }
  }
  Start-Sleep -Seconds 3
}

if (-not $env:AUTH_SEED_TEST_PASSWORD -or $env:AUTH_SEED_TEST_PASSWORD.Length -lt 8) {
  throw "AUTH_SEED_TEST_PASSWORD must be set in the shell (minimum 8 characters). Never commit or print it."
}

try {
  Write-Host "[SMOKE][PURIVA_READINESS] local staging/production readiness gate" -ForegroundColor Yellow

  Invoke-NpmStep "Pre-smoke validate" "validate"

  Invoke-NpmStep "Puriva client setup smoke" "smoke:puriva-client-setup:local"
  Invoke-NpmStep "Puriva full delivery smoke" "smoke:puriva-full-delivery:local"

  Restart-LocalApiForSmoke "Restart local API to clear login rate limits before client portal boundary smoke"

  Invoke-NpmStep "Puriva client portal boundary smoke" "smoke:puriva-client-portal-boundary:local"
  Invoke-NpmStep "Workflow brief publication handoff browser smoke" "smoke:workflow-brief-publication-handoff:browser"

  Stop-LocalDevServers
  Invoke-NpmStep "Post-smoke validate" "validate"

  Write-Host ""
  Write-Host "[SMOKE][PURIVA_READINESS] finished — all Puriva readiness gates passed." -ForegroundColor Green
  Write-Host "See docs/runbooks/PURIVA_STAGING_PRODUCTION_READINESS_GATE.md for staging/prod operator checklists."
} catch {
  Write-Host ""
  Write-Host "[SMOKE][PURIVA_READINESS] failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
