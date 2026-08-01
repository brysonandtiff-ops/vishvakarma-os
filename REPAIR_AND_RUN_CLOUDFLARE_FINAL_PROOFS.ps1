[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$ProjectName = "vishvakarma-os",
    [switch]$ResetVault,
    [switch]$ResetAuthSession,
    [switch]$NonInteractive,
    [switch]$SkipSupabaseConfigPush,
    [switch]$SkipCloudflareDeploy
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$SupabaseProjectRef = "jyocvwipthswfcmvqgqe"
$SupabaseUrl = "https://jyocvwipthswfcmvqgqe.supabase.co"
$SupabasePublishableKey = "sb_publishable_2vZsi4PoOlDb2lqs9mV0QQ_peQDtE6b"
$WranglerVersion = "4.118.0"
$PnpmVersion = "9.15.0"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$LocalRoot = Join-Path $RepoRoot ".local\cloudflare-proof"
$VaultPath = Join-Path $LocalRoot "secrets.dpapi.json"
$TempSecretFile = Join-Path $env:TEMP "vish-cloudflare-secrets-$PID.json"
$ShimRoot = Join-Path $env:TEMP "vish-pnpm-$PID"
$PnpmShim = Join-Path $ShimRoot "pnpm.cmd"

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

function Protect-LocalSecret {
    param([Parameter(Mandatory = $true)][string]$PlainValue)

    $SecureValue = ConvertTo-SecureString $PlainValue -AsPlainText -Force
    return ConvertFrom-SecureString $SecureValue
}

function Unprotect-LocalSecret {
    param([Parameter(Mandatory = $true)][string]$ProtectedValue)

    $SecureValue = ConvertTo-SecureString $ProtectedValue
    return Convert-SecureStringToPlainText $SecureValue
}

function Save-Vault {
    $Vault | ConvertTo-Json -Depth 4 | Set-Content -Path $VaultPath -Encoding utf8
}

function Set-VaultSecret {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Value
    )

    $Vault[$Name] = Protect-LocalSecret $Value
    Save-Vault
}

function Get-VaultSecret {
    param([Parameter(Mandatory = $true)][string]$Name)

    $ProcessValue = [Environment]::GetEnvironmentVariable($Name, "Process")
    if (-not [string]::IsNullOrWhiteSpace($ProcessValue)) {
        return $ProcessValue.Trim()
    }

    if ($Vault.ContainsKey($Name) -and -not [string]::IsNullOrWhiteSpace([string]$Vault[$Name])) {
        try {
            return (Unprotect-LocalSecret ([string]$Vault[$Name])).Trim()
        }
        catch {
            Write-Warning "Stored $Name could not be decrypted for this Windows user. It will be requested again."
            $Vault.Remove($Name)
            Save-Vault
        }
    }

    return $null
}

function Get-OrPromptSecret {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Prompt,
        [Parameter(Mandatory = $true)][string]$Pattern,
        [Parameter(Mandatory = $true)][string]$ExpectedDescription
    )

    $Existing = Get-VaultSecret $Name
    if ($Existing -and $Existing -match $Pattern) {
        return $Existing
    }

    if ($NonInteractive) {
        throw "$Name is missing. Run once without -NonInteractive to store it securely."
    }

    while ($true) {
        $SecureValue = Read-Host $Prompt -AsSecureString
        $PlainValue = Convert-SecureStringToPlainText $SecureValue
        if ($PlainValue -match $Pattern) {
            Set-VaultSecret -Name $Name -Value $PlainValue
            return $PlainValue
        }
        Write-Host "Invalid value. Expected $ExpectedDescription." -ForegroundColor Red
    }
}

function Set-ProcessValue {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Value
    )

    [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
}

function Invoke-NativeRequired {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host "`n==> $Name" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
    Write-Host "PASS: $Name" -ForegroundColor Green
}

function Invoke-StripeGet {
    param(
        [Parameter(Mandatory = $true)][string]$SecretKey,
        [Parameter(Mandatory = $true)][string]$Path
    )

    return Invoke-RestMethod `
        -Uri "https://api.stripe.com/v1$Path" `
        -Headers @{ Authorization = "Bearer $SecretKey" } `
        -Method Get `
        -TimeoutSec 45
}

