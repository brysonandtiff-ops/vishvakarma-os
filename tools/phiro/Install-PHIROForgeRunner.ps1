param(
  [Parameter(Mandatory=$true)]
  [string]$RegistrationToken,

  [string]$RepositoryUrl = 'https://github.com/brysonandtiff-ops/vishvakarma-os',
  [string]$RunnerName = 'PHIRO-FORGE-WIN-X64',
  [string]$RunnerRoot = 'C:\actions-runner',
  [string]$RunnerVersion = '2.336.0',
  [string]$RunnerSha256 = 'D59123A43003E357B0805B5D0F611D0BD2F65AB67D51BD070DD4E7A0F685C162',
  [switch]$InstallAsService
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Assert-Administrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Run this script from an elevated PowerShell session.'
  }
}

function Write-Step([string]$Message) {
  Write-Host "[PHIRO FORGE] $Message"
}

Assert-Administrator

if ([string]::IsNullOrWhiteSpace($RegistrationToken)) {
  throw 'RegistrationToken is required. Generate a fresh temporary token from GitHub Settings > Actions > Runners.'
}

if (-not (Test-Path $RunnerRoot)) {
  New-Item -ItemType Directory -Path $RunnerRoot | Out-Null
}

Set-Location $RunnerRoot

$zipName = "actions-runner-win-x64-$RunnerVersion.zip"
$zipPath = Join-Path $RunnerRoot $zipName
$downloadUrl = "https://github.com/actions/runner/releases/download/v$RunnerVersion/$zipName"

if (-not (Test-Path $zipPath)) {
  Write-Step "Downloading GitHub Actions Runner v$RunnerVersion"
  Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
}

Write-Step 'Verifying SHA-256 checksum'
$actualHash = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash.ToUpperInvariant()
if ($actualHash -ne $RunnerSha256.ToUpperInvariant()) {
  throw "Runner checksum mismatch. Expected $RunnerSha256, got $actualHash"
}

if (-not (Test-Path (Join-Path $RunnerRoot 'config.cmd'))) {
  Write-Step 'Extracting runner package'
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $RunnerRoot)
}

if (Test-Path (Join-Path $RunnerRoot '.runner')) {
  Write-Step 'Runner is already configured. Skipping registration.'
} else {
  Write-Step "Registering $RunnerName against $RepositoryUrl"
  & .\config.cmd `
    --unattended `
    --url $RepositoryUrl `
    --token $RegistrationToken `
    --name $RunnerName `
    --labels 'phiro-forge,windows,x64' `
    --work '_work' `
    --replace

  if ($LASTEXITCODE -ne 0) {
    throw "Runner registration failed with exit code $LASTEXITCODE"
  }
}

if ($InstallAsService) {
  Write-Step 'Installing runner as a Windows service'
  if (-not (Test-Path (Join-Path $RunnerRoot 'svc.cmd'))) {
    throw 'svc.cmd was not found after runner installation.'
  }

  & .\svc.cmd install
  if ($LASTEXITCODE -ne 0) { throw "Service install failed with exit code $LASTEXITCODE" }

  & .\svc.cmd start
  if ($LASTEXITCODE -ne 0) { throw "Service start failed with exit code $LASTEXITCODE" }

  Write-Step 'PHIRO Forge runner service started.'
} else {
  Write-Step 'Runner configured successfully.'
  Write-Host ''
  Write-Host 'Start it interactively with:'
  Write-Host "  Set-Location '$RunnerRoot'; .\run.cmd"
  Write-Host ''
  Write-Host 'Or rerun this script with -InstallAsService from elevated PowerShell.'
}

Write-Step 'Never commit or persist the temporary registration token.'
