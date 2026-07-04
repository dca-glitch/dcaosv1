# Production Readiness Local Closeout Pack (Mega Block 1)
# Focused deterministic delivery + MI + handoff + client boundary proof.
# Local only. No VPS/staging/production. No secrets printed.

param(
  [switch]$List,
  [switch]$SkipValidate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location C:\dcaosv1

$logPath = Join-Path $env:TEMP ("dca-production-readiness-closeout-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
$lines = New-Object System.Collections.Generic.List[string]
$passed = New-Object System.Collections.Generic.List[string]
$failed = New-Object System.Collections.Generic.List[string]
$skipped = New-Object System.Collections.Generic.List[string]
$script:ResolvedWebBaseUrl = $null

function Add-LogLine([string]$Message) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $entry = "[$timestamp] $Message"
  $lines.Add($entry) | Out-Null
  Write-Host $entry
}

function Write-SummaryAndExit([int]$ExitCode) {
  Add-LogLine ""
  Add-LogLine "=== CLOSEOUT SUMMARY ==="
  Add-LogLine ("Result: {0}" -f $(if ($ExitCode -eq 0) { "PASS" } else { "FAIL" }))
  Add-LogLine ("Passed ({0}):" -f $passed.Count)
  foreach ($item in $passed) { Add-LogLine ("  PASS  {0}" -f $item) }
  if ($skipped.Count -gt 0) {
    Add-LogLine ("Skipped ({0}):" -f $skipped.Count)
    foreach ($item in $skipped) { Add-LogLine ("  SKIP  {0}" -f $item) }
  }
  if ($failed.Count -gt 0) {
    Add-LogLine ("Failed ({0}):" -f $failed.Count)
    foreach ($item in $failed) { Add-LogLine ("  FAIL  {0}" -f $item) }
  }
  Add-LogLine ""
  Add-LogLine "Rate-limit note: login limit is 10 per 15 min per IP. Orchestrator restarts API between browser batches."
  Add-LogLine "Expected skips: AUTH_SEED_TESTER_EMAIL absent (client approval path); R2 strict roundtrip without R2 env; WordPress live publish disabled by design."
  Add-LogLine "Log file: $logPath"
  $lines | Set-Content -Path $logPath -Encoding UTF8
  notepad $logPath
  exit $ExitCode
}

function Invoke-ExternalCommand {
  param(
    [string]$Label,
    [string]$FilePath,
    [string[]]$ArgumentList,
    [string]$OutputLogPath = ""
  )

  $safeLabel = ($Label -replace "[:\\/]", "-")
  $stamp = Get-Date -Format "yyyyMMdd-HHmmssfff"
  $stdoutPath = Join-Path $env:TEMP ("dca-prod-readiness-{0}-{1}.stdout.log" -f $safeLabel, $stamp)
  $stderrPath = Join-Path $env:TEMP ("dca-prod-readiness-{0}-{1}.stderr.log" -f $safeLabel, $stamp)

  if ($script:AuthSeedTestPassword) {
    $env:AUTH_SEED_TEST_PASSWORD = $script:AuthSeedTestPassword
  }
  if ($script:ResolvedWebBaseUrl) {
    $env:MVP_SMOKE_WEB_BASE_URL = $script:ResolvedWebBaseUrl
  }

  $proc = Start-Process -FilePath $FilePath `
    -ArgumentList $ArgumentList `
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

function Invoke-NpmRun {
  param(
    [string]$Label,
    [string]$ScriptName,
    [string]$OutputLogPath = ""
  )

  return Invoke-ExternalCommand -Label $Label -FilePath "npm.cmd" -ArgumentList @("run", $ScriptName) -OutputLogPath $OutputLogPath
}

function Invoke-NodeRun {
  param(
    [string]$Label,
    [string]$ScriptPath,
    [string]$OutputLogPath = ""
  )

  return Invoke-ExternalCommand -Label $Label -FilePath "node" -ArgumentList @($ScriptPath) -OutputLogPath $OutputLogPath
}

function Test-RateLimitOutput([string]$OutputText) {
  return ($OutputText -match "\b429\b") -or ($OutputText -match "RATE_LIMITED") -or ($OutputText -match "admin login - 429")
}

function Test-ValidateEpermOutput([string]$OutputText) {
  return ($OutputText -match "EPERM") -and ($OutputText -match "query_engine-windows\.dll\.node")
}

function Stop-ProgramFilesNodeProcessesForPrismaEperm {
  Add-LogLine "Prisma EPERM detected - stopping only C:\Program Files\nodejs\node.exe processes"
  $nodeProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue
  $stopped = @()
  foreach ($proc in $nodeProcesses) {
    if ($proc.ExecutablePath -and ($proc.ExecutablePath -ieq "C:\Program Files\nodejs\node.exe")) {
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
      $stopped += $proc.ProcessId
    }
  }
  if ($stopped.Count -eq 0) {
    Add-LogLine "No C:\Program Files\nodejs\node.exe processes found to stop"
  } else {
    Add-LogLine ("Stopped Program Files node.exe PIDs: {0}" -f ($stopped -join ", "))
  }
  Start-Sleep -Seconds 3
}

function Invoke-ValidateWithEpermRetry {
  Add-LogLine "RUN validate"
  $validateLog = Join-Path $env:TEMP ("dca-prod-readiness-validate-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
  $result = Invoke-NpmRun -Label "validate" -ScriptName "validate" -OutputLogPath $validateLog
  if ($result.ExitCode -eq 0) {
    $passed.Add("validate") | Out-Null
    Add-LogLine "PASS validate"
    return
  }

  if (-not (Test-ValidateEpermOutput $result.CombinedOutput)) {
    $failed.Add("validate") | Out-Null
    Add-LogLine "FAIL validate exit=$($result.ExitCode)"
    Write-SummaryAndExit $result.ExitCode
  }

  Add-LogLine "validate failed with Prisma EPERM - one retry after stopping Program Files node.exe only"
  Stop-ProgramFilesNodeProcessesForPrismaEperm
  $retryLog = Join-Path $env:TEMP ("dca-prod-readiness-validate-retry-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
  $retryResult = Invoke-NpmRun -Label "validate-retry" -ScriptName "validate" -OutputLogPath $retryLog
  if ($retryResult.ExitCode -ne 0) {
    $failed.Add("validate") | Out-Null
    Add-LogLine "FAIL validate after EPERM retry exit=$($retryResult.ExitCode)"
    Write-SummaryAndExit $retryResult.ExitCode
  }
  $passed.Add("validate") | Out-Null
  Add-LogLine "PASS validate (after EPERM retry)"
}

function Invoke-GitDiffCheck {
  Add-LogLine "RUN git diff --check"
  $diffLog = Join-Path $env:TEMP ("dca-prod-readiness-git-diff-check-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
  $prevErrorPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $output = & git diff --check 2>&1
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $prevErrorPreference
  if ($output) {
    $output | Out-String | Set-Content -Path $diffLog -Encoding UTF8
  } else {
    "" | Set-Content -Path $diffLog -Encoding UTF8
  }
  if ($exitCode -ne 0) {
    $failed.Add("git diff --check") | Out-Null
    Add-LogLine "FAIL git diff --check exit=$exitCode"
    Write-SummaryAndExit $exitCode
  }
  $passed.Add("git diff --check") | Out-Null
  Add-LogLine "PASS git diff --check"
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
  $failed.Add("local API readiness") | Out-Null
  Add-LogLine "FAIL Local API did not become ready on port 4000 within 45 seconds"
  Write-SummaryAndExit 1
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
  $apiOut = Join-Path $env:TEMP ("dca-prod-readiness-api-{0}.stdout.log" -f (Get-Date -Format "yyyyMMdd-HHmmssfff"))
  $apiErr = Join-Path $env:TEMP ("dca-prod-readiness-api-{0}.stderr.log" -f (Get-Date -Format "yyyyMMdd-HHmmssfff"))
  Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev:api") -WorkingDirectory (Get-Location).Path -RedirectStandardOutput $apiOut -RedirectStandardError $apiErr
  Wait-ForLocalApiReady
}

function Test-WebUrlReady([string]$Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    return ($response.StatusCode -eq 200)
  } catch {
    return $false
  }
}

function Get-LocalWebCandidatePorts {
  $ports = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -ge 5173 -and $_.LocalPort -le 5195 } |
    Select-Object -ExpandProperty LocalPort -Unique |
    Sort-Object
  if ($ports) {
    return $ports
  }
  return 5173..5195
}

function Resolve-LocalWebBaseUrl {
  if ($script:ResolvedWebBaseUrl) {
    return $script:ResolvedWebBaseUrl
  }

  foreach ($port in (Get-LocalWebCandidatePorts)) {
    foreach ($hostName in @("127.0.0.1", "localhost")) {
      $candidate = "http://${hostName}:$port/"
      if (Test-WebUrlReady $candidate) {
        $script:ResolvedWebBaseUrl = "http://${hostName}:$port"
        Add-LogLine "Resolved web dev server: $script:ResolvedWebBaseUrl"
        return $script:ResolvedWebBaseUrl
      }
    }
  }

  return $null
}

function Ensure-LocalWebForBrowserSmoke {
  $resolved = Resolve-LocalWebBaseUrl
  if ($resolved) {
    $env:MVP_SMOKE_WEB_BASE_URL = $resolved
    return
  }

  Add-LogLine "Starting local web dev server (prefer port 5173)"
  $webOut = Join-Path $env:TEMP ("dca-prod-readiness-web-{0}.stdout.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
  $webErr = Join-Path $env:TEMP ("dca-prod-readiness-web-{0}.stderr.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
  Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev:web") -WorkingDirectory (Get-Location).Path -RedirectStandardOutput $webOut -RedirectStandardError $webErr
  Start-Sleep -Seconds 8

  $deadline = (Get-Date).AddSeconds(90)
  do {
    Start-Sleep -Seconds 2
    $resolved = Resolve-LocalWebBaseUrl
    if ($resolved) {
      $env:MVP_SMOKE_WEB_BASE_URL = $resolved
      return
    }

    $webLogText = ""
    if (Test-Path $webOut) {
      $webLogText = Get-Content -Path $webOut -Raw -ErrorAction SilentlyContinue
    }
    if ($webLogText -match "Local:\s+http://[^:]+:(\d+)/") {
      $parsedPort = [int]$Matches[1]
      $parsedUrl = "http://127.0.0.1:$parsedPort/"
      if (Test-WebUrlReady $parsedUrl) {
        $script:ResolvedWebBaseUrl = "http://127.0.0.1:$parsedPort"
        $env:MVP_SMOKE_WEB_BASE_URL = $script:ResolvedWebBaseUrl
        Add-LogLine "Resolved web dev server from Vite log: $script:ResolvedWebBaseUrl"
        return
      }
    }
  } while ((Get-Date) -lt $deadline)

  $failed.Add("local web readiness") | Out-Null
  Add-LogLine "FAIL Local web dev server did not become ready on ports 5173-5195 within 90 seconds"
  Write-SummaryAndExit 1
}

function Test-ShouldSkipStep([hashtable]$Step) {
  if ($Step.ContainsKey("SkipIf") -and $Step.SkipIf -eq "no-client-tester") {
    return (-not $env:AUTH_SEED_TESTER_EMAIL)
  }
  if ($Step.ContainsKey("SkipIf") -and $Step.SkipIf -eq "r2-strict-unconfigured") {
    if ($env:SMOKE_EXPECT_R2_ROUNDTRIP -ne "true") { return $false }
    $required = @("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME")
    foreach ($name in $required) {
      $value = (Get-Item -Path "env:$name" -ErrorAction SilentlyContinue).Value
      if (-not $value) { return $true }
    }
  }
  return $false
}

function Get-SkipReason([hashtable]$Step) {
  if ($Step.ContainsKey("SkipIf") -and $Step.SkipIf -eq "no-client-tester") {
    return "AUTH_SEED_TESTER_EMAIL not set - client approval happy-path deferred"
  }
  if ($Step.ContainsKey("SkipIf") -and $Step.SkipIf -eq "r2-strict-unconfigured") {
    return "SMOKE_EXPECT_R2_ROUNDTRIP=true but R2 env not configured"
  }
  return "optional step skipped"
}

function Invoke-SmokeStep([hashtable]$Step) {
  if (Test-ShouldSkipStep $Step) {
    $reason = Get-SkipReason $Step
    $skipped.Add("$($Step.Label) - $reason") | Out-Null
    Add-LogLine "SKIP $($Step.Label) - $reason"
    return
  }

  if ($Step.NeedsApi -and -not (Test-LocalApiReady)) {
    Restart-LocalApiForSmoke ("Ensure local API before {0}" -f $Step.Label)
  }
  if ($Step.NeedsWeb) {
    Ensure-LocalWebForBrowserSmoke
  }

  Add-LogLine ("RUN {0}" -f $Step.Label)
  $result = $null
  if ($Step.Kind -eq "npm") {
    $result = Invoke-NpmRun -Label $Step.Label -ScriptName $Step.Script
  } elseif ($Step.Kind -eq "node") {
    $result = Invoke-NodeRun -Label $Step.Label -ScriptPath $Step.Script
  } else {
    throw "Unknown step kind for $($Step.Label)"
  }

  if ($result.ExitCode -ne 0 -and (Test-RateLimitOutput $result.CombinedOutput)) {
    Add-LogLine "Rate limit detected for $($Step.Label) - restarting API and retrying once"
    Restart-LocalApiForSmoke "Clear login rate limits before retrying $($Step.Label)"
    if ($Step.NeedsWeb) { Ensure-LocalWebForBrowserSmoke }
    $result = if ($Step.Kind -eq "npm") {
      Invoke-NpmRun -Label ($Step.Label + "-retry") -ScriptName $Step.Script
    } else {
      Invoke-NodeRun -Label ($Step.Label + "-retry") -ScriptPath $Step.Script
    }
  }

  if ($result.ExitCode -ne 0) {
    $failed.Add($Step.Label) | Out-Null
    Add-LogLine ("FAIL {0} exit={1}" -f $Step.Label, $result.ExitCode)
    Write-SummaryAndExit $result.ExitCode
  }

  $passed.Add($Step.Label) | Out-Null
  Add-LogLine ("PASS {0}" -f $Step.Label)

  if ($Step.ContainsKey("Note") -and $Step.Note) {
    Add-LogLine ("NOTE {0}" -f $Step.Note)
  }
}

$CloseoutSteps = @(
  @{ Label = "smoke-ai-delivery-revenue-engine-local"; Kind = "node"; Script = "scripts/smoke-ai-delivery-revenue-engine-local.mjs"; NeedsApi = $true; NeedsWeb = $false; Group = "AI Delivery" }
  @{ Label = "smoke:ai-delivery-reviews"; Kind = "npm"; Script = "smoke:ai-delivery-reviews"; NeedsApi = $true; NeedsWeb = $true; Group = "AI Delivery" }
  @{ Label = "smoke-mi-core-execution-local"; Kind = "node"; Script = "scripts/smoke-mi-core-execution-local.mjs"; NeedsApi = $true; NeedsWeb = $false; Group = "Market Intelligence" }
  @{ Label = "smoke-mi-summary-delivery-integration-local"; Kind = "node"; Script = "scripts/smoke-mi-summary-delivery-integration-local.mjs"; NeedsApi = $true; NeedsWeb = $false; Group = "Market Intelligence" }
  @{ Label = "smoke-mi-operator-hardening-local"; Kind = "node"; Script = "scripts/smoke-mi-operator-hardening-local.mjs"; NeedsApi = $true; NeedsWeb = $false; Group = "Market Intelligence"; RestartApiBefore = $true }
  @{ Label = "smoke:ai-market-intelligence"; Kind = "npm"; Script = "smoke:ai-market-intelligence"; NeedsApi = $true; NeedsWeb = $false; Group = "Market Intelligence" }
  @{ Label = "smoke-delivery-handoff-readiness-local"; Kind = "node"; Script = "scripts/smoke-delivery-handoff-readiness-local.mjs"; NeedsApi = $true; NeedsWeb = $false; Group = "Delivery handoff"; RestartApiBefore = $true }
  @{ Label = "smoke-client-final-visibility-local"; Kind = "node"; Script = "scripts/smoke-client-final-visibility-local.mjs"; NeedsApi = $true; NeedsWeb = $false; Group = "Delivery handoff"; SkipIf = "no-client-tester" }
  @{ Label = "smoke:wordpress-publish:local"; Kind = "npm"; Script = "smoke:wordpress-publish:local"; NeedsApi = $true; NeedsWeb = $false; Group = "Delivery handoff"; Note = "Expected: provider_disabled when WORDPRESS_PUBLISH_ENABLED is off" }
  @{ Label = "smoke:r2-byte-roundtrip:local"; Kind = "npm"; Script = "smoke:r2-byte-roundtrip:local"; NeedsApi = $true; NeedsWeb = $false; Group = "Delivery handoff"; Note = "Expected: disabled guard when R2 env absent; strict roundtrip requires R2 env + SMOKE_EXPECT_R2_ROUNDTRIP=true" }
  @{ Label = "smoke:puriva-client-portal-boundary:local"; Kind = "npm"; Script = "smoke:puriva-client-portal-boundary:local"; NeedsApi = $true; NeedsWeb = $true; Group = "Client Portal"; RestartApiBefore = $true }
  @{ Label = "smoke:client-portal:local"; Kind = "npm"; Script = "smoke:client-portal:local"; NeedsApi = $true; NeedsWeb = $false; Group = "Client Portal" }
  @{ Label = "smoke:monthly-report:mi-context"; Kind = "npm"; Script = "smoke:monthly-report:mi-context"; NeedsApi = $true; NeedsWeb = $false; Group = "Monthly Report" }
  @{ Label = "smoke:ai-delivery-workflow:browser"; Kind = "npm"; Script = "smoke:ai-delivery-workflow:browser"; NeedsApi = $true; NeedsWeb = $true; Group = "Browser"; RestartApiBefore = $true }
  @{ Label = "smoke:mi-operator:browser"; Kind = "npm"; Script = "smoke:mi-operator:browser"; NeedsApi = $true; NeedsWeb = $true; Group = "Browser" }
  @{ Label = "smoke-mi-summary-delivery-browser-local"; Kind = "node"; Script = "scripts/smoke-mi-summary-delivery-browser-local.mjs"; NeedsApi = $true; NeedsWeb = $true; Group = "Browser" }
  @{ Label = "smoke:client-portal:browser"; Kind = "npm"; Script = "smoke:client-portal:browser"; NeedsApi = $true; NeedsWeb = $true; Group = "Browser"; RestartApiBefore = $true }
  @{ Label = "smoke:client-portal-monthly-report:browser"; Kind = "npm"; Script = "smoke:client-portal-monthly-report:browser"; NeedsApi = $true; NeedsWeb = $true; Group = "Browser" }
  @{ Label = "smoke:monthly-report:browser"; Kind = "npm"; Script = "smoke:monthly-report:browser"; NeedsApi = $true; NeedsWeb = $true; Group = "Browser" }
)

function Show-PlannedPack {
  Add-LogLine "[PRODUCTION_READINESS] Local closeout pack (list mode - no smokes executed)"
  Add-LogLine "Command: npm.cmd run smoke:production-readiness:local"
  Add-LogLine "Log file (on run): $logPath"
  Add-LogLine ""
  Add-LogLine "Core:"
  Add-LogLine "  0. validate (unless -SkipValidate)"
  Add-LogLine "  1. git diff --check"
  $index = 2
  foreach ($step in $CloseoutSteps) {
    $skip = ""
    if ($step.ContainsKey("SkipIf")) { $skip = " [optional skip]" }
  Add-LogLine ("  {0}. {1} ({2}){3}" -f $index, $step.Label, $step.Group, $skip)
    $index++
  }
  Add-LogLine ""
  Add-LogLine "Requires: AUTH_SEED_TEST_PASSWORD in shell (min 8 chars, never printed)"
  Add-LogLine "Optional: AUTH_SEED_TESTER_EMAIL, R2_* + SMOKE_EXPECT_R2_ROUNDTRIP=true"
  $lines | Set-Content -Path $logPath -Encoding UTF8
  notepad $logPath
  exit 0
}

if ($List) {
  Show-PlannedPack
}

Add-LogLine "[PRODUCTION_READINESS] Mega Block 1 local closeout pack starting"
Add-LogLine "See docs/runbooks/PRE_STAGING_VALIDATION_GATE.md"

if (-not $env:AUTH_SEED_TEST_PASSWORD -or $env:AUTH_SEED_TEST_PASSWORD.Length -lt 8) {
  Add-LogLine "FAIL AUTH_SEED_TEST_PASSWORD must be set in shell (minimum 8 characters). Never commit or print it."
  Write-SummaryAndExit 1
}

$script:AuthSeedTestPassword = $env:AUTH_SEED_TEST_PASSWORD

try {
  if (-not $SkipValidate) {
    Invoke-ValidateWithEpermRetry
  } else {
    Add-LogLine "SKIP validate (-SkipValidate)"
    $skipped.Add("validate (-SkipValidate)") | Out-Null
  }

  Invoke-GitDiffCheck

  Restart-LocalApiForSmoke "Start local API with TENANT_MODULE_ENFORCEMENT=off for closeout pack"

  foreach ($step in $CloseoutSteps) {
    if ($step.ContainsKey("RestartApiBefore") -and $step.RestartApiBefore) {
      Restart-LocalApiForSmoke ("Restart local API before browser batch step: {0}" -f $step.Label)
    }
    Invoke-SmokeStep $step
  }

  Add-LogLine "[PRODUCTION_READINESS] PASS - local closeout pack complete (no VPS deploy)"
  Write-SummaryAndExit 0
} catch {
  $failed.Add("orchestrator exception") | Out-Null
  Add-LogLine ("[PRODUCTION_READINESS] FAIL - {0}" -f $_.Exception.Message)
  Write-SummaryAndExit 1
}
