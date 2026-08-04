[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [switch]$ForceUnlock
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ISC = Injection Script Code
# VERIFY -> NORMALIZE -> ENABLE HOSTED AUTH -> BUILD -> DEPLOY -> PROVE -> RELEASE

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$ExpectedRemote = "brysonandtiff-ops/vishvakarma-os"
$ProjectName = "vishvakarma-os"
$SupabaseProjectRef = "jyocvwipthswfcmvqgqe"
$ReleaseRunner = Join-Path $RepoRoot "RUN_VISH_CLOUDFLARE.ps1"
$LiveAuthVerifier = Join-Path $RepoRoot "scripts\deployment\verify-supabase-only-auth-live.mjs"
$BuildRunner = Join-Path $RepoRoot "scripts\vercel-build.mjs"
$HostedAuthSetup = Join-Path $RepoRoot "scripts\setup-supabase-auth-hardening.mjs"
$AuthState = Join-Path $RepoRoot ".local\cloudflare-auth\storage-state.json"
$EvidenceRoot = Join-Path $RepoRoot ".local\cloudflare-proof"
$ProofVaultPath = Join-Path $EvidenceRoot "secrets.dpapi.json"
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

function Convert-SecureStringToPlainText {
    param([Parameter(Mandatory = $true)][Security.SecureString]$SecureValue)
    $Pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Pointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Pointer)
    }
}

function Read-ProtectedVaultValue {
    param([Parameter(Mandatory = $true)][string]$Name)

    $ProcessValue = [Environment]::GetEnvironmentVariable($Name, "Process")
    if (-not [string]::IsNullOrWhiteSpace($ProcessValue)) {
        return $ProcessValue.Trim()
    }

    if (-not (Test-Path -LiteralPath $ProofVaultPath)) {
        return $null
    }

    try {
        $Vault = Get-Content -Raw -LiteralPath $ProofVaultPath | ConvertFrom-Json -AsHashtable
        if (-not $Vault.ContainsKey($Name)) {
            return $null
        }
        $SecureValue = ConvertTo-SecureString ([string]$Vault[$Name])
        return (Convert-SecureStringToPlainText $SecureValue).Trim()
    }
    catch {
        Write-Warning "The stored $Name could not be opened for this Windows user."
        return $null
    }
}

function Save-ProtectedVaultValue {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Value
    )

    $Vault = @{}
    if (Test-Path -LiteralPath $ProofVaultPath) {
        try {
            $Loaded = Get-Content -Raw -LiteralPath $ProofVaultPath | ConvertFrom-Json -AsHashtable
            if ($Loaded) { $Vault = $Loaded }
        }
        catch {
            throw "The local DPAPI proof vault is invalid: $ProofVaultPath"
        }
    }

    $Vault[$Name] = ConvertFrom-SecureString (ConvertTo-SecureString $Value -AsPlainText -Force)
    $Vault | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $ProofVaultPath -Encoding utf8
}

function Get-SupabaseAccessToken {
    $Token = Read-ProtectedVaultValue -Name "SUPABASE_ACCESS_TOKEN"
    if ($Token -and $Token -match '^sbp_[A-Za-z0-9_-]+$') {
        return $Token
    }

    Write-Host "A Supabase personal access token is required once to enable hosted email accounts." -ForegroundColor Yellow
    $SecureToken = Read-Host "Paste your Supabase personal access token (hidden)" -AsSecureString
    $Token = Convert-SecureStringToPlainText $SecureToken
    if ($Token -notmatch '^sbp_[A-Za-z0-9_-]+$') {
        throw "Invalid Supabase personal access token. Expected a value beginning sbp_."
    }
    Save-ProtectedVaultValue -Name "SUPABASE_ACCESS_TOKEN" -Value $Token
    return $Token
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
    HostedAuthLifecycle = $false
    SurfaceDeploymentStarted = $false
    LiveSupabaseSurface = $false
    ReleaseControllerStarted = $false
    Detail = $null
}

