[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$ProjectRef = "jyocvwipthswfcmvqgqe",
    [switch]$ForceUnlock
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ISC = Injection Script Code
# One controlled injection chain:
# VERIFY -> OPEN -> CONFIGURE -> PROVE -> RELEASE

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$ExpectedRemote = "brysonandtiff-ops/vishvakarma-os"
$ReleaseRunner = Join-Path $RepoRoot "RUN_VISH_CLOUDFLARE.ps1"
$AuthState = Join-Path $RepoRoot ".local\cloudflare-auth\storage-state.json"
$EvidenceRoot = Join-Path $RepoRoot ".local\cloudflare-proof"
$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$StatusPath = Join-Path $EvidenceRoot "isc-google-oauth-$RunId.json"
$GoogleClientPage = "https://console.cloud.google.com/auth/clients/create"
$SupabaseProviderPage = "https://supabase.com/dashboard/project/$ProjectRef/auth/providers?provider=Google"
$GoogleCallback = "https://$ProjectRef.supabase.co/auth/v1/callback"
$ManagementApi = "https://api.supabase.com/v1/projects/$ProjectRef/config/auth"

function Write-IscStep {
    param([string]$Name)
    Write-Host "`nISC:: $Name" -ForegroundColor Cyan
}

function ConvertFrom-SecureText {
    param([Security.SecureString]$Secure)
    $Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Ptr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Ptr)
    }
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
    ProjectRef = $ProjectRef
    PagesUrl = $PagesUrl
    GoogleCallback = $GoogleCallback
    GitHead = $null
    HealthBefore = $null
    GoogleProviderConfigured = $false
    ReleaseControllerStarted = $false
    Detail = $null
}

try {
    Write-Host "VISHVAKARMA.OS ISC ALL-IN-ONE OAUTH + CLOUDFLARE RELEASE" -ForegroundColor Magenta
    Write-Host "ISC chain: VERIFY -> OPEN -> CONFIGURE -> PROVE -> RELEASE"
    Write-Host "Repository: $RepoRoot"
    Write-Host "Branch: $ExpectedBranch"

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

    Write-IscStep "OPEN GOOGLE OAUTH CLIENT CREATION"
    Write-Host "Create a WEB APPLICATION OAuth client with these exact values:" -ForegroundColor Yellow
    Write-Host "  Name: Vishvakarma.OS Production"
    Write-Host "  Authorized JavaScript origin: $PagesUrl"
    Write-Host "  Authorized JavaScript origin: https://vishvakarma-os.app"
    Write-Host "  Authorized redirect URI: $GoogleCallback" -ForegroundColor Green
    Set-Clipboard -Value $GoogleCallback
    Write-Host "The exact Supabase callback URL is copied to your clipboard." -ForegroundColor Green
    Start-Process $GoogleClientPage

    $GoogleClientId = (Read-Host "After Google creates the client, paste the Client ID").Trim()
    if ($GoogleClientId -notmatch '^[A-Za-z0-9._-]+\.apps\.googleusercontent\.com$') {
        throw "The Google Client ID format is invalid. It must end with .apps.googleusercontent.com"
    }

    $GoogleSecretSecure = Read-Host "Paste the Google Client Secret (hidden)" -AsSecureString
    $GoogleClientSecret = ConvertFrom-SecureText $GoogleSecretSecure
    if ([string]::IsNullOrWhiteSpace($GoogleClientSecret)) {
        throw "Google Client Secret was empty."
    }

    $SupabaseAccessToken = $env:SUPABASE_ACCESS_TOKEN
    if ([string]::IsNullOrWhiteSpace($SupabaseAccessToken)) {
        Write-Host "A Supabase personal access token is required once to update the Google provider." -ForegroundColor Yellow
        Write-Host "Supabase profile -> Account Settings -> Access Tokens -> Generate token"
        $SupabaseTokenSecure = Read-Host "Paste the Supabase personal access token (hidden)" -AsSecureString
        $SupabaseAccessToken = ConvertFrom-SecureText $SupabaseTokenSecure
    }
    if ($SupabaseAccessToken -notmatch '^sbp_') {
        throw "The Supabase personal access token format is invalid; expected sbp_."
    }

    Write-IscStep "INJECT GOOGLE PROVIDER INTO SUPABASE"
    $Body = @{
        external_google_enabled = $true
        external_google_client_id = $GoogleClientId
        external_google_secret = $GoogleClientSecret
    } | ConvertTo-Json

    try {
        $ProviderRequest = @{
            Uri = $ManagementApi
            Method = "Patch"
            Headers = @{
                Authorization = "Bearer $SupabaseAccessToken"
                "Content-Type" = "application/json"
            }
            Body = $Body
            TimeoutSec = 60
        }
        $null = Invoke-RestMethod @ProviderRequest
        $Status.GoogleProviderConfigured = $true
        Write-Host "PASS: Supabase Google provider updated securely" -ForegroundColor Green
    }
    catch {
        Write-Host "Automatic Supabase provider update failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Opening the exact provider page for manual save." -ForegroundColor Yellow
        Start-Process $SupabaseProviderPage
        throw "Supabase provider configuration was not updated. No secret was printed or committed."
    }
    finally {
        $GoogleClientSecret = $null
        $SupabaseAccessToken = $null
        Remove-Variable GoogleClientSecret -ErrorAction SilentlyContinue
        Remove-Variable SupabaseAccessToken -ErrorAction SilentlyContinue
    }

    Write-IscStep "WAIT FOR AUTH CONFIG PROPAGATION"
    Start-Sleep -Seconds 8
    Write-Host "PASS: Provider propagation wait complete" -ForegroundColor Green

    Write-IscStep "RESET EXPIRED AUTH SESSION"
    Remove-Item -LiteralPath $AuthState -Force -ErrorAction SilentlyContinue
    Write-Host "PASS: Previous browser auth state removed" -ForegroundColor Green

    Write-IscStep "PROVE GOOGLE LOGIN AND RUN FULL RELEASE"
    Write-Host "Chromium will open. Complete Google login/MFA once." -ForegroundColor Yellow
    $Status.ReleaseControllerStarted = $true

    $Arguments = @{
        ResetAuthSession = $true
        ForceUnlock = $true
    }
    if ($ForceUnlock) { $Arguments.ForceUnlock = $true }

    & $ReleaseRunner @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Cloudflare release controller returned exit code $LASTEXITCODE."
    }

    $Status.Result = "PASS"
    $Status.Detail = "Google OAuth provider configured and Cloudflare release controller completed."
    Write-Host "`nISC ALL-IN-ONE: PASS" -ForegroundColor Green
    $global:LASTEXITCODE = 0
}
catch {
    $Status.Result = "BLOCKED"
    $Status.Detail = $_.Exception.Message
    Write-Host "`nISC ALL-IN-ONE: BLOCKED - $($Status.Detail)" -ForegroundColor Red
    Write-Host "No secret values were printed or committed." -ForegroundColor Yellow
    $global:LASTEXITCODE = 1
}
finally {
    $Status.CompletedAt = (Get-Date).ToString("o")
    $Status | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $StatusPath -Encoding utf8
    Write-Host "ISC status: $StatusPath" -ForegroundColor Yellow
}
