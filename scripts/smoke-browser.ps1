Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Pass {
  param([string]$Message)
  Write-Host "PASS: $Message" -ForegroundColor Green
}

function Write-Fail {
  param([string]$Message)
  Write-Host "FAIL: $Message" -ForegroundColor Red
}

function Test-WebReady {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

function Write-WebDiagnosticLog {
  param(
    [string]$LogPath,
    [string]$WebStdoutPath,
    [string]$WebStderrPath
  )

  "DCA browser smoke web diagnostic" | Out-File -FilePath $LogPath -Encoding utf8
  ("Timestamp: " + (Get-Date).ToString("o")) | Add-Content $LogPath
  "" | Add-Content $LogPath
  "=== Get-NetTCPConnection ports 4000/5173 ===" | Add-Content $LogPath
  Get-NetTCPConnection -LocalPort 4000,5173 -ErrorAction SilentlyContinue | Format-Table -AutoSize | Out-String | Add-Content $LogPath
  "" | Add-Content $LogPath
  "=== node/npm processes ===" | Add-Content $LogPath
  Get-Process node,npm -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,Path,StartTime | Format-Table -AutoSize | Out-String | Add-Content $LogPath
  "" | Add-Content $LogPath
  "=== http://localhost:5173/ readiness ===" | Add-Content $LogPath
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5
    ("StatusCode: " + $response.StatusCode) | Add-Content $LogPath
    ("ContentLength: " + $response.Content.Length) | Add-Content $LogPath
  } catch {
    ("ERROR: " + $_.Exception.Message) | Add-Content $LogPath
  }
  "" | Add-Content $LogPath
  ("Vite stdout: " + $WebStdoutPath) | Add-Content $LogPath
  ("Vite stderr: " + $WebStderrPath) | Add-Content $LogPath
}

function Ensure-WebReadyForBrowserSmoke {
  if (Test-WebReady) {
    return
  }

  Write-Host "Starting local web dev server for browser smoke..." -ForegroundColor Cyan
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $webStdout = Join-Path $env:TEMP ("dca-smoke-web-" + $timestamp + ".out.log")
  $webStderr = Join-Path $env:TEMP ("dca-smoke-web-" + $timestamp + ".err.log")
  $diagnosticLog = Join-Path $env:TEMP ("dca-smoke-web-diagnostic-" + $timestamp + ".log")
  $webProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev:web" -WorkingDirectory (Get-Location).Path -RedirectStandardOutput $webStdout -RedirectStandardError $webStderr -PassThru

  $deadline = (Get-Date).AddSeconds(60)
  do {
    Start-Sleep -Seconds 2
    if ($webProcess.HasExited) {
      Write-WebDiagnosticLog -LogPath $diagnosticLog -WebStdoutPath $webStdout -WebStderrPath $webStderr
      notepad.exe $diagnosticLog
      throw "Local web dev server exited before readiness. Diagnostic log: $diagnosticLog"
    }
    if (Test-WebReady) {
      return
    }
  } while ((Get-Date) -lt $deadline)

  Write-WebDiagnosticLog -LogPath $diagnosticLog -WebStdoutPath $webStdout -WebStderrPath $webStderr
  notepad.exe $diagnosticLog
  throw "Local web dev server did not become ready at http://localhost:5173/ within 60 seconds. Diagnostic log: $diagnosticLog"
}

try {
  Ensure-WebReadyForBrowserSmoke

  Write-Host "Running browser smoke tests..." -ForegroundColor Cyan
  node scripts/smoke-browser-local.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "Browser smoke script failed."
  }

  Write-Pass "Browser smoke completed."
  exit 0
} catch {
  Write-Fail $_.Exception.Message
  exit 1
}
