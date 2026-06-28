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

Add-LogLine "Starting AI post-merge sanity pack"
Add-LogLine "Recovery: stop stale API for Prisma EPERM; restart API on 429 rate-limit; free ports 4000/5173 if busy"

if (-not $env:AUTH_SEED_TEST_PASSWORD) {
  Add-LogLine "FAIL AUTH_SEED_TEST_PASSWORD is required"
  $lines | Set-Content -Path $logPath -Encoding UTF8
  notepad $logPath
  exit 1
}

Invoke-SanityCommand "validate (check+build)" @("run", "check")
Invoke-SanityCommand "validate build" @("run", "build")
Invoke-SanityCommand "smoke:ai-provider-config:local" @("run", "smoke:ai-provider-config:local")
Invoke-SanityCommand "smoke:ai-operations:local" @("run", "smoke:ai-operations:local")
Invoke-SanityCommand "smoke:ai-operations:browser" @("run", "smoke:ai-operations:browser")
Invoke-SanityCommand "smoke:client-safe-ai-visibility:local" @("run", "smoke:client-safe-ai-visibility:local")
Invoke-SanityCommand "smoke:ai-matrix" @("run", "smoke:ai-matrix")

Add-LogLine "All AI post-merge sanity steps passed"
$lines | Set-Content -Path $logPath -Encoding UTF8
Write-Host "Sanity log: $logPath"
notepad $logPath