try {
    Write-Host "VISHVAKARMA.OS ISC ACCOUNT LIFECYCLE + CLOUDFLARE RELEASE" -ForegroundColor Magenta
    Write-Host "ISC chain: VERIFY -> NORMALIZE -> ENABLE AUTH -> BUILD -> DEPLOY -> PROVE -> RELEASE"
    Write-Host "Repository: $RepoRoot"
    Write-Host "Branch: $ExpectedBranch"
    Write-Host "Authentication: Supabase email/password accounts"

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

    foreach ($RequiredPath in @($ReleaseRunner, $LiveAuthVerifier, $BuildRunner, $HostedAuthSetup)) {
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
    $Health = Invoke-RestMethod `
        -Uri "$($PagesUrl.TrimEnd('/'))/api/health?isc=$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())" `
        -Headers @{ "Cache-Control" = "no-cache" } `
        -TimeoutSec 30
    $Status.HealthBefore = $Health
    if ($Health.ok -ne $true) { throw "Live health is not ok:true." }
    Write-Host "PASS: Current live Cloudflare health is ok:true" -ForegroundColor Green

    Write-IscStep "INSTALL LOCKED DEPENDENCIES"
    npx --yes "pnpm@$PnpmVersion" install --frozen-lockfile
    Assert-NativeSuccess "Install locked dependencies"
    Write-Host "PASS: Locked dependencies installed" -ForegroundColor Green

    Write-IscStep "ENABLE HOSTED SUPABASE ACCOUNT LIFECYCLE"
    $SupabaseAccessToken = Get-SupabaseAccessToken
    [Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", $SupabaseAccessToken, "Process")
    [Environment]::SetEnvironmentVariable("SUPABASE_PROJECT_REF", $SupabaseProjectRef, "Process")

    & node $HostedAuthSetup
    Assert-NativeSuccess "Configure hosted Supabase Auth"

    npx --yes supabase link --project-ref $SupabaseProjectRef
    Assert-NativeSuccess "Link Supabase project"
    npx --yes supabase config push --yes
    Assert-NativeSuccess "Push Supabase account and redirect configuration"
    $Status.HostedAuthLifecycle = $true
    $SupabaseAccessToken = $null
    Write-Host "PASS: Hosted signup, confirmation, recovery, and password update policy verified" -ForegroundColor Green

    Write-IscStep "VERIFY CLOUDFLARE WRANGLER LOGIN"
    $global:LASTEXITCODE = 0
    npx --yes "wrangler@$WranglerVersion" whoami --json *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Cloudflare login is required once; opening the browser." -ForegroundColor Yellow
        npx --yes "wrangler@$WranglerVersion" login
        Assert-NativeSuccess "Cloudflare Wrangler login"
    }
    Write-Host "PASS: Cloudflare Wrangler authenticated" -ForegroundColor Green

    Write-IscStep "BUILD EXACT SUPABASE ACCOUNT LIFECYCLE COMMIT"
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
    Assert-NativeSuccess "Build exact Supabase account lifecycle commit"
    if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot "dist\index.html"))) {
        throw "Production build completed without dist/index.html."
    }
    Write-Host "PASS: Production artifact built" -ForegroundColor Green

    Write-IscStep "DEPLOY EXACT COMMIT BEFORE LIVE ACCOUNT PROOF"
    $Status.SurfaceDeploymentStarted = $true
    $CommitMessage = "ISC Supabase account lifecycle $($Status.GitHead.Substring(0, 8))"
    npx --yes "wrangler@$WranglerVersion" pages deploy dist `
        --project-name $ProjectName `
        --branch $ExpectedBranch `
        --commit-hash $Status.GitHead `
        --commit-message $CommitMessage
    Assert-NativeSuccess "Deploy exact Supabase account lifecycle commit"
    Write-Host "PASS: Exact Git commit submitted to Cloudflare Pages" -ForegroundColor Green

    Write-IscStep "WAIT FOR LIVE SUPABASE ACCOUNT LIFECYCLE"
    npx --yes "pnpm@$PnpmVersion" exec playwright install chromium
    Assert-NativeSuccess "Install or verify Playwright Chromium"
    & node $LiveAuthVerifier --pages-url $PagesUrl --wait-seconds 600
    Assert-NativeSuccess "Verify live Supabase account lifecycle"
    $Status.LiveSupabaseSurface = $true
    Write-Host "PASS: Live sign-in, create-account, and recovery surfaces verified" -ForegroundColor Green

    Write-IscStep "RESET PREVIOUS AUTH SESSION"
    Remove-Item -LiteralPath $AuthState -Force -ErrorAction SilentlyContinue
    Write-Host "PASS: Previous browser auth state removed" -ForegroundColor Green

    Write-IscStep "PROVE SUPABASE EMAIL/PASSWORD AND RUN FULL RELEASE"
    Write-Host "ISC will use the Windows-encrypted Supabase login credential when configured." -ForegroundColor Yellow
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
    $Status.Detail = "Hosted Auth enabled; exact commit deployed; signup, recovery, and email/password session proved; release completed."
    Write-Host "`nISC ACCOUNT LIFECYCLE + RELEASE: PASS" -ForegroundColor Green
    $global:LASTEXITCODE = 0
}
catch {
    $Status.Result = "BLOCKED"
    $Status.Detail = $_.Exception.Message
    Write-Host "`nISC ACCOUNT LIFECYCLE + RELEASE: BLOCKED - $($Status.Detail)" -ForegroundColor Red
    Write-Host "No password or secret value was printed or committed." -ForegroundColor Yellow
    $global:LASTEXITCODE = 1
}
finally {
    $Status.CompletedAt = (Get-Date).ToString("o")
    $Status | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $StatusPath -Encoding utf8
    Write-Host "ISC status: $StatusPath" -ForegroundColor Yellow
}
