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
    [switch]$SkipRepositoryGates
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$SupabaseProjectRef = "jyocvwipthswfcmvqgqe"
$SupabaseUrl = "https://jyocvwipthswfcmvqgqe.supabase.co"
$SupabasePublishableKey = "sb_publishable_2vZsi4PoOlDb2lqs9mV0QQ_peQDtE6b"
$PnpmVersion = "9.15.0"
$WranglerVersion = "4.118.0"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$LocalRoot = Join-Path $RepoRoot ".local\cloudflare-proof"
$VaultPath = Join-Path $LocalRoot "adaptive-secrets.dpapi.json"
$LastRunPath = Join-Path $LocalRoot "autopilot-last-run.json"
$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$TranscriptPath = Join-Path $LocalRoot "supercharged-$RunId.log"
$StripeBootstrapPath = Join-Path $RepoRoot "scripts\deployment\bootstrap-stripe-cloudflare.mjs"
$ServerWebhookProofPath = Join-Path $RepoRoot "scripts\deployment\verify-cloudflare-server-webhook-proof.mjs"
$AuthCheckoutProofPath = Join-Path $RepoRoot "scripts\deployment\verify-cloudflare-interactive-auth-checkout.mjs"
$LiveProofPath = Join-Path $RepoRoot "scripts\deployment\verify-cloudflare-live.mjs"
$TempRoot = Join-Path $env:TEMP "vish-supercharged-$PID"
$PnpmShimRoot = Join-Path $TempRoot "pnpm"
$PnpmShim = Join-Path $PnpmShimRoot "pnpm.cmd"
$StripeBootstrapOutput = Join-Path $TempRoot "stripe-bootstrap.json"
$CloudflareSecretUpload = Join-Path $TempRoot "cloudflare-secrets.json"
$GeneratedIndexFlags = [System.Collections.Generic.List[string]]::new()
$Steps = [System.Collections.Generic.List[object]]::new()
$TranscriptStarted = $false
$ProofTokenUploaded = $false
$FinalResult = "BLOCKED"
$FinalReason = $null
$FinalEvidence = $null

function Add-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Status,
        [Parameter(Mandatory = $true)][string]$Detail,
        [double]$Seconds = 0
    )

    [void]$Steps.Add([pscustomobject]@{
        Name = $Name
        Status = $Status
        Detail = $Detail
        DurationSeconds = [Math]::Round($Seconds, 2)
        RecordedAt = (Get-Date).ToString("o")
    })
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    $Watch = [Diagnostics.Stopwatch]::StartNew()
    Write-Host "`n==> $Name" -ForegroundColor Cyan
    try {
        $Value = & $Command
        $Watch.Stop()
        Add-Step -Name $Name -Status "PASS" -Detail "Completed successfully" -Seconds $Watch.Elapsed.TotalSeconds
        Write-Host "PASS: $Name" -ForegroundColor Green
        return $Value
    }
    catch {
        $Watch.Stop()
        $Message = $_.Exception.Message
        Add-Step -Name $Name -Status "FAIL" -Detail $Message -Seconds $Watch.Elapsed.TotalSeconds
        Write-Host "FAIL: $Name - $Message" -ForegroundColor Red
        throw
    }
}

function Invoke-NativeRequired {
    param([Parameter(Mandatory = $true)][scriptblock]$Command)

    $global:LASTEXITCODE = 0
    $Output = & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Native command returned exit code $LASTEXITCODE"
    }
    return $Output
}

function Invoke-WithRetry {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    $LastError = $null
    for ($Attempt = 1; $Attempt -le $MaxAttempts; $Attempt++) {
        try {
            return Invoke-Step "$Name (attempt $Attempt/$MaxAttempts)" $Command
        }
        catch {
            $LastError = $_
            if ($Attempt -ge $MaxAttempts) { throw }
            Write-Host "Retrying in $RetryDelaySeconds second(s)..." -ForegroundColor Yellow
            Start-Sleep -Seconds $RetryDelaySeconds
        }
    }
    if ($LastError) { throw $LastError }
}

function Convert-SecureStringToPlainText {
    param([Parameter(Mandatory = $true)][Security.SecureString]$SecureValue)

    $Pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Pointer) }
}

function Save-Vault {
    $script:Vault | ConvertTo-Json -Depth 4 | Set-Content -Path $VaultPath -Encoding utf8
}

function Set-VaultSecret {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Value
    )

    $Secure = ConvertTo-SecureString $Value -AsPlainText -Force
    $script:Vault[$Name] = ConvertFrom-SecureString $Secure
    Save-Vault
}

