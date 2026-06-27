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
  Invoke-NpmStep "Login shell browser smoke" "smoke:browser"
  Invoke-NpmStep "Dashboard audit feed browser smoke" "smoke:dashboard:audit-feed:browser"
  Invoke-NpmStep "Settings and Team shell browser smoke" "smoke:settings-team:browser"
  Invoke-NpmStep "Content plan review browser smoke" "smoke:content-plan-review:browser"
  Invoke-NpmStep "Content draft review browser smoke" "smoke:content-draft-review:browser"
  Invoke-NpmStep "Finance admin browser smoke" "smoke:finance-admin:browser"
  Invoke-NpmStep "Client access admin browser smoke" "smoke:client-access:browser"
  Invoke-NpmStep "Client portal browser smoke" "smoke:client-portal:browser"
  Invoke-NpmStep "Client portal signed-out browser smoke" "smoke:client-portal:signed-out:browser"
  Invoke-NpmStep "Client portal edge cases browser smoke" "smoke:client-portal:edge-cases:browser"
  Invoke-NpmStep "Client portal sparse delivery browser smoke" "smoke:client-portal:sparse-delivery:browser"
  Invoke-NpmStep "Client portal populated delivery browser smoke" "smoke:client-portal:populated-delivery:browser"
  Invoke-NpmStep "Client portal access revoke browser smoke" "smoke:client-portal:access-revoke:browser"
  Invoke-NpmStep "Client portal empty archive browser smoke" "smoke:client-portal:empty-archive:browser"
  Invoke-NpmStep "Client hub catalog inquiry browser smoke" "smoke:client-hub:catalog-inquiry:browser"
  Invoke-NpmStep "Client hub publication log browser smoke" "smoke:client-hub:publication-log:browser"
  Invoke-NpmStep "Client portal project filter browser smoke" "smoke:client-portal:project-filter:browser"
  Invoke-NpmStep "Client domain browser smoke" "smoke:client-domain:browser"
  Invoke-NpmStep "Client portal monthly report browser smoke" "smoke:client-portal-monthly-report:browser"
  Invoke-NpmStep "AI Market Intelligence local smoke" "smoke:ai-market-intelligence"
  Invoke-NpmStep "Market Intelligence operator browser smoke" "smoke:mi-operator:browser"
  Invoke-NpmStep "AI Delivery workflow browser smoke" "smoke:ai-delivery-workflow:browser"
  Invoke-NpmStep "Monthly metrics import browser smoke" "smoke:monthly-metrics-import:browser"
  Invoke-NpmStep "Roles and permissions browser smoke" "smoke:roles-permissions:browser"
  Invoke-NpmStep "Module registry browser smoke" "smoke:module-registry:browser"
  Invoke-NpmStep "Settings backend browser smoke" "smoke:settings-backend:browser"
  Invoke-NpmStep "Audit activity browser smoke" "smoke:audit-activity:browser"
  Invoke-NpmStep "Dashboard data-backed browser smoke" "smoke:dashboard-data-backed:browser"
  Invoke-NpmStep "Auth invite boundary browser smoke" "smoke:auth-invite-boundary:browser"

  Restart-LocalApiForSmoke "Restart local API to clear login rate limits before backend-heavy smokes"

  Invoke-NpmStep "Google Drive export local smoke" "smoke:google-drive-export"
  Invoke-NpmStep "Monthly report MI context local smoke" "smoke:monthly-report:mi-context"
  Invoke-NpmStep "Monthly report local smoke" "smoke:monthly-report:local"
  Invoke-NpmStep "Monthly report PDF local smoke" "smoke:monthly-report:pdf"
  Invoke-NpmStep "Monthly report metrics local smoke" "smoke:monthly-report:metrics"
  Invoke-NpmStep "Monthly report admin browser smoke" "smoke:monthly-report:browser"
  Invoke-NpmStep "AI Delivery reviews smoke" "smoke:ai-delivery-reviews"
  Invoke-NpmStep "Email outbox read-only smoke" "smoke:email-outbox:local"
  Invoke-NpmStep "Credential encryption local smoke" "smoke:credential-encryption:local"
  Invoke-NpmStep "R2 byte roundtrip local smoke" "smoke:r2-byte-roundtrip:local"
  Invoke-NpmStep "WordPress publish local smoke" "smoke:wordpress-publish:local"
  Invoke-NpmStep "Tenant module local smoke" "smoke:tenant-module:local"
  Invoke-NpmStep "Tenant module dry_run probe" "smoke:tenant-module:dry-run-probe"
  Invoke-NpmStep "OpenRouter guarded local smoke" "smoke:openrouter-guarded:local"
  Invoke-NpmStep "Google Drive export live planning smoke" "smoke:google-drive-export-live:local"
  Invoke-NpmStep "Credential master key probe" "smoke:credential-master-key-probe:local"
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