function Invoke-StripePost {
    param(
        [Parameter(Mandatory = $true)][string]$SecretKey,
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][hashtable]$Body,
        [string]$IdempotencyKey
    )

    $Headers = @{ Authorization = "Bearer $SecretKey" }
    if ($IdempotencyKey) {
        $Headers["Idempotency-Key"] = $IdempotencyKey
    }

    return Invoke-RestMethod `
        -Uri "https://api.stripe.com/v1$Path" `
        -Headers $Headers `
        -Method Post `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $Body `
        -TimeoutSec 45
}

function Invoke-StripeDelete {
    param(
        [Parameter(Mandatory = $true)][string]$SecretKey,
        [Parameter(Mandatory = $true)][string]$Path
    )

    return Invoke-RestMethod `
        -Uri "https://api.stripe.com/v1$Path" `
        -Headers @{ Authorization = "Bearer $SecretKey" } `
        -Method Delete `
        -TimeoutSec 45
}

function Get-OrCreateStripePrice {
    param(
        [Parameter(Mandatory = $true)][string]$SecretKey,
        [Parameter(Mandatory = $true)][string]$LookupKey,
        [Parameter(Mandatory = $true)][string]$ProductName,
        [Parameter(Mandatory = $true)][int]$UnitAmount,
        [Parameter(Mandatory = $true)][string]$Currency
    )

    $EncodedLookup = [Uri]::EscapeDataString($LookupKey)
    $Existing = Invoke-StripeGet -SecretKey $SecretKey -Path "/prices?active=true&lookup_keys%5B%5D=$EncodedLookup&limit=1"
    if (@($Existing.data).Count -gt 0) {
        $Price = @($Existing.data)[0]
        if ([int]$Price.unit_amount -ne $UnitAmount -or [string]$Price.recurring.interval -ne "month") {
            throw "Stripe lookup key $LookupKey exists but does not match the required monthly amount."
        }
        Write-Host "Using existing Stripe price $($Price.id) for $ProductName." -ForegroundColor Green
        return [string]$Price.id
    }

    $Product = Invoke-StripePost `
        -SecretKey $SecretKey `
        -Path "/products" `
        -IdempotencyKey "vish-cloudflare-$LookupKey-product-v1" `
        -Body @{
            name = $ProductName
            description = "Managed automatically for Vishvakarma.OS Cloudflare billing"
            "metadata[managed_by]" = "vish-cloudflare-proof"
        }

    $Price = Invoke-StripePost `
        -SecretKey $SecretKey `
        -Path "/prices" `
        -IdempotencyKey "vish-cloudflare-$LookupKey-price-v1" `
        -Body @{
            product = [string]$Product.id
            currency = $Currency
            unit_amount = [string]$UnitAmount
            "recurring[interval]" = "month"
            lookup_key = $LookupKey
            "metadata[managed_by]" = "vish-cloudflare-proof"
        }

    Write-Host "Created Stripe price $($Price.id) for $ProductName." -ForegroundColor Green
    return [string]$Price.id
}

function Get-OrCreateWebhookSecret {
    param(
        [Parameter(Mandatory = $true)][string]$SecretKey,
        [Parameter(Mandatory = $true)][string]$EndpointUrl
    )

    $SavedSecret = Get-VaultSecret "STRIPE_WEBHOOK_SECRET"
    if ($SavedSecret -and $SavedSecret -match '^whsec_') {
        return $SavedSecret
    }

    $Endpoints = Invoke-StripeGet -SecretKey $SecretKey -Path "/webhook_endpoints?limit=100"
    $Existing = @($Endpoints.data) | Where-Object { [string]$_.url -eq $EndpointUrl } | Select-Object -First 1
    if ($Existing) {
        Write-Host "Recreating the dedicated proof webhook because Stripe never reveals an existing signing secret." -ForegroundColor Yellow
        [void](Invoke-StripeDelete -SecretKey $SecretKey -Path "/webhook_endpoints/$($Existing.id)")
    }

    $Webhook = Invoke-StripePost `
        -SecretKey $SecretKey `
        -Path "/webhook_endpoints" `
        -IdempotencyKey "vish-cloudflare-proof-webhook-v1" `
        -Body @{
            url = $EndpointUrl
            description = "Vishvakarma.OS Cloudflare production proof webhook"
            "enabled_events[0]" = "checkout.session.completed"
            "enabled_events[1]" = "customer.subscription.created"
            "enabled_events[2]" = "customer.subscription.updated"
            "enabled_events[3]" = "customer.subscription.deleted"
            "enabled_events[4]" = "invoice.paid"
            "enabled_events[5]" = "invoice.payment_failed"
            "metadata[managed_by]" = "vish-cloudflare-proof"
        }

    if (-not ([string]$Webhook.secret -match '^whsec_')) {
        throw "Stripe created a webhook endpoint but did not return a signing secret."
    }

    Set-VaultSecret -Name "STRIPE_WEBHOOK_SECRET" -Value ([string]$Webhook.secret)
    Write-Host "Created dedicated Stripe webhook endpoint $($Webhook.id)." -ForegroundColor Green
    return [string]$Webhook.secret
}

New-Item -ItemType Directory -Force -Path $LocalRoot | Out-Null
Set-Location $RepoRoot

if ($ResetVault -and (Test-Path $VaultPath)) {
    Remove-Item -Force $VaultPath
}

$Vault = @{}
if (Test-Path $VaultPath) {
    $LoadedVault = Get-Content -Raw -Path $VaultPath | ConvertFrom-Json -AsHashtable
    if ($LoadedVault) {
        $Vault = $LoadedVault
    }
}

try {
    Write-Host "VISHVAKARMA.OS CLOUDFLARE REPAIR + FINAL PROOFS" -ForegroundColor Cyan
    Write-Host "Repository: $RepoRoot"
    Write-Host "Target: $PagesUrl"
    Write-Host "Secrets are stored with Windows DPAPI for this user and computer only." -ForegroundColor Yellow

    $CurrentBranch = (git branch --show-current).Trim()
    if ($CurrentBranch -ne $ExpectedBranch) {
        throw "Wrong branch. Expected '$ExpectedBranch' but found '$CurrentBranch'."
    }

    $TrackedChanges = @(git status --porcelain --untracked-files=no)
    if ($TrackedChanges.Count -gt 0) {
        throw "Tracked local changes are present. Commit or stash them before running this repair."
    }

    Invoke-NativeRequired "Fetch migration branch" {
        git fetch origin $ExpectedBranch
    }
    Invoke-NativeRequired "Fast-forward migration branch" {
        git merge --ff-only "origin/$ExpectedBranch"
    }

    $SupabaseAccessToken = $null
    if (-not $SkipSupabaseConfigPush) {
        $SupabaseAccessToken = Get-OrPromptSecret `
            -Name "SUPABASE_ACCESS_TOKEN" `
            -Prompt "Paste your Supabase personal access token (hidden)" `
            -Pattern '^sbp_[A-Za-z0-9_-]+$' `
            -ExpectedDescription "a Supabase token beginning sbp_"
    }

    $SupabaseServiceRoleKey = Get-OrPromptSecret `
        -Name "SUPABASE_SERVICE_ROLE_KEY" `
        -Prompt "Paste the Vishvakarma.OS Supabase secret/service-role key (hidden)" `
        -Pattern '^(sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)$' `
        -ExpectedDescription "sb_secret_... or the legacy service-role JWT"

    $StripeSecretKey = Get-OrPromptSecret `
        -Name "STRIPE_SECRET_KEY" `
        -Prompt "Paste the Stripe secret key for the environment you want to test (hidden)" `
        -Pattern '^sk_(test|live)_[A-Za-z0-9]+$' `
        -ExpectedDescription "sk_test_... or sk_live_..."

    Set-ProcessValue "SUPABASE_URL" $SupabaseUrl
    Set-ProcessValue "SUPABASE_SERVICE_ROLE_KEY" $SupabaseServiceRoleKey
    Set-ProcessValue "VITE_SUPABASE_URL" $SupabaseUrl
    Set-ProcessValue "VITE_SUPABASE_ANON_KEY" $SupabasePublishableKey
    Set-ProcessValue "VITE_AUTH_REDIRECT_ORIGIN" $PagesUrl
    Set-ProcessValue "VITE_STRIPE_BILLING_ENABLED" "true"
    Set-ProcessValue "VITE_PRICING_PAGE_ENABLED" "true"
    Set-ProcessValue "STRIPE_SECRET_KEY" $StripeSecretKey
    Set-ProcessValue "APP_URL" $PagesUrl
    Set-ProcessValue "CLOUDFLARE_PAGES_URL" $PagesUrl
    Set-ProcessValue "PRODUCTION_URL" $PagesUrl
    if ($SupabaseAccessToken) {
        Set-ProcessValue "SUPABASE_ACCESS_TOKEN" $SupabaseAccessToken
    }

    Write-Host "`n==> Resolve Stripe products, prices and webhook" -ForegroundColor Cyan
    $StripeAccount = Invoke-StripeGet -SecretKey $StripeSecretKey -Path "/account"
    $Currency = if ([string]::IsNullOrWhiteSpace([string]$StripeAccount.default_currency)) {
        "aud"
    } else {
        ([string]$StripeAccount.default_currency).ToLowerInvariant()
    }
    Write-Host "Stripe account verified; billing currency is $($Currency.ToUpperInvariant())." -ForegroundColor Green

    $StudioPriceId = Get-OrCreateStripePrice `
        -SecretKey $StripeSecretKey `
        -LookupKey "vishvakarma_studio_monthly" `
        -ProductName "Vishvakarma.OS Studio" `
        -UnitAmount 49900 `
        -Currency $Currency

    $EnterprisePriceId = Get-OrCreateStripePrice `
        -SecretKey $StripeSecretKey `
        -LookupKey "vishvakarma_enterprise_monthly" `
        -ProductName "Vishvakarma.OS Enterprise" `
        -UnitAmount 100000 `
        -Currency $Currency

    $ProofWebhookUrl = "$($PagesUrl.TrimEnd('/'))/api/stripe/webhook?source=cloudflare-proof-v1"
    $WebhookSecret = Get-OrCreateWebhookSecret -SecretKey $StripeSecretKey -EndpointUrl $ProofWebhookUrl

    Set-VaultSecret -Name "STRIPE_PRICE_STUDIO_MONTHLY" -Value $StudioPriceId
    Set-VaultSecret -Name "STRIPE_PRICE_ENTERPRISE_MONTHLY" -Value $EnterprisePriceId
    Set-ProcessValue "STRIPE_PRICE_STUDIO_MONTHLY" $StudioPriceId
    Set-ProcessValue "STRIPE_PRICE_ENTERPRISE_MONTHLY" $EnterprisePriceId
    Set-ProcessValue "STRIPE_WEBHOOK_SECRET" $WebhookSecret
    Write-Host "PASS: Stripe products, prices and webhook resolved" -ForegroundColor Green

    New-Item -ItemType Directory -Force -Path $ShimRoot | Out-Null
    @"
@echo off
npx --yes pnpm@$PnpmVersion %*
"@ | Set-Content -Path $PnpmShim -Encoding ascii
    $env:PATH = "$ShimRoot;$env:PATH"

    Invoke-NativeRequired "Verify pnpm $PnpmVersion" {
        pnpm --version
    }
    Invoke-NativeRequired "Install locked dependencies" {
        pnpm install --frozen-lockfile
    }
    Invoke-NativeRequired "Verify Wrangler login" {
        npx --yes "wrangler@$WranglerVersion" whoami
    }

    if (-not $SkipSupabaseConfigPush) {
        Invoke-NativeRequired "Link Supabase project" {
            npx --yes supabase link --project-ref $SupabaseProjectRef
        }
        Invoke-NativeRequired "Push Supabase callback allow-list" {
            npx --yes supabase config push --yes
        }
    }

    $CloudflareSecrets = [ordered]@{
        SUPABASE_SERVICE_ROLE_KEY = $SupabaseServiceRoleKey
        STRIPE_SECRET_KEY = $StripeSecretKey
        STRIPE_WEBHOOK_SECRET = $WebhookSecret
        STRIPE_PRICE_STUDIO_MONTHLY = $StudioPriceId
        STRIPE_PRICE_ENTERPRISE_MONTHLY = $EnterprisePriceId
        APP_URL = $PagesUrl
    }
    $CloudflareSecrets | ConvertTo-Json -Depth 3 | Set-Content -Path $TempSecretFile -Encoding utf8
    Invoke-NativeRequired "Upload encrypted secrets to Cloudflare Pages" {
        npx --yes "wrangler@$WranglerVersion" pages secret bulk $TempSecretFile --project-name $ProjectName
    }
    Remove-Item -Force $TempSecretFile -ErrorAction SilentlyContinue

    if (-not $SkipCloudflareDeploy) {
        Invoke-NativeRequired "Build exact Cloudflare production artifact" {
            node .\scripts\vercel-build.mjs
        }

        $GitHead = (git rev-parse HEAD).Trim()
        Invoke-NativeRequired "Deploy exact commit and Pages Functions to Cloudflare" {
            npx --yes "wrangler@$WranglerVersion" pages deploy dist `
                --project-name $ProjectName `
                --branch $ExpectedBranch `
                --commit-hash $GitHead `
                --commit-message "Automated Cloudflare secret, auth and Stripe repair"
        }
    }

    $RunnerArguments = @(
        "-SkipPull",
        "-SkipInstall",
        "-SkipBrowserInstall",
        "-SkipRepositoryGates",
        "-DeploymentTimeoutMinutes", "12"
    )
    if ($ResetAuthSession) {
        $RunnerArguments += "-ResetAuthSession"
    }
    if ($NonInteractive) {
        $RunnerArguments += "-NonInteractive"
    }

    Write-Host "`n==> Run final Cloudflare proofs" -ForegroundColor Cyan
    & (Join-Path $RepoRoot "RUN_CLOUDFLARE_FINAL_PROOFS.ps1") @RunnerArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Final Cloudflare proofs are still blocked. Review the generated evidence summary."
    }

    Write-Host "`nCLOUDFLARE REPAIR AND FINAL PROOFS: PASS" -ForegroundColor Green
    Write-Host "Encrypted local vault: $VaultPath" -ForegroundColor Yellow
}
catch {
    Write-Host "`nCLOUDFLARE REPAIR BLOCKED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "No secret values were printed. Re-run the same command after correcting the reported blocker." -ForegroundColor Yellow
}
finally {
    Remove-Item -Force $TempSecretFile -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $ShimRoot -ErrorAction SilentlyContinue
}
