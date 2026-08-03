[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [switch]$ForceUnlock
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ISC = Injection Script Code
# One controlled injection chain:
# VERIFY -> NORMALIZE -> BUILD -> DEPLOY -> PROVE LIVE SURFACE -> PROVE SUPABASE -> RELEASE

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$ExpectedRemote = "brysonandtiff-ops/vishvakarma-os"
$ProjectName = "vishvakarma-os"
$ReleaseRunner = Join-Path $RepoRoot "RUN_VISH_CLOUDFLARE.ps1"
$LiveAuthVerifier = Join-Path $RepoRoot "scripts\deployment\verify-supabase-only-auth-live.mjs"
$BuildRunner = Join-Path $RepoRoot "scripts\vercel-build.mjs"
$AuthState = Join-Path $RepoRoot ".local\cloudflare-auth\storage-state.json"
$EvidenceRoot = Join-Path $RepoRoot ".local\cloudflare-proof"
$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$StatusPath = Join-Path $EvidenceRoot "isc-supabase-auth-$RunId.json"
$PnpmVersion = "9.15.0"
$WranglerVersion = "4.118.0"
$SupabaseUrl = "https://jyocvwipthswfcmvqgqe.supabase.co"
$SupabasePublishableKey = "sb_publishable_2vZsi4PoOlDb2lqs9mV0QQ_peQDtE6b"

function Write-IscStep {
    param([string]$Name)
    Write-Host "`nISC:: $Name" -ForegroundColor Cyan
}

function Assert-NativeSuccess {
    param([string]$Label)
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

New-Item -ItemType Directory -Force -Path $EvidenceRoot | Out-Null
Set-Location $RepoRoot

$Status = [ordered]@{
    StartedAt = (Get-Date).ToString("o")
    Result = "BLOCKED"
    Authentication = "supabase-email-password"
    PagesUrl = $PagesUrl
    GitHead = $null
    HealthBefore = $null
    SurfaceDeploymentStarted = $false
    LiveSupabaseSurface = $false
    ReleaseControllerStarted = $false
    Detail = $null
}

try {
    Write-Host "VISHVAKARMA.OS ISC ALL-IN-ONE SUPABASE + CLOUDFLARE RELEASE" -ForegroundColor Magenta
    Write-Host "ISC chain: VERIFY -> NORMALIZE -> BUILD -> DEPLOY -> PROVE LIVE SURFACE -> PROVE SUPABASE -> RELEASE"
    Write-Host "Repository: $RepoRoot"
    Write-Host "Branch: $ExpectedBranch"
    Write-Host "Authentication: Supabase email/password only"

    Write-IscStep "VERIFY REPOSITORY AND BRANCH"
    $Origin = (git remote get-url origin).Trim()
    if ($Origin -notmatch [regex]::Escape($ExpectedRemote)) {
        throw "Wrong repository remote: $Origin"
    }

    $Branch = (git branch --show-current).Trim()
    if ($Branch -ne $ExpectedBranch) {
        git switch $ExpectedBranch
        Assert-NativeSuccess "Switch branch"
    }

    git fetch origin $ExpectedBranch
    Assert-NativeSuccess "Fetch branch"
    git merge --ff-only "origin/$ExpectedBranch"
    Assert-NativeSuccess "Fast-forward branch"
    $Status.GitHead = (git rev-parse HEAD).Trim()
    Write-Host "PASS: Repository and branch verified at $($Status.GitHead.Substring(0, 8))" -ForegroundColor Green

    foreach ($RequiredPath in @($ReleaseRunner, $LiveAuthVerifier, $BuildRunner)) {
        if (-not (Test-Path -LiteralPath $RequiredPath)) {
            throw "Missing required ISC release file: $RequiredPath"
        }
    }

    Write-IscStep "NORMALIZE GENERATED SUPABASE STATE"
    $SupabaseTemp = Join-Path $RepoRoot "supabase\.temp"
    if (Test-Path -LiteralPath $SupabaseTemp) {
        Remove-Item -LiteralPath $SupabaseTemp -Recurse -Force
    }
    git restore --staged --worktree -- "supabase/.temp" 2>$null
    $global:LASTEXITCODE = 0
    Write-Host "PASS: Generated Supabase temp state normalized" -ForegroundColor Green

    Write-IscStep "VERIFY CURRENT LIVE HEALTH"
    $HealthRequest = @{
        Uri = "$($PagesUrl.TrimEnd('/'))/api/health?isc=$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
        Headers = @{ "Cache-Control" = "no-cache" }
        TimeoutSec = 30
    }
    $Health = Invoke-RestMethod @HealthRequest
    $Status.HealthBefore = $Health
    if ($Health.ok -ne $true) {
        throw "Live health is not ok:true."
    }
    Write-Host "PASS: Current live Cloudflare health is ok:true" -ForegroundColor Green

    Write-IscStep "INSTALL LOCKED DEPENDENCIES"
    npx --yes "pnpm@$PnpmVersion" install --frozen-lockfile
    Assert-NativeSuccess "Install locked dependencies"
    Write-Host "PASS: Locked dependencies installed" -ForegroundColor Green

    Write-IscStep "VERIFY CLOUDFLARE WRANGLER LOGIN"
    $global:LASTEXITCODE = 0
    npx --yes "wrangler@$WranglerVersion" whoami --json *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Cloudflare login is required once; opening the browser." -ForegroundColor Yellow
        npx --yes "wrangler@$WranglerVersion" login
        Assert-NativeSuccess "Cloudflare Wrangler login"
    }
    Write-Host "PASS: Cloudflare Wrangler authenticated" -ForegroundColor Green

    Write-IscStep "BUILD EXACT SUPABASE-ONLY AUTH COMMIT"
    $env:SUPABASE_URL = $SupabaseUrl
    $env:VITE_SUPABASE_URL = $SupabaseUrl
    $env:VITE_SUPABASE_ANON_KEY = $SupabasePublishableKey
    $env:VITE_AUTH_REDIRECT_ORIGIN = $PagesUrl.TrimEnd('/')
    $env:VITE_STRIPE_BILLING_ENABLED = "true"
    $env:VITE_PRICING_PAGE_ENABLED = "true"
    $env:APP_URL = $PagesUrl.TrimEnd('/')
    $env:CLOUDFLARE_PAGES_URL = $PagesUrl.TrimEnd('/')
    $env:PRODUCTION_URL = $PagesUrl.TrimEnd('/')

    & node $BuildRunner
    Assert-NativeSuccess "Build exact Supabase-only auth commit"
    if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot "dist\index.html"))) {
        throw "Production build completed without dist/index.html."
    }
    Write-Host "PASS: Production artifact built" -ForegroundColor Green

    Write-IscStep "DEPLOY EXACT COMMIT BEFORE LIVE BADGE PROOF"
    $Status.SurfaceDeploymentStarted = $true
    $CommitMessage = "ISC Supabase-only auth surface $($Status.GitHead.Substring(0, 8))"
    npx --yes "wrangler@$WranglerVersion" pages deploy dist `
        --project-name $ProjectName `
        --branch $ExpectedBranch `
        --commit-hash $Status.GitHead `
        --commit-message $CommitMessage
    Assert-NativeSuccess "Deploy exact Supabase-only auth commit"
    Write-Host "PASS: Exact Git commit submitted to Cloudflare Pages" -ForegroundColor Green

    Write-IscStep "WAIT FOR LIVE SUPABASE-ONLY AUTH SURFACE"
    npx --yes "pnpm@$PnpmVersion" exec playwright install chromium
    Assert-NativeSuccess "Install or verify Playwright Chromium"

    & node $LiveAuthVerifier --pages-url $PagesUrl --wait-seconds 600
    Assert-NativeSuccess "Verify live Supabase-only auth surface"
    $Status.LiveSupabaseSurface = $true
    Write-Host "PASS: Live auth page shows Supabase badge and only email/password controls" -ForegroundColor Green

    Write-IscStep "RESET PREVIOUS AUTH SESSION"
    Remove-Item -LiteralPath $AuthState -Force -ErrorAction SilentlyContinue
    Write-Host "PASS: Previous browser auth state removed" -ForegroundColor Green

    Write-IscStep "PROVE SUPABASE EMAIL/PASSWORD AND RUN FULL RELEASE"
    Write-Host "Chromium will open the Vishvakarma.OS Supabase login form." -ForegroundColor Yellow
    Write-Host "Enter the approved email and password once; the controller will continue automatically." -ForegroundColor Yellow
    $Status.ReleaseControllerStarted = $true

    $Arguments = @{
        PagesUrl = $PagesUrl
        ResetAuthSession = $true
        ForceUnlock = $true
    }
    if ($ForceUnlock) { $Arguments.ForceUnlock = $true }

    & $ReleaseRunner @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Cloudflare release controller returned exit code $LASTEXITCODE."
    }

    $Status.Result = "PASS"
    $Status.Detail = "Exact commit deployed, live Supabase-only badge proved, email/password session proved, and Cloudflare release controller completed."
    Write-Host "`nISC ALL-IN-ONE: PASS" -ForegroundColor Green
    $global:LASTEXITCODE = 0
}
catch {
    $Status.Result = "BLOCKED"
    $Status.Detail = $_.Exception.Message
    Write-Host "`nISC ALL-IN-ONE: BLOCKED - $($Status.Detail)" -ForegroundColor Red
    Write-Host "No password or secret value was printed or committed." -ForegroundColor Yellow
    $global:LASTEXITCODE = 1
}
finally {
    $Status.CompletedAt = (Get-Date).ToString("o")
    $Status | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $StatusPath -Encoding utf8
    Write-Host "ISC status: $StatusPath" -ForegroundColor Yellow
}