function Get-VaultSecret {
    param([Parameter(Mandatory = $true)][string]$Name)

    $ProcessValue = [Environment]::GetEnvironmentVariable($Name, "Process")
    if (-not [string]::IsNullOrWhiteSpace($ProcessValue)) { return $ProcessValue.Trim() }
    if (-not $script:Vault.ContainsKey($Name)) { return $null }

    try {
        $Secure = ConvertTo-SecureString ([string]$script:Vault[$Name])
        return (Convert-SecureStringToPlainText $Secure).Trim()
    }
    catch {
        $script:Vault.Remove($Name)
        Save-Vault
        return $null
    }
}

function Get-HiddenSecret {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Prompt,
        [Parameter(Mandatory = $true)][string]$Pattern
    )

    $Existing = Get-VaultSecret $Name
    if ($Existing -and $Existing -match $Pattern) { return $Existing }
    if ($NonInteractive) { throw "$Name is unavailable in unattended mode." }

    while ($true) {
        $Value = Convert-SecureStringToPlainText (Read-Host $Prompt -AsSecureString)
        if ($Value -match $Pattern) {
            Set-VaultSecret -Name $Name -Value $Value
            return $Value
        }
        Write-Host "That value did not match the expected secret format." -ForegroundColor Red
    }
}

function Import-EnvironmentFile {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return }
    foreach ($Line in Get-Content -LiteralPath $Path) {
        $Trimmed = $Line.Trim()
        if ([string]::IsNullOrWhiteSpace($Trimmed) -or $Trimmed.StartsWith('#')) { continue }
        if ($Trimmed -notmatch '^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { continue }
        $Name = $Matches[1]
        $Value = $Matches[2].Trim().Trim('"').Trim("'")
        if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($Name, "Process"))) {
            [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
        }
    }
}

function Set-ProcessValue {
    param([string]$Name, [string]$Value)
    [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
}

function Get-TrackedGeneratedPaths {
    return @(
        git ls-files -- dist docs/release/evidence public/build-meta.json |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
            Select-Object -Unique
    )
}

function Enable-GeneratedIsolation {
    foreach ($Path in @(Get-TrackedGeneratedPaths)) {
        git update-index --no-skip-worktree -- $Path 2>$null
        git update-index --skip-worktree -- $Path
        if ($LASTEXITCODE -ne 0) { throw "Could not isolate generated file: $Path" }
        [void]$GeneratedIndexFlags.Add($Path)
    }
}

function Disable-GeneratedIsolation {
    foreach ($Path in $GeneratedIndexFlags) {
        git update-index --no-skip-worktree -- $Path 2>$null
        git restore --staged --worktree -- $Path 2>$null
    }
    $GeneratedIndexFlags.Clear()
}

function Test-LiveHealthReady {
    try {
        $Response = Invoke-WebRequest -Uri "$($PagesUrl.TrimEnd('/'))/api/health" -SkipHttpErrorCheck -TimeoutSec 30 -Headers @{ "Cache-Control" = "no-cache" }
        if ([int]$Response.StatusCode -ne 200) { return $false }
        $Payload = $Response.Content | ConvertFrom-Json
        return $Payload.ok -eq $true
    }
    catch { return $false }
}

function Upload-CloudflareSecrets {
    param([Parameter(Mandatory = $true)][hashtable]$Values)

    $Values | ConvertTo-Json -Depth 4 | Set-Content -Path $CloudflareSecretUpload -Encoding utf8
    try {
        Invoke-NativeRequired {
            npx --yes "wrangler@$WranglerVersion" pages secret bulk $CloudflareSecretUpload --project-name $ProjectName
        } | Out-Null
    }
    finally {
        Remove-Item -Force $CloudflareSecretUpload -ErrorAction SilentlyContinue
    }
}

function New-ProofToken {
    $Bytes = [Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
    return [Convert]::ToBase64String($Bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Deploy-ExactCommit {
    if ($SkipCloudflareDeploy) { return }
    $Head = (git rev-parse HEAD).Trim()
    Invoke-WithRetry "Deploy exact commit to Cloudflare" {
        Invoke-NativeRequired {
            npx --yes "wrangler@$WranglerVersion" pages deploy dist `
                --project-name $ProjectName `
                --branch $ExpectedBranch `
                --commit-hash $Head `
                --commit-message "Vish supercharged adaptive release proof"
        }
    } | Out-Null
}

function Wait-And-VerifyLive {
    $Head = (git rev-parse HEAD).Trim()
    Set-ProcessValue "EXPECTED_GIT_SHA" $Head
    Invoke-WithRetry "Verify live exact commit, routes, API and PWA" {
        Invoke-NativeRequired { node $LiveProofPath }
    } | Out-Null
}

function Get-LatestAuthEvidence {
    param([datetime]$Since)

    $EvidenceRoot = Join-Path $RepoRoot "evidence\cloudflare-cutover"
    if (-not (Test-Path $EvidenceRoot)) { return $null }
    $File = Get-ChildItem -Path $EvidenceRoot -Filter "auth-checkout-*.json" -File |
        Where-Object { $_.LastWriteTime -ge $Since.AddSeconds(-5) } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $File) { return $null }
    try {
        return [pscustomobject]@{
            Path = $File.FullName
            Payload = Get-Content -Raw -Path $File.FullName | ConvertFrom-Json
        }
    }
    catch { return $null }
}

function Test-HistoricalCallbackProof {
    $EvidenceRoot = Join-Path $RepoRoot "evidence\cloudflare-cutover"
    if (-not (Test-Path $EvidenceRoot)) { return $false }
    foreach ($File in Get-ChildItem -Path $EvidenceRoot -Filter "auth-checkout-*.json" -File | Sort-Object LastWriteTime -Descending) {
        try {
            $Payload = Get-Content -Raw -Path $File.FullName | ConvertFrom-Json
            $Callback = @($Payload.results) | Where-Object {
                [string]$_.name -eq 'Supabase Google callback returns to editor' -and $_.pass -eq $true
            }
            if ($Callback.Count -gt 0) { return $true }
        }
        catch { }
    }
    return $false
}

function Invoke-AuthCheckoutProof {
    param([switch]$ForceReset)

    $Started = Get-Date
    $Arguments = [System.Collections.Generic.List[string]]::new()
    [void]$Arguments.Add($AuthCheckoutProofPath)
    if ($ForceReset) { [void]$Arguments.Add('--reset-session') }
    if ($NonInteractive) { [void]$Arguments.Add('--non-interactive') }

    $global:LASTEXITCODE = 0
    & node @Arguments
    $Evidence = Get-LatestAuthEvidence -Since $Started
    if (-not $Evidence) {
        return [pscustomobject]@{
            AuthPass = $false
            CheckoutPass = $false
            CallbackPass = $false
            Detail = 'No auth/checkout evidence was generated.'
            Evidence = $null
        }
    }

    $Results = @($Evidence.Payload.results)
    $SessionOpen = @($Results | Where-Object { $_.name -eq 'Saved Supabase session opens the editor' -and $_.pass -eq $true }).Count -gt 0
    $SessionRefresh = @($Results | Where-Object { $_.name -eq 'Supabase session persists after refresh' -and $_.pass -eq $true }).Count -gt 0
    $CallbackCurrent = @($Results | Where-Object { $_.name -eq 'Supabase Google callback returns to editor' -and $_.pass -eq $true }).Count -gt 0
    $CallbackPass = $CallbackCurrent -or (Test-HistoricalCallbackProof)
    $CheckoutPass = @($Results | Where-Object { $_.name -eq 'Stripe Checkout opens from the Studio plan' -and $_.pass -eq $true }).Count -gt 0
    $Failures = @($Results | Where-Object { $_.pass -ne $true } | ForEach-Object { "$($_.name): $($_.detail)" })

    return [pscustomobject]@{
        AuthPass = $SessionOpen -and $SessionRefresh -and $CallbackPass
        CheckoutPass = $CheckoutPass
        CallbackPass = $CallbackPass
        Detail = if ($Failures.Count -gt 0) { $Failures -join ' | ' } else { 'All auth and checkout checks passed.' }
        Evidence = $Evidence.Path
    }
}

function Ensure-SupabaseCliConfiguration {
    if ($SkipSupabaseConfigPush) {
        throw "Authentication proof failed and Supabase configuration push is disabled."
    }

    $LoggedIn = $true
    $global:LASTEXITCODE = 0
    npx --yes supabase@latest projects list --output json *> $null
    if ($LASTEXITCODE -ne 0) { $LoggedIn = $false }

    if (-not $LoggedIn) {
        if ($NonInteractive) { throw "Supabase CLI is not authenticated in unattended mode." }
        Write-Host "Supabase browser login is required once; no access token paste is needed." -ForegroundColor Yellow
        Invoke-NativeRequired { npx --yes supabase@latest login --name vish-cloudflare-release }
    }

    Invoke-NativeRequired { npx --yes supabase@latest link --project-ref $SupabaseProjectRef }
    Invoke-NativeRequired { npx --yes supabase@latest config push --yes }
}

function Get-StripeConfigPath {
    $Candidates = @(
        (Join-Path $HOME ".config\stripe\config.toml"),
        (Join-Path $env:USERPROFILE ".config\stripe\config.toml"),
        (Join-Path $env:APPDATA "stripe\config.toml")
    ) | Select-Object -Unique
    return $Candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
}

function Read-StripeCliKey {
    $ConfigPath = Get-StripeConfigPath
    if (-not $ConfigPath) { return $null }
    $KeyName = if ($env:VISH_STRIPE_MODE -eq 'live') { 'live_mode_api_key' } else { 'test_mode_api_key' }
    foreach ($Line in Get-Content -LiteralPath $ConfigPath) {
        if ($Line -match "^\s*$KeyName\s*=") {
            return (($Line -split '=', 2)[1]).Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

function Ensure-StripeKey {
    $Existing = Get-VaultSecret "STRIPE_SECRET_KEY"
    if ($Existing -and $Existing -match '^(sk|rk)_(test|live)_') { return $Existing }

    $CliKey = Read-StripeCliKey
    if (-not $CliKey) {
        if ($NonInteractive) { throw "Stripe CLI is not authenticated in unattended mode." }
        Write-Host "Stripe browser login is required once; the controller will use its restricted test key." -ForegroundColor Yellow
        '' | npx --yes "@stripe/cli" login --project-name vishvakarma-os
        if ($LASTEXITCODE -ne 0) { throw "Stripe CLI browser login failed." }
        $CliKey = Read-StripeCliKey
    }

    if ($CliKey -and $CliKey -match '^(sk|rk)_(test|live)_') {
        Set-VaultSecret -Name "STRIPE_SECRET_KEY" -Value $CliKey
        return $CliKey
    }

    return Get-HiddenSecret `
        -Name "STRIPE_SECRET_KEY" `
        -Prompt "Paste a Stripe test or live secret key (hidden)" `
        -Pattern '^(sk|rk)_(test|live)_[A-Za-z0-9]+$'
}

function Bootstrap-StripeBilling {
    $StripeKey = Ensure-StripeKey
    Set-ProcessValue "STRIPE_SECRET_KEY" $StripeKey
    Remove-Item -Force $StripeBootstrapOutput -ErrorAction SilentlyContinue

    try {
        Invoke-NativeRequired { node $StripeBootstrapPath --output $StripeBootstrapOutput }
    }
    catch {
        if ($StripeKey.StartsWith('rk_') -and -not $NonInteractive) {
            Write-Host "The Stripe CLI restricted key lacked a required permission. A full Stripe secret key is needed once." -ForegroundColor Yellow
            $script:Vault.Remove('STRIPE_SECRET_KEY')
            Save-Vault
            $StripeKey = Get-HiddenSecret `
                -Name "STRIPE_SECRET_KEY" `
                -Prompt "Paste the Stripe secret key with product, price and webhook permissions (hidden)" `
                -Pattern '^sk_(test|live)_[A-Za-z0-9]+$'
            Set-ProcessValue "STRIPE_SECRET_KEY" $StripeKey
            Invoke-NativeRequired { node $StripeBootstrapPath --output $StripeBootstrapOutput }
        }
        else { throw }
    }

    $Bootstrap = Get-Content -Raw -Path $StripeBootstrapOutput | ConvertFrom-Json
    $Upload = @{
        STRIPE_SECRET_KEY = [string]$Bootstrap.STRIPE_SECRET_KEY
        STRIPE_WEBHOOK_SECRET = [string]$Bootstrap.STRIPE_WEBHOOK_SECRET
        STRIPE_PRICE_STUDIO_MONTHLY = [string]$Bootstrap.STRIPE_PRICE_STUDIO_MONTHLY
        STRIPE_PRICE_ENTERPRISE_MONTHLY = [string]$Bootstrap.STRIPE_PRICE_ENTERPRISE_MONTHLY
        APP_URL = [string]$Bootstrap.APP_URL
    }
    Upload-CloudflareSecrets -Values $Upload
    Set-ProcessValue "STRIPE_WEBHOOK_SECRET" $Upload.STRIPE_WEBHOOK_SECRET
    Set-ProcessValue "STRIPE_PRICE_STUDIO_MONTHLY" $Upload.STRIPE_PRICE_STUDIO_MONTHLY
    Set-ProcessValue "STRIPE_PRICE_ENTERPRISE_MONTHLY" $Upload.STRIPE_PRICE_ENTERPRISE_MONTHLY
    Remove-Item -Force $StripeBootstrapOutput -ErrorAction SilentlyContinue
}

function Invoke-ServerWebhookProof {
    $global:LASTEXITCODE = 0
    & node $ServerWebhookProofPath
    return $LASTEXITCODE -eq 0
}

function Write-CoreResult {
    param([string]$Result, [string]$Reason, [string]$Evidence)

    $Payload = [pscustomobject]@{
        GeneratedAt = (Get-Date).ToString("o")
        Result = $Result
        Reason = $Reason
        Repository = $RepoRoot
        Branch = (git branch --show-current).Trim()
        GitHead = (git rev-parse HEAD).Trim()
        Target = $PagesUrl
        FinalSummary = $Evidence
        Transcript = $TranscriptPath
        Steps = @($Steps)
    }
    $Payload | ConvertTo-Json -Depth 10 | Set-Content -Path $LastRunPath -Encoding utf8
}

New-Item -ItemType Directory -Force -Path $LocalRoot | Out-Null
New-Item -ItemType Directory -Force -Path $TempRoot | Out-Null
Set-Location $RepoRoot

$Vault = @{}
if ($ResetVault -and (Test-Path $VaultPath)) { Remove-Item -Force $VaultPath }
if (Test-Path $VaultPath) {
    try { $Vault = Get-Content -Raw -Path $VaultPath | ConvertFrom-Json -AsHashtable } catch { $Vault = @{} }
}

try {
    Start-Transcript -Path $TranscriptPath -Force | Out-Null
    $TranscriptStarted = $true

    Write-Host "VISHVAKARMA.OS SUPERCHARGED ADAPTIVE CORE" -ForegroundColor Cyan
    Write-Host "Target: $PagesUrl"
    Write-Host "Supabase and Stripe are proved remotely before any credential fallback is attempted." -ForegroundColor Yellow

    $Branch = (git branch --show-current).Trim()
    if ($Branch -ne $ExpectedBranch) { throw "Wrong branch: $Branch" }

    foreach ($File in @('.env.stripe.local', '.env.local', '.dev.vars.local', '.dev.vars')) {
        Import-EnvironmentFile -Path (Join-Path $RepoRoot $File)
    }

    New-Item -ItemType Directory -Force -Path $PnpmShimRoot | Out-Null
    "@echo off`r`nnpx --yes pnpm@$PnpmVersion %*`r`n" | Set-Content -Path $PnpmShim -Encoding ascii
    $env:PATH = "$PnpmShimRoot;$env:PATH"

    Set-ProcessValue "SUPABASE_URL" $SupabaseUrl
    Set-ProcessValue "VITE_SUPABASE_URL" $SupabaseUrl
    Set-ProcessValue "VITE_SUPABASE_ANON_KEY" $SupabasePublishableKey
    Set-ProcessValue "VITE_AUTH_REDIRECT_ORIGIN" $PagesUrl
    Set-ProcessValue "VITE_STRIPE_BILLING_ENABLED" "true"
    Set-ProcessValue "VITE_PRICING_PAGE_ENABLED" "true"
    Set-ProcessValue "APP_URL" $PagesUrl
    Set-ProcessValue "CLOUDFLARE_PAGES_URL" $PagesUrl
    Set-ProcessValue "PRODUCTION_URL" $PagesUrl

    Enable-GeneratedIsolation

    Invoke-Step "Install locked dependencies" {
        Invoke-NativeRequired { pnpm install --frozen-lockfile }
    } | Out-Null

    if (-not $SkipBrowserInstall) {
        Invoke-Step "Install or verify Playwright Chromium" {
            Invoke-NativeRequired { pnpm exec playwright install chromium }
        } | Out-Null
    }

    if (-not (Test-LiveHealthReady)) {
        $ServiceRole = Get-HiddenSecret `
            -Name "SUPABASE_SERVICE_ROLE_KEY" `
            -Prompt "Cloudflare health is not ready. Paste the Supabase service-role/secret key (hidden)" `
            -Pattern '^(sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)$'
        Set-ProcessValue "SUPABASE_SERVICE_ROLE_KEY" $ServiceRole
        Upload-CloudflareSecrets -Values @{ SUPABASE_SERVICE_ROLE_KEY = $ServiceRole }
    }
    else {
        Write-Host "PASS: Live health proves the existing Cloudflare Supabase server configuration." -ForegroundColor Green
    }

    $ProofToken = New-ProofToken
    Set-ProcessValue "CLOUDFLARE_PROOF_TOKEN" $ProofToken
    Upload-CloudflareSecrets -Values @{ CLOUDFLARE_PROOF_TOKEN = $ProofToken }
    $ProofTokenUploaded = $true

    if (-not $SkipRepositoryGates) {
        Invoke-Step "Full repository production build gates" {
            Invoke-NativeRequired { node .\scripts\vercel-build.mjs }
        } | Out-Null
        Invoke-Step "System contract gates" {
            Invoke-NativeRequired { pnpm run contract:gates }
        } | Out-Null
        Invoke-Step "Authentication configuration gates" {
            Invoke-NativeRequired { pnpm run auth:gates }
        } | Out-Null
        Invoke-Step "PWA configuration gates" {
            Invoke-NativeRequired { pnpm run pwa:gates }
        } | Out-Null
    }
    elseif (-not (Test-Path (Join-Path $RepoRoot 'dist\index.html'))) {
        Invoke-Step "Build Cloudflare artifact" {
            Invoke-NativeRequired { node .\scripts\vercel-build.mjs }
        } | Out-Null
    }

    Deploy-ExactCommit
    Wait-And-VerifyLive

    $AuthResult = Invoke-AuthCheckoutProof -ForceReset:$ResetAuthSession
    if (-not $AuthResult.AuthPass) {
        Invoke-Step "Repair Supabase callback configuration through browser-authenticated CLI" {
            Ensure-SupabaseCliConfiguration
        } | Out-Null
        $AuthResult = Invoke-AuthCheckoutProof -ForceReset
    }
    if (-not $AuthResult.AuthPass) {
        throw "Supabase callback/session proof failed after automatic repair: $($AuthResult.Detail)"
    }

    $WebhookPass = Invoke-ServerWebhookProof
    if (-not $AuthResult.CheckoutPass -or -not $WebhookPass) {
        Invoke-Step "Automatically bootstrap Stripe prices, Checkout and webhook" {
            Bootstrap-StripeBilling
        } | Out-Null
        Deploy-ExactCommit
        Wait-And-VerifyLive
        $AuthResult = Invoke-AuthCheckoutProof
        $WebhookPass = Invoke-ServerWebhookProof
    }

    if (-not $AuthResult.CheckoutPass) {
        throw "Stripe Checkout proof failed after automatic bootstrap: $($AuthResult.Detail)"
    }
    if (-not $WebhookPass) {
        throw "The protected server-side Stripe webhook signature proof failed after automatic bootstrap."
    }

    Wait-And-VerifyLive
    $FinalEvidence = $AuthResult.Evidence
    $FinalResult = "PASS"
    $FinalReason = "Exact commit, health, Supabase callback/session, Stripe Checkout, server-side signed webhook, deep routes, API security and PWA all passed."
    Write-CoreResult -Result $FinalResult -Reason $FinalReason -Evidence $FinalEvidence
    Write-Host "`nVISH SUPERCHARGED CORE: PASS" -ForegroundColor Green
    $global:LASTEXITCODE = 0
}
catch {
    $FinalResult = "BLOCKED"
    $FinalReason = $_.Exception.Message
    Write-CoreResult -Result $FinalResult -Reason $FinalReason -Evidence $FinalEvidence
    Write-Host "`nVISH SUPERCHARGED CORE: BLOCKED" -ForegroundColor Red
    Write-Host $FinalReason -ForegroundColor Red
    Write-Host "No secret values were printed or committed." -ForegroundColor Yellow
    $global:LASTEXITCODE = 1
}
finally {
    if ($ProofTokenUploaded) {
        try {
            'y' | npx --yes "wrangler@$WranglerVersion" pages secret delete CLOUDFLARE_PROOF_TOKEN --project-name $ProjectName *> $null
            Write-Host "Removed the ephemeral Cloudflare proof token." -ForegroundColor Green
        }
        catch {
            Write-Warning "Could not remove CLOUDFLARE_PROOF_TOKEN automatically. Delete that temporary secret in Cloudflare."
        }
    }
    Disable-GeneratedIsolation
    Remove-Item -Recurse -Force $TempRoot -ErrorAction SilentlyContinue
    if ($TranscriptStarted) { Stop-Transcript | Out-Null }
}
