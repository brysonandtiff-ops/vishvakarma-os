[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$ProjectName = "vishvakarma-os",
    [int]$MaxAttempts = 3,
    [int]$RetryDelaySeconds = 20,
    [int]$MinimumFreeDiskGB = 3,
    [switch]$ResetVault,
    [switch]$ResetAuthSession,
    [switch]$NonInteractive,
    [switch]$SkipSupabaseConfigPush,
    [switch]$SkipCloudflareDeploy,
    [switch]$SkipBrowserInstall,
    [switch]$ForceUnlock,
    [switch]$PreflightOnly,
    [switch]$DisableAutoRollback
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Master = Join-Path $RepoRoot "RUN_VISH_CLOUDFLARE.ps1"

if (-not (Test-Path $Master)) {
    throw "Missing Vish Cloudflare master runner: $Master"
}

$Forward = @{
    PagesUrl = $PagesUrl
    ProjectName = $ProjectName
    MaxAttempts = $MaxAttempts
    RetryDelaySeconds = $RetryDelaySeconds
    MinimumFreeDiskGB = $MinimumFreeDiskGB
}
if ($ResetVault) { $Forward.ResetVault = $true }
if ($ResetAuthSession) { $Forward.ResetAuthSession = $true }
if ($NonInteractive) { $Forward.NonInteractive = $true }
if ($SkipSupabaseConfigPush) { $Forward.SkipSupabaseConfigPush = $true }
if ($SkipCloudflareDeploy) { $Forward.SkipCloudflareDeploy = $true }
if ($SkipBrowserInstall) { $Forward.SkipBrowserInstall = $true }
if ($ForceUnlock) { $Forward.ForceUnlock = $true }
if ($PreflightOnly) { $Forward.PreflightOnly = $true }
if ($DisableAutoRollback) { $Forward.DisableAutoRollback = $true }

& $Master @Forward
