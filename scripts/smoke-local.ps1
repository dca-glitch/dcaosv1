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
  Write-Host "Running git status..." -ForegroundColor Cyan
  git status --short --branch
  if ($LASTEXITCODE -ne 0) {
    throw "git status failed."
  }
  Write-Pass "git status completed."

  Write-Host "Running npm run validate..." -ForegroundColor Cyan
  npm run validate
  if ($LASTEXITCODE -ne 0) {
    throw "npm run validate failed."
  }
  Write-Pass "npm run validate completed."

  Write-Host "Checking API health..." -ForegroundColor Cyan
  $response = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/health" -Method Get -TimeoutSec 10
  if (-not $response) {
    throw "API health returned an empty response."
  }
  Write-Pass "API health endpoint responded."

  Write-Pass "Local smoke completed."
  exit 0
} catch {
  Write-Fail $_.Exception.Message
  exit 1
}