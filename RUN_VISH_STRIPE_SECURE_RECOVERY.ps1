[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$ProjectName = "vishvakarma-os",
    [switch]$ResetStripeKey,
    [switch]$LiveMode,
    [switch]$Rebuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if (-not $IsWindows) {
    throw "Secure Stripe recovery currently requires Windows DPAPI."
}

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$VaultRoot = Join-Path $RepoRoot ".local\cloudflare-auth"
$VaultPath = Join-Path $VaultRoot "stripe-server-key.clixml"
$Finalizer = Join-Path $RepoRoot "scripts\deployment\vish-stripe-checkout-finalizer.mjs"
$WindowsCompat = Join-Path $RepoRoot "scripts\deployment\windows-command-spawn-compat.cjs"
$DistIndex = Join-Path $RepoRoot "dist\index.html"

Set-Location $RepoRoot

Write-Host "VISHVAKARMA.OS SECURE STRIPE CHECKOUT RECOVERY" -ForegroundColor Magenta
Write-Host "Repository: $RepoRoot"
Write-Host "Target: $PagesUrl"
Write-Host "Mode: $(if ($LiveMode) { 'LIVE' } else { 'TEST' })" -ForegroundColor Cyan
Write-Host "Stripe key storage: Windows-encrypted local vault" -ForegroundColor Cyan

foreach ($RequiredPath in @($Finalizer, $WindowsCompat)) {
    if (-not (Test-Path -LiteralPath $RequiredPath)) {
        throw "Missing required Stripe recovery component: $RequiredPath"
    }
}

$Branch = (git branch --show-current).Trim()
if ($Branch -ne $ExpectedBranch) {
    throw "Wrong branch: $Branch. Expected: $ExpectedBranch"
}

New-Item -ItemType Directory -Force -Path $VaultRoot | Out-Null
$RelativeVault = [System.IO.Path]::GetRelativePath($RepoRoot, $VaultPath).Replace("\", "/")
$global:LASTEXITCODE = 0
git check-ignore --quiet -- $RelativeVault
if ($LASTEXITCODE -ne 0) {
    throw "$RelativeVault must be ignored by Git before a Stripe server key can be stored."
}

if ($ResetStripeKey -and (Test-Path -LiteralPath $VaultPath)) {
    Remove-Item -LiteralPath $VaultPath -Force
    Write-Host "PASS: Previous encrypted Stripe server key removed" -ForegroundColor Green
}

function Assert-StripeKeyMode {
    param([Parameter(Mandatory = $true)][string]$Key)

    $ExpectedPattern = if ($LiveMode) {
        '^(sk|rk)_live_[A-Za-z0-9_]+$'
    }
    else {
        '^(sk|rk)_test_[A-Za-z0-9_]+$'
    }

    if ($Key -notmatch $ExpectedPattern) {
        $ExpectedPrefix = if ($LiveMode) { 'sk_live_ or rk_live_' } else { 'sk_test_ or rk_test_' }
        throw "The Stripe key is not valid for this mode. Expected $ExpectedPrefix."
    }
}

if (-not (Test-Path -LiteralPath $VaultPath)) {
    Write-Host "`nONE-TIME STRIPE KEY SETUP" -ForegroundColor Cyan
    Write-Host "Use a server-side Stripe key from the Stripe Dashboard." -ForegroundColor Yellow
    Write-Host "The prompt is hidden. The key is never printed, passed on the command line, or committed." -ForegroundColor Yellow

    $SecureKey = Read-Host "Stripe server key" -AsSecureString
    if ($SecureKey.Length -eq 0) {
        throw "The Stripe server key cannot be empty."
    }

    $Credential = [System.Management.Automation.PSCredential]::new(
        "stripe-server-key",
        $SecureKey
    )
    $PlainForValidation = $Credential.GetNetworkCredential().Password
    Assert-StripeKeyMode -Key $PlainForValidation

    $Credential | Export-Clixml -LiteralPath $VaultPath -Force

    $PlainForValidation = $null
    Remove-Variable Credential -ErrorAction SilentlyContinue
    Remove-Variable SecureKey -ErrorAction SilentlyContinue
    Write-Host "PASS: Stripe server key encrypted for this Windows user and computer" -ForegroundColor Green
}

$StoredCredential = Import-Clixml -LiteralPath $VaultPath
if (-not ($StoredCredential -is [System.Management.Automation.PSCredential])) {
    throw "The Stripe key vault is invalid. Re-run with -ResetStripeKey."
}

$StripeKey = $StoredCredential.GetNetworkCredential().Password
Assert-StripeKeyMode -Key $StripeKey

if ($StripeKey.StartsWith('rk_')) {
    Write-Host "WARNING: Restricted Stripe key detected. Required permissions will be proved by the finalizer." -ForegroundColor Yellow
}

if ($Rebuild -or -not (Test-Path -LiteralPath $DistIndex)) {
    Write-Host "`nISC:: BUILD PRODUCTION ARTIFACT" -ForegroundColor Cyan
    $env:VITE_SUPABASE_URL = "https://jyocvwipthswfcmvqgqe.supabase.co"
    $env:VITE_SUPABASE_ANON_KEY = "sb_publishable_2vZsi4PoOlDb2lqs9mV0QQ_peQDtE6b"
    $env:VITE_AUTH_REDIRECT_ORIGIN = $PagesUrl.TrimEnd('/')
    $env:VITE_STRIPE_BILLING_ENABLED = "true"
    $env:VITE_PRICING_PAGE_ENABLED = "true"

    npx --yes pnpm@9.15.0 run build
    if ($LASTEXITCODE -ne 0) {
        throw "Production build failed with exit code $LASTEXITCODE."
    }
}

$PreviousStripeKey = $env:STRIPE_SECRET_KEY
$PreviousStripeMode = $env:VISH_STRIPE_MODE

try {
    $env:STRIPE_SECRET_KEY = $StripeKey
    $env:VISH_STRIPE_MODE = if ($LiveMode) { "live" } else { "test" }
    $StripeKey = $null
    Remove-Variable StoredCredential -ErrorAction SilentlyContinue

    Write-Host "`nISC:: RUN FOCUSED STRIPE CHECKOUT FINALIZER" -ForegroundColor Cyan
    Write-Host "The finalizer will create or verify prices and the webhook, upload encrypted Cloudflare bindings, deploy the exact commit, and prove Checkout." -ForegroundColor Cyan

    & node `
        --require $WindowsCompat `
        $Finalizer `
        --pages-url $PagesUrl `
        --project-name $ProjectName

    if ($LASTEXITCODE -ne 0) {
        throw "Focused Stripe finalizer returned exit code $LASTEXITCODE."
    }
}
finally {
    if ($null -eq $PreviousStripeKey) {
        Remove-Item Env:STRIPE_SECRET_KEY -ErrorAction SilentlyContinue
    }
    else {
        $env:STRIPE_SECRET_KEY = $PreviousStripeKey
    }

    if ($null -eq $PreviousStripeMode) {
        Remove-Item Env:VISH_STRIPE_MODE -ErrorAction SilentlyContinue
    }
    else {
        $env:VISH_STRIPE_MODE = $PreviousStripeMode
    }

    $StripeKey = $null
}

Write-Host "`nVISH SECURE STRIPE CHECKOUT RECOVERY: PASS" -ForegroundColor Green
