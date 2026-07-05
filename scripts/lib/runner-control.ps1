Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-RunnerControlLogPath {
  param(
    [string]$Prefix = "dca-runner-control"
  )

  return Join-Path $env:TEMP ("{0}-{1}.log" -f $Prefix, (Get-Date -Format "yyyyMMdd-HHmmss"))
}

function Invoke-LoggedNativeStep {
  param(
    [Parameter(Mandatory)]
    [string]$Label,

    [Parameter(Mandatory)]
    [scriptblock]$Command,

    [Parameter(Mandatory)]
    [string]$LogPath
  )

  Write-Host "RUN: $Label" -ForegroundColor Cyan
  & $Command 2>&1 | Tee-Object -FilePath $LogPath -Append
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "$Label failed with exit code $exitCode."
  }
}

function Assert-WorkingTreeClean {
  param(
    [Parameter(Mandatory)]
    [string]$LogPath
  )

  $status = git status --porcelain
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "git status failed with exit code $exitCode."
  }

  if ($status) {
    $status | Tee-Object -FilePath $LogPath -Append
    throw "working tree is not clean."
  }
}

function Open-RunnerControlLog {
  param(
    [Parameter(Mandatory)]
    [string]$LogPath
  )

  if (Test-Path $LogPath) {
    notepad $LogPath
  }
}
