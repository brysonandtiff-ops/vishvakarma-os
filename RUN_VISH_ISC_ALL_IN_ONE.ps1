[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [switch]$ForceUnlock
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ISC = Injection Script Code
# One controlled injection chain:
# VERIFY -> NORMALIZE -> PROVE LIVE SURFACE -> PROVE SUPABASE -> RELEASE

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$ExpectedRemote = "brysonandtiff-ops/vishvakarma-os"
$ReleaseRunner = Join-Path $RepoRoot "RUN_VISH_CLOUDFLARE.ps1"
$LiveAuthVerifier = Join-Path $RepoRoot "scripts\deployment\verify-supabase-only-auth-live.mjs"
$AuthState = Join-Path $RepoRoot ".local\cloudflare-auth\storage-state.json"
$EvidenceRoot = Join-Path $RepoRoot ".local\cloudflare-proof"
$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$StatusPath = Join-Path $EvidenceRoot "isc-supabase-auth-$RunId.json"
$PnpmVersion = "9.15.0"

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
    LiveSupabaseSurface = $false
    ReleaseControllerStarted = $false
    Detail = $null
}

try {
    Write-Host "VISHVAKARMA.OS ISC ALL-IN-ONE SUPABASE + CLOUDFLARE RELEASE" -ForegroundColor Magenta
    Write-Host "ISC chain: VERIFY -> NORMALIZE -> PROVE LIVE SURFACE -> PROVE SUPABASE -> RELEASE"
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

    if (-not (Test-Path -LiteralPath $ReleaseRunner)) {
        throw "Missing release runner: $ReleaseRunner"
    }
    if (-not (Test-Path -LiteralPath $LiveAuthVerifier)) {
        throw "Missing live Supabase auth verifier: $LiveAuthVerifier"
    }

    Write-IscStep "NORMALIZE GENERATED SUPABASE STATE"
    $SupabaseTemp = Join-Path $RepoRoot "supabase\.temp"
    if (Test-Path -LiteralPath $SupabaseTemp) {
        Remove-Item -LiteralPath $SupabaseTemp -Recurse -Force
    }
    git restore --staged --worktree -- "supabase/.temp" 2>$null
    $global:LASTEXITCODE = 0
    Write-Host "PASS: Generated Supabase temp state normalized" -ForegroundColor Green

    Write-IscStep "VERIFY LIVE HEALTH"
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
    Write-Host "PASS: Live Cloudflare health is ok:true" -ForegroundColor Green

    Write-IscStep "WAIT FOR LIVE SUPABASE-ONLY AUTH SURFACE"
    if (-not (Test-Path (Join-Path $RepoRoot "node_modules\@playwright\test"))) {
        npx --yes "pnpm@$PnpmVersion" install --frozen-lockfile
        Assert-NativeSuccess "Install locked dependencies"
    }
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
    $Status.Detail = "Live Supabase-only badge proved, email/password session proved, and Cloudflare release controller completed."
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
