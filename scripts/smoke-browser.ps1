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

try {
  Write-Host "Running browser smoke tests..." -ForegroundColor Cyan
  npx playwright test --project=chromium
  if ($LASTEXITCODE -ne 0) {
    throw "Playwright chromium smoke tests failed."
  }

  Write-Pass "Browser smoke completed."
  exit 0
} catch {
  Write-Fail $_.Exception.Message
  exit 1
}