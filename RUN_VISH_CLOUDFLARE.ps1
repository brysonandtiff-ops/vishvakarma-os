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
$AuthBootstrap = Join-Path $RepoRoot "scripts\deployment\bootstrap-cloudflare-auth-session.mjs"
$WranglerVersion = "4.118.0"
$PnpmVersion = "9.15.0"
$SupabaseTempRoot = Join-Path $RepoRoot "supabase\.temp"

Set-Location $RepoRoot

if (-not (Test-Path $Controller)) {
    throw "Missing Cloudflare release controller: $Controller"
}
if (-not (Test-Path $AuthBootstrap)) {
    throw "Missing hardened auth bootstrap: $AuthBootstrap"
}

Write-Host "VISHVAKARMA.OS ONE-COMMAND CLOUDFLARE RELEASE" -ForegroundColor Cyan
Write-Host "Repository: $RepoRoot"
Write-Host "Target: $PagesUrl"
Write-Host "Authentication: Supabase email/password only"

# Supabase CLI writes generated version/cache files under supabase/.temp. Some
# historical versions are tracked, so ordinary ignore rules cannot hide their
# modifications. Remove only this generated directory, then restore its tracked
# baseline before the controller performs its fail-closed source-change scan.
Write-Host "Normalizing generated Supabase CLI temp state..." -ForegroundColor Cyan
if (Test-Path -LiteralPath $SupabaseTempRoot) {
    Remove-Item -LiteralPath $SupabaseTempRoot -Recurse -Force
}
$global:LASTEXITCODE = 0
git restore --staged --worktree -- "supabase/.temp" 2>$null
if ($LASTEXITCODE -ne 0) {
    # A repository with no tracked supabase/.temp files is also valid.
    $global:LASTEXITCODE = 0
}
Write-Host "PASS: Supabase CLI temp state normalized" -ForegroundColor Green

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

# Validate or bootstrap the approved Supabase email/password browser session
# before any new Cloudflare deployment is created. The bootstrap requires both
# a stable /editor route and a real, non-expired Supabase access token before saving.
if (-not $PreflightOnly) {
    Write-Host "Verifying hardened Supabase email/password browser session..." -ForegroundColor Cyan

    if (-not (Test-Path (Join-Path $RepoRoot "node_modules\@playwright\test"))) {
        Write-Host "Installing locked dependencies required for auth verification..." -ForegroundColor Cyan
        $global:LASTEXITCODE = 0
        npx --yes "pnpm@$PnpmVersion" install --frozen-lockfile
        if ($LASTEXITCODE -ne 0) {
            throw "Locked dependency installation failed before auth verification."
        }
    }

    if (-not $SkipBrowserInstall) {
        $global:LASTEXITCODE = 0
        npx --yes "pnpm@$PnpmVersion" exec playwright install chromium
        if ($LASTEXITCODE -ne 0) {
            throw "Playwright Chromium installation failed before auth verification."
        }
    }

    $AuthArguments = [System.Collections.Generic.List[string]]::new()
    [void]$AuthArguments.Add($AuthBootstrap)
    [void]$AuthArguments.Add('--pages-url')
    [void]$AuthArguments.Add($PagesUrl)
    if ($ResetAuthSession) { [void]$AuthArguments.Add('--reset') }
    if ($NonInteractive) { [void]$AuthArguments.Add('--non-interactive') }

    $global:LASTEXITCODE = 0
    & node @AuthArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Hardened Supabase email/password auth-session verification failed."
    }
    Write-Host "PASS: Hardened Supabase email/password browser session verified" -ForegroundColor Green
}

$Forward = @{
    PagesUrl = $PagesUrl
    ProjectName = $ProjectName
    MaxAttempts = $MaxAttempts
    RetryDelaySeconds = $RetryDelaySeconds
    MinimumFreeDiskGB = $MinimumFreeDiskGB
}
if ($ResetVault) { $Forward.ResetVault = $true }
# ResetAuthSession is intentionally consumed by the hardened preflight above;
# forwarding it would delete the newly verified browser state inside the proof runner.
if ($NonInteractive) { $Forward.NonInteractive = $true }
if ($SkipSupabaseConfigPush) { $Forward.SkipSupabaseConfigPush = $true }
if ($SkipCloudflareDeploy) { $Forward.SkipCloudflareDeploy = $true }
if ($SkipBrowserInstall) { $Forward.SkipBrowserInstall = $true }
if ($ForceUnlock) { $Forward.ForceUnlock = $true }
if ($PreflightOnly) { $Forward.PreflightOnly = $true }
if ($DisableAutoRollback) { $Forward.DisableAutoRollback = $true }

& $Controller @Forward
