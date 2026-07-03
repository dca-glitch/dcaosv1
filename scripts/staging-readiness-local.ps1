# Pre-staging Block B  -  local staging-readiness smoke/boundary pack (PowerShell)
# Runs the Block A minimum smoke subset from docs/runbooks/STAGING_READINESS.md.
# Local only. No VPS/staging/production. No secrets printed.

param(
  [switch]$List,
  [switch]$IncludeOptional,
  [switch]$IncludeFullGates
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location C:\dcaosv1

$logPath = Join-Path $env:TEMP ("dca-staging-readiness-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
$lines = New-Object System.Collections.Generic.List[string]

$CoreSteps = @(
  @{ Label = "validate"; Script = "validate"; NeedsApi = $false; NeedsWeb = $false; Boundary = "repo typecheck/build gate" },
  @{ Label = "smoke:puriva-client-portal-boundary:local"; Script = "smoke:puriva-client-portal-boundary:local"; NeedsApi = $true; NeedsWeb = $false; Boundary = "client portal forbidden fields, monthly report provenance, legacy /briefs scan" },
  @{ Label = "smoke:ai-delivery-reviews"; Script = "smoke:ai-delivery-reviews"; NeedsApi = $true; NeedsWeb = $false; Boundary = "content plan, drafts, images, deliverables, WP draft prep guards" },
  @{ Label = "smoke:ai-seo-content-plan-pdf"; Script = "smoke:ai-seo-content-plan-pdf"; NeedsApi = $true; NeedsWeb = $false; Boundary = "admin-only content plan PDF export; no client storageKey leak" },
  @{ Label = "smoke:ai-knowledge-context"; Script = "smoke:ai-knowledge-context"; NeedsApi = $true; NeedsWeb = $false; Boundary = "knowledge isolation; no contextPreview/selectedSourcesJson on client paths" },
  @{ Label = "smoke:client-portal-monthly-report:browser"; Script = "smoke:client-portal-monthly-report:browser"; NeedsApi = $true; NeedsWeb = $true; Boundary = "FINAL-only client monthly reports UI; forbidden internals absent" },
  @{ Label = "smoke:monthly-report:browser"; Script = "smoke:monthly-report:browser"; NeedsApi = $true; NeedsWeb = $true; Boundary = "admin monthly report modal; client-safe separation" },
  @{ Label = "smoke:monthly-report:mi-context"; Script = "smoke:monthly-report:mi-context"; NeedsApi = $true; NeedsWeb = $false; Boundary = "miHandoffId/miContextDraft/adminSummaryNotes not exposed to client" }
)

$OptionalSteps = @(
  @{ Label = "smoke:monthly-report:metrics"; Script = "smoke:monthly-report:metrics"; NeedsApi = $true; NeedsWeb = $false; Boundary = "metrics snapshot API admin-only" },
  @{ Label = "smoke:monthly-report:pdf"; Script = "smoke:monthly-report:pdf"; NeedsApi = $true; NeedsWeb = $false; Boundary = "PDF generation path; storageKey hidden" }
)

$FullGateSteps = @(
  @{ Label = "smoke:puriva-readiness:local"; Script = "smoke:puriva-readiness:local"; NeedsApi = $true; NeedsWeb = $true; Boundary = "Puriva setup + full delivery + boundary (separate orchestrator)" },
  @{ Label = "smoke:pre-staging:local"; Script = "smoke:pre-staging:local"; NeedsApi = $true; NeedsWeb = $true; Boundary = "full local repo closeout orchestrator" }
)

$ForbiddenClientFields = @(
  "storageKey",
  "releasePackageId",
  "workflowRunId",
  "executionLog",
  "raw planJson",
  "raw reportJson",
  "contextPreview",
  "selectedSourcesJson",
  "contextSection",
  "approvedKnowledgeSection",
  "resultSnapshot",
  "executionLogPreview",
  "publicationHandoff",
  "adminSummaryNotes",
  "miHandoffId",
  "miContextDraft",
  "internal automation logs",
  "provider/model/gateway metadata",
  "raw prompt/context internals"
)

$AllowedClientProvenance = @(
  "performanceSummary.sourceType",
  "performanceSummary.manualSource",
  "performanceSummary.disclaimer",
  "performanceSummary.placeholderOnly"
)

function Add-LogLine([string]$Message) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $entry = "[$timestamp] $Message"
  $lines.Add($entry) | Out-Null
  Write-Host $entry
}

function Write-LogAndExit([int]$ExitCode) {
  $lines | Set-Content -Path $logPath -Encoding UTF8
  Write-Host "Staging readiness log: $logPath"
  if ($ExitCode -ne 0 -or -not $List) {
    notepad $logPath
  }
  exit $ExitCode
}

function Invoke-NpmRun {
  param(
    [string]$Label,
    [string]$ScriptName,
    [string]$OutputLogPath = ""
  )

  $safeLabel = ($Label -replace "[:\\/]", "-")
  $stamp = Get-Date -Format "yyyyMMdd-HHmmssfff"
  $stdoutPath = Join-Path $env:TEMP ("dca-staging-readiness-{0}-{1}.stdout.log" -f $safeLabel, $stamp)
  $stderrPath = Join-Path $env:TEMP ("dca-staging-readiness-{0}-{1}.stderr.log" -f $safeLabel, $stamp)

  if ($script:AuthSeedTestPassword) {
    $env:AUTH_SEED_TEST_PASSWORD = $script:AuthSeedTestPassword
  }

  $proc = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", $ScriptName `
    -WorkingDirectory (Get-Location).Path `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -NoNewWindow `
    -PassThru `
    -Wait

  $stdout = Get-Content -Path $stdoutPath -Raw -ErrorAction SilentlyContinue
  $stderr = Get-Content -Path $stderrPath -Raw -ErrorAction SilentlyContinue
  $combinedParts = @()
  if ($stdout) { $combinedParts += $stdout }
  if ($stderr) { $combinedParts += $stderr }
  $combinedText = ($combinedParts -join "`n").TrimEnd()

  if ($combinedText) {
    Write-Host $combinedText
  }

  if ($OutputLogPath) {
    $combinedText | Set-Content -Path $OutputLogPath -Encoding UTF8
  }

  return @{
    ExitCode = $proc.ExitCode
    CombinedOutput = $combinedText
  }
}

function Test-ValidateEpermOutput([string]$OutputText) {
  return ($OutputText -match "EPERM") -and ($OutputText -match "query_engine-windows\.dll\.node")
}

function Stop-ProgramFilesNodeProcessesForPrismaEperm {
  Add-LogLine "Prisma EPERM detected  -  stopping only C:\Program Files\nodejs\node.exe processes"
  $nodeProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue
  $stopped = @()
  foreach ($proc in $nodeProcesses) {
    if ($proc.ExecutablePath -and ($proc.ExecutablePath -ieq "C:\Program Files\nodejs\node.exe")) {
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
      $stopped += $proc.ProcessId
    }
  }
  if ($stopped.Count -eq 0) {
    Add-LogLine "No C:\Program Files\nodejs\node.exe processes found to stop (Cursor helpers left alone)"
  } else {
    Add-LogLine ("Stopped Program Files node.exe PIDs: {0}" -f ($stopped -join ", "))
  }
  Start-Sleep -Seconds 3
}

function Invoke-ValidateWithEpermRetry {
  Add-LogLine "RUN validate"
  $validateLog = Join-Path $env:TEMP ("dca-staging-readiness-validate-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
  $result = Invoke-NpmRun -Label "validate" -ScriptName "validate" -OutputLogPath $validateLog
  if ($result.ExitCode -eq 0) {
    Add-LogLine "PASS validate"
    return
  }

  if (-not (Test-ValidateEpermOutput $result.CombinedOutput)) {
    Add-LogLine "FAIL validate exit=$($result.ExitCode) (not EPERM)"
    Write-LogAndExit $result.ExitCode
  }

  Add-LogLine "validate failed with Prisma EPERM  -  one retry after stopping Program Files node.exe only"
  Stop-ProgramFilesNodeProcessesForPrismaEperm
  $retryLog = Join-Path $env:TEMP ("dca-staging-readiness-validate-retry-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
  $retryResult = Invoke-NpmRun -Label "validate-retry" -ScriptName "validate" -OutputLogPath $retryLog
  if ($retryResult.ExitCode -ne 0) {
    Add-LogLine "FAIL validate after EPERM retry exit=$($retryResult.ExitCode)"
    Write-LogAndExit $retryResult.ExitCode
  }
  Add-LogLine "PASS validate (after EPERM retry)"
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
  Write-LogAndExit 1
}

function Restart-LocalApiForSmoke([string]$Reason) {
  Add-LogLine $Reason
  $connections = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    if ($conn.OwningProcess -gt 0) {
      $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
      if ($proc -and $proc.Path -and ($proc.Path -ieq "C:\Program Files\nodejs\node.exe")) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
      }
    }
  }
  Start-Sleep -Seconds 3
  $env:TENANT_MODULE_ENFORCEMENT = "off"
  if ($script:AuthSeedTestPassword) {
    $env:AUTH_SEED_TEST_PASSWORD = $script:AuthSeedTestPassword
  }
  $apiOut = Join-Path $env:TEMP ("dca-staging-readiness-api-{0}.stdout.log" -f (Get-Date -Format "yyyyMMdd-HHmmssfff"))
  $apiErr = Join-Path $env:TEMP ("dca-staging-readiness-api-{0}.stderr.log" -f (Get-Date -Format "yyyyMMdd-HHmmssfff"))
  Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev:api" -WorkingDirectory (Get-Location).Path -RedirectStandardOutput $apiOut -RedirectStandardError $apiErr
  Wait-ForLocalApiReady
}

function Ensure-LocalWebForBrowserSmoke {
  $webListening = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $webListening) {
    Add-LogLine "Starting local web dev server on port 5173"
    $webOut = Join-Path $env:TEMP ("dca-staging-readiness-web-{0}.stdout.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
    $webErr = Join-Path $env:TEMP ("dca-staging-readiness-web-{0}.stderr.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
    Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev:web" -WorkingDirectory (Get-Location).Path -RedirectStandardOutput $webOut -RedirectStandardError $webErr
    Start-Sleep -Seconds 10
  } else {
    Add-LogLine "Web dev server already listening on port 5173"
  }
}

function Invoke-SmokeStep([hashtable]$Step) {
  if ($Step.NeedsApi -and -not (Test-LocalApiReady)) {
    Restart-LocalApiForSmoke ("Ensure local API before {0}" -f $Step.Label)
  }
  if ($Step.NeedsWeb) {
    Ensure-LocalWebForBrowserSmoke
  }

  Add-LogLine ("RUN {0}" -f $Step.Label)
  $result = Invoke-NpmRun -Label $Step.Label -ScriptName $Step.Script
  if ($result.ExitCode -ne 0) {
    Add-LogLine ("FAIL {0} exit={1}" -f $Step.Label, $result.ExitCode)
    Write-LogAndExit $result.ExitCode
  }
  Add-LogLine ("PASS {0}" -f $Step.Label)
}

function Show-PlannedPack {
  Add-LogLine "[STAGING_READINESS] Block B local proof pack (list mode  -  no smokes executed)"
  Add-LogLine "Log file (on run): $logPath"
  Add-LogLine ""
  Add-LogLine "Core sequence:"
  $index = 0
  foreach ($step in $CoreSteps) {
    Add-LogLine ("  {0}. {1}  -  {2}" -f $index, $step.Label, $step.Boundary)
    $index++
  }
  if ($IncludeOptional) {
    Add-LogLine ""
    Add-LogLine "Optional (-IncludeOptional):"
    foreach ($step in $OptionalSteps) {
      Add-LogLine ("  {0}. {1}  -  {2}" -f $index, $step.Label, $step.Boundary)
      $index++
    }
  }
  if ($IncludeFullGates) {
    Add-LogLine ""
    Add-LogLine "Full gates (-IncludeFullGates):"
    foreach ($step in $FullGateSteps) {
      Add-LogLine ("  {0}. {1}  -  {2}" -f $index, $step.Label, $step.Boundary)
      $index++
    }
  }
  Add-LogLine ""
  Add-LogLine "Forbidden on client surfaces (asserted by boundary smokes):"
  foreach ($field in $ForbiddenClientFields) {
    Add-LogLine ("  - {0}" -f $field)
  }
  Add-LogLine ""
  Add-LogLine "Allowed client metric provenance (monthly report performanceSummary only):"
  foreach ($field in $AllowedClientProvenance) {
    Add-LogLine ("  - {0}" -f $field)
  }
  Add-LogLine ""
  Add-LogLine "Requires: AUTH_SEED_TEST_PASSWORD in shell (min 8 chars, never printed)"
  Add-LogLine "Run: npm.cmd run smoke:staging-readiness:local"
  Add-LogLine "Optional flags: -IncludeOptional -IncludeFullGates"
  $lines | Set-Content -Path $logPath -Encoding UTF8
  Write-Host "Staging readiness list log: $logPath"
  notepad $logPath
  exit 0
}

if ($List) {
  Show-PlannedPack
}

Add-LogLine "[STAGING_READINESS] Block B local proof pack starting"
Add-LogLine "See docs/runbooks/STAGING_READINESS.md"
Add-LogLine "Recovery: Prisma EPERM stops only C:\Program Files\nodejs\node.exe; restart API on HTTP 429"

if (-not $env:AUTH_SEED_TEST_PASSWORD -or $env:AUTH_SEED_TEST_PASSWORD.Length -lt 8) {
  Add-LogLine "FAIL AUTH_SEED_TEST_PASSWORD must be set in shell (minimum 8 characters). Never commit or print it."
  Write-LogAndExit 1
}

$script:AuthSeedTestPassword = $env:AUTH_SEED_TEST_PASSWORD

try {
  Invoke-ValidateWithEpermRetry

  $isFirstApiStep = $true
  foreach ($step in $CoreSteps) {
    if ($step.Script -eq "validate") { continue }
    if ($isFirstApiStep -and $step.NeedsApi) {
      Restart-LocalApiForSmoke "Start local API with TENANT_MODULE_ENFORCEMENT=off for smoke suite"
      $isFirstApiStep = $false
    }
    if ($step.Label -eq "smoke:client-portal-monthly-report:browser") {
      Restart-LocalApiForSmoke "Restart local API to clear rate limits before browser smokes"
    }
    Invoke-SmokeStep $step
  }

  if ($IncludeOptional) {
    foreach ($step in $OptionalSteps) {
      Invoke-SmokeStep $step
    }
  }

  if ($IncludeFullGates) {
    foreach ($step in $FullGateSteps) {
      Invoke-SmokeStep $step
    }
  }

  Add-LogLine "[STAGING_READINESS] PASS  -  Block B local proof pack complete (no VPS deploy)"
  Write-LogAndExit 0
} catch {
  Add-LogLine ("[STAGING_READINESS] FAIL  -  {0}" -f $_.Exception.Message)
  Write-LogAndExit 1
}
