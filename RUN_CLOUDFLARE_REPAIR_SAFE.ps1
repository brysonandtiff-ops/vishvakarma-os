[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$ProjectName = "vishvakarma-os",
    [int]$MaxAttempts = 3,
    [int]$RetryDelaySeconds = 20,
    [switch]$ResetVault,
    [switch]$ResetAuthSession,
    [switch]$NonInteractive,
    [switch]$SkipSupabaseConfigPush,
    [switch]$SkipCloudflareDeploy,
    [switch]$SkipBrowserInstall,
    [switch]$NoSelfUpdate
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Autopilot = Join-Path $RepoRoot "RUN_CLOUDFLARE_AUTOPILOT.ps1"

if (-not (Test-Path $Autopilot)) {
    throw "Missing Cloudflare autopilot: $Autopilot"
}

$Forward = @{
    PagesUrl = $PagesUrl
    ProjectName = $ProjectName
    MaxAttempts = $MaxAttempts
    RetryDelaySeconds = $RetryDelaySeconds
}
if ($ResetVault) { $Forward.ResetVault = $true }
if ($ResetAuthSession) { $Forward.ResetAuthSession = $true }
if ($NonInteractive) { $Forward.NonInteractive = $true }
if ($SkipSupabaseConfigPush) { $Forward.SkipSupabaseConfigPush = $true }
if ($SkipCloudflareDeploy) { $Forward.SkipCloudflareDeploy = $true }
if ($SkipBrowserInstall) { $Forward.SkipBrowserInstall = $true }
if ($NoSelfUpdate) { $Forward.NoSelfUpdate = $true }

& $Autopilot @Forward
$global:LASTEXITCODE = $LASTEXITCODE
