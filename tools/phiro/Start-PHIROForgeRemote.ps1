$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Assert-Administrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host '[PHIRO PRISM] Elevation required. Re-launching PowerShell as Administrator...'
    $self = $MyInvocation.MyCommand.Path
    Start-Process powershell.exe -Verb RunAs -ArgumentList @(
      '-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $self + '"')
    ) -Wait
    exit $LASTEXITCODE
  }
}

Assert-Administrator

Write-Host ''
Write-Host '============================================='
Write-Host '  PHIRO PRISM :: REMOTE FORGE BOOTSTRAP'
Write-Host '============================================='
Write-Host '[PHIRO PRISM] Trusted Windows host confirmed.'
Write-Host '[PHIRO PRISM] Registration token is never written to disk.'
Write-Host ''

$secureToken = Read-Host 'Paste fresh GitHub runner registration token' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if ([string]::IsNullOrWhiteSpace($token)) {
  throw 'Registration token cannot be empty.'
}

$installerUrl = 'https://raw.githubusercontent.com/brysonandtiff-ops/vishvakarma-os/feat/phiro-forge-self-hosted-runner/tools/phiro/Install-PHIROForgeRunner.ps1'
$installerPath = Join-Path $env:TEMP 'Install-PHIROForgeRunner.ps1'

Write-Host '[PHIRO PRISM] Fetching hardened runner installer from PR #148 branch...'
Invoke-WebRequest -UseBasicParsing -Uri $installerUrl -OutFile $installerPath

try {
  & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $installerPath -RegistrationToken $token -InstallAsService
  if ($LASTEXITCODE -ne 0) {
    throw "Runner bootstrap failed with exit code $LASTEXITCODE"
  }
} finally {
  $token = $null
  Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
}

$runnerFile = 'C:\actions-runner\.runner'
if (-not (Test-Path $runnerFile)) {
  throw 'Runner registration evidence file was not created.'
}

$svc = Get-Service | Where-Object { $_.Name -like 'actions.runner.*' -or $_.DisplayName -like 'GitHub Actions Runner*' } | Select-Object -First 1
if (-not $svc) {
  throw 'GitHub Actions Runner Windows service was not found.'
}

if ($svc.Status -ne 'Running') {
  Start-Service $svc.Name
  $svc.WaitForStatus('Running', [TimeSpan]::FromSeconds(20))
}

Write-Host ''
Write-Host 'PHIRO_FORGE_BOOTSTRAP_COMPLETE=true'
Write-Host "PHIRO_FORGE_SERVICE=$($svc.Name)"
Write-Host "PHIRO_FORGE_SERVICE_STATUS=$((Get-Service $svc.Name).Status)"
Write-Host '[PHIRO PRISM] Return to GitHub Actions and run PHIRO Forge Smoke.'
