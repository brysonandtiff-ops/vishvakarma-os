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
    [switch]$NoSelfUpdate,
    [switch]$ResumeAfterSelfUpdate
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$AdaptiveCore = Join-Path $RepoRoot "RUN_VISH_SUPERCHARGED_CORE.ps1"

if (-not (Test-Path $AdaptiveCore)) {
    throw "Missing adaptive Cloudflare core: $AdaptiveCore"
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

Write-Host "Routing legacy autopilot entrypoint into the supercharged adaptive core." -ForegroundColor Cyan
& $AdaptiveCore @Forward
$global:LASTEXITCODE = $LASTEXITCODE
