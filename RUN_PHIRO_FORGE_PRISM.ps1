[CmdletBinding()]
param(
  [switch]$InstallAsService = $true
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Prism([string]$Message) {
  Write-Host "[PRISM // PHIRO FORGE] $Message"
}

function Test-Administrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$installer = Join-Path $repoRoot 'tools\phiro\Install-PHIROForgeRunner.ps1'

if (-not (Test-Path $installer)) {
  throw "PHIRO Forge installer not found: $installer"
}

if (-not (Test-Administrator)) {
  Write-Prism 'Elevation required. Re-launching as Administrator.'
  $argList = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', ('"{0}"' -f $MyInvocation.MyCommand.Path)
  )
  if ($InstallAsService) { $argList += '-InstallAsService' }
  Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList ($argList -join ' ')
  exit 0
}

Write-Host ''
Write-Host '============================================================'
Write-Host '  PRISM // PHIRO FORGE RUNNER BOOTSTRAP'
Write-Host '============================================================'
Write-Host 'Repository : brysonandtiff-ops/vishvakarma-os'
Write-Host 'Runner     : PHIRO-FORGE-WIN-X64'
Write-Host 'Labels     : self-hosted, Windows, X64, phiro-forge'
Write-Host ''
Write-Host 'Generate a FRESH temporary token from:'
Write-Host 'GitHub -> Vishvakarma.OS -> Settings -> Actions -> Runners -> New self-hosted runner'
Write-Host ''

$secureToken = Read-Host 'Paste the fresh runner registration token' -AsSecureString
$tokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $registrationToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPtr)
  if ([string]::IsNullOrWhiteSpace($registrationToken)) {
    throw 'Registration token was empty.'
  }

  Write-Prism 'Starting guarded PHIRO Forge installation.'
  & $installer -RegistrationToken $registrationToken -InstallAsService:$InstallAsService
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    throw "Installer returned exit code $LASTEXITCODE"
  }
} finally {
  if ($tokenPtr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPtr)
  }
  $registrationToken = $null
}

$runnerRoot = 'C:\actions-runner'
$runnerFile = Join-Path $runnerRoot '.runner'
if (-not (Test-Path $runnerFile)) {
  throw 'Runner registration evidence (.runner) was not found after installation.'
}

Write-Prism 'Local registration evidence found.'
Write-Prism 'Open GitHub -> Settings -> Actions -> Runners and confirm PHIRO-FORGE-WIN-X64 is Online/Idle.'
Write-Prism 'PR #148 smoke workflow is the authoritative remote proof.'
Write-Host ''
Write-Host 'PHIRO_FORGE_BOOTSTRAP_COMPLETE=true'
Write-Host ''
Read-Host 'Press Enter to close' | Out-Null
