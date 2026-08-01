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
$Controller = Join-Path $RepoRoot "RUN_CLOUDFLARE_RELEASE_CONTROLLER.ps1"
$WranglerVersion = "4.118.0"

Set-Location $RepoRoot

if (-not (Test-Path $Controller)) {
    throw "Missing Cloudflare release controller: $Controller"
}

Write-Host "VISHVAKARMA.OS ONE-COMMAND CLOUDFLARE RELEASE" -ForegroundColor Cyan
Write-Host "Repository: $RepoRoot"
Write-Host "Target: $PagesUrl"

$Npx = Get-Command npx -ErrorAction SilentlyContinue
if (-not $Npx) {
    throw "npx is required. Install Node.js 20, 22 or 24 before continuing."
}

$WranglerAuthenticated = $true
try {
    $global:LASTEXITCODE = 0
    npx --yes "wrangler@$WranglerVersion" whoami --json *> $null
    if ($LASTEXITCODE -ne 0) {
        $WranglerAuthenticated = $false
    }
}
catch {
    $WranglerAuthenticated = $false
}

if (-not $WranglerAuthenticated) {
    if ($NonInteractive) {
        throw "Cloudflare Wrangler is not authenticated. Run once without -NonInteractive to complete login."
    }

    Write-Host "Cloudflare login is required once. Your browser will open." -ForegroundColor Yellow
    $global:LASTEXITCODE = 0
    npx --yes "wrangler@$WranglerVersion" login
    if ($LASTEXITCODE -ne 0) {
        throw "Cloudflare Wrangler login failed."
    }

    $global:LASTEXITCODE = 0
    npx --yes "wrangler@$WranglerVersion" whoami --json *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Cloudflare authentication could not be verified after login."
    }
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

& $Controller @Forward
