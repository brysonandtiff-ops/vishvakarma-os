[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$ProjectName = "vishvakarma-os",
    [switch]$ResetStripeKey,
    [switch]$LiveMode,
    [switch]$Rebuild,
    [switch]$SkipGitSync,
    [switch]$SkipFocusedTests,
    [switch]$ForceStripeLogin,
    [switch]$AllowManualKeyFallback
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if (-not $IsWindows) {
    throw "Stripe checkout autopilot currently requires Windows DPAPI."
}

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$PnpmVersion = "9.15.0"
$VaultRoot = Join-Path $RepoRoot ".local\cloudflare-auth"
$VaultPath = Join-Path $VaultRoot "stripe-server-key.clixml"
$ToolRoot = Join-Path $RepoRoot ".local\tools\stripe"
$LocalStripeExe = Join-Path $ToolRoot "stripe.exe"
$Finalizer = Join-Path $RepoRoot "scripts\deployment\vish-stripe-checkout-finalizer.mjs"
$WindowsCompat = Join-Path $RepoRoot "scripts\deployment\windows-command-spawn-compat.cjs"
$DistIndex = Join-Path $RepoRoot "dist\index.html"
$BuildMetadata = Join-Path $RepoRoot "dist\build-meta.json"

Set-Location $RepoRoot

function Invoke-NativeChecked {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )

    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

function Normalize-GeneratedState {
    Remove-Item (Join-Path $RepoRoot "supabase\.temp") `
        -Recurse `
        -Force `
        -ErrorAction SilentlyContinue

    git restore --staged --worktree -- "supabase/.temp" 2>$null
    $global:LASTEXITCODE = 0
}

function Get-RealRepositoryChanges {
    $AllowedPrefixes = @(
        "?? .local/",
        "?? evidence/cloudflare-cutover/",
        "?? supabase/.temp/"
    )

    return @(
        git status --porcelain | Where-Object {
            $Line = [string]$_
            -not ($AllowedPrefixes | Where-Object { $Line.StartsWith($_) })
        }
    )
}

function Assert-IgnoredPath {
    param([Parameter(Mandatory = $true)][string]$AbsolutePath)

    $RelativePath = [System.IO.Path]::GetRelativePath($RepoRoot, $AbsolutePath).Replace("\", "/")
    $global:LASTEXITCODE = 0
    git check-ignore --quiet -- $RelativePath
    if ($LASTEXITCODE -ne 0) {
        throw "$RelativePath must be excluded by .gitignore before release credentials or tools can be stored."
    }
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

function Test-StripeKeyAccess {
    param([Parameter(Mandatory = $true)][string]$Key)

    try {
        $Account = Invoke-RestMethod `
            -Method Get `
            -Uri "https://api.stripe.com/v1/account" `
            -Headers @{ Authorization = "Bearer $Key" } `
            -TimeoutSec 30

        if ([string]::IsNullOrWhiteSpace([string]$Account.id)) {
            throw "Stripe returned no account identifier."
        }
    }
    catch {
        throw "Stripe rejected the server key or it lacks required account access: $($_.Exception.Message)"
    }
}

function Save-StripeKeyVault {
    param([Parameter(Mandatory = $true)][string]$Key)

    Assert-StripeKeyMode -Key $Key
    $SecureKey = ConvertTo-SecureString $Key -AsPlainText -Force
    $Credential = [System.Management.Automation.PSCredential]::new(
        "stripe-server-key",
        $SecureKey
    )
    $Credential | Export-Clixml -LiteralPath $VaultPath -Force
    Remove-Variable Credential -ErrorAction SilentlyContinue
    Remove-Variable SecureKey -ErrorAction SilentlyContinue
}

function Read-StripeKeyVault {
    if (-not (Test-Path -LiteralPath $VaultPath -PathType Leaf)) {
        return $null
    }

    $StoredCredential = Import-Clixml -LiteralPath $VaultPath
    if (-not ($StoredCredential -is [System.Management.Automation.PSCredential])) {
        throw "The Stripe key vault is invalid. Re-run with -ResetStripeKey."
    }

    $Key = $StoredCredential.GetNetworkCredential().Password
    Remove-Variable StoredCredential -ErrorAction SilentlyContinue
    Assert-StripeKeyMode -Key $Key
    return $Key
}

function Get-StripeConfigCandidates {
    return @(
        (Join-Path $HOME ".config\stripe\config.toml"),
        $(if ($env:APPDATA) { Join-Path $env:APPDATA "stripe\config.toml" } else { $null }),
        $(if ($env:USERPROFILE) { Join-Path $env:USERPROFILE ".config\stripe\config.toml" } else { $null })
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique
}

function Read-StripeCliKey {
    $KeyName = if ($LiveMode) { "live_mode_api_key" } else { "test_mode_api_key" }
    $Pattern = "^\s*$([regex]::Escape($KeyName))\s*=\s*['\"]?([^'\"\s#]+)"

    foreach ($ConfigPath in Get-StripeConfigCandidates) {
        if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
            continue
        }

        foreach ($Line in Get-Content -LiteralPath $ConfigPath) {
            $Match = [regex]::Match($Line, $Pattern)
            if ($Match.Success) {
                $Key = $Match.Groups[1].Value.Trim()
                if ($Key) {
                    Assert-StripeKeyMode -Key $Key
                    return $Key
                }
            }
        }
    }

    return $null
}

function Install-OfficialStripeCli {
    if (Test-Path -LiteralPath $LocalStripeExe -PathType Leaf) {
        return $LocalStripeExe
    }

    Write-Host "ISC:: INSTALL CHECKSUM-VERIFIED OFFICIAL STRIPE CLI" -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $ToolRoot | Out-Null

    $Architecture = if ([Environment]::Is64BitOperatingSystem) { "x86_64" } else { "i386" }
    $Headers = @{
        "User-Agent" = "Vishvakarma.OS-Stripe-Autopilot"
        "Accept" = "application/vnd.github+json"
        "X-GitHub-Api-Version" = "2022-11-28"
    }
    $Release = Invoke-RestMethod `
        -Uri "https://api.github.com/repos/stripe/stripe-cli/releases/latest" `
        -Headers $Headers `
        -TimeoutSec 45

    $ZipAsset = @($Release.assets | Where-Object {
        $_.name -match "^stripe_.*_windows_$Architecture\.zip$"
    }) | Select-Object -First 1
    $ChecksumAsset = @($Release.assets | Where-Object {
        $_.name -eq "stripe-windows-checksums.txt"
    }) | Select-Object -First 1

    if (-not $ZipAsset -or -not $ChecksumAsset) {
        throw "The official Stripe CLI release did not contain the expected Windows archive and checksum file."
    }

    $TempRoot = Join-Path $env:TEMP "vish-stripe-cli-$PID"
    $ZipPath = Join-Path $TempRoot $ZipAsset.name
    $ChecksumPath = Join-Path $TempRoot $ChecksumAsset.name

    Remove-Item -LiteralPath $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $TempRoot | Out-Null

    try {
        Invoke-WebRequest `
            -Uri $ZipAsset.browser_download_url `
            -Headers $Headers `
            -OutFile $ZipPath `
            -TimeoutSec 120
        Invoke-WebRequest `
            -Uri $ChecksumAsset.browser_download_url `
            -Headers $Headers `
            -OutFile $ChecksumPath `
            -TimeoutSec 45

        $ChecksumLine = Get-Content -LiteralPath $ChecksumPath | Where-Object {
            $_ -match [regex]::Escape($ZipAsset.name)
        } | Select-Object -First 1

        if (-not $ChecksumLine) {
            throw "The official Stripe checksum file did not contain $($ZipAsset.name)."
        }

        $ExpectedHash = ([regex]::Match($ChecksumLine, '^[A-Fa-f0-9]{64}')).Value.ToLowerInvariant()
        $ActualHash = (Get-FileHash -LiteralPath $ZipPath -Algorithm SHA256).Hash.ToLowerInvariant()

        if (-not $ExpectedHash -or $ActualHash -ne $ExpectedHash) {
            throw "Stripe CLI SHA-256 verification failed."
        }

        Remove-Item -LiteralPath $ToolRoot -Recurse -Force -ErrorAction SilentlyContinue
        New-Item -ItemType Directory -Force -Path $ToolRoot | Out-Null
        Expand-Archive -LiteralPath $ZipPath -DestinationPath $ToolRoot -Force

        $Extracted = Get-ChildItem -LiteralPath $ToolRoot -Filter "stripe.exe" -Recurse |
            Select-Object -First 1
        if (-not $Extracted) {
            throw "The verified Stripe CLI archive did not contain stripe.exe."
        }

        if ($Extracted.FullName -ne $LocalStripeExe) {
            Copy-Item -LiteralPath $Extracted.FullName -Destination $LocalStripeExe -Force
        }

        & $LocalStripeExe version *> $null
        if ($LASTEXITCODE -ne 0) {
            throw "The installed Stripe CLI could not start."
        }

        Write-Host "PASS: Official Stripe CLI installed and SHA-256 verified" -ForegroundColor Green
        return $LocalStripeExe
    }
    finally {
        Remove-Item -LiteralPath $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Get-StripeCliPath {
    $Installed = Get-Command stripe -ErrorAction SilentlyContinue
    if ($Installed) {
        return $Installed.Source
    }
    return Install-OfficialStripeCli
}

function Invoke-AutomaticStripeLogin {
    param([Parameter(Mandatory = $true)][string]$StripeCli)

    Write-Host "`nISC:: AUTHORIZE STRIPE CLI" -ForegroundColor Cyan
    Write-Host "Stripe will open one official browser approval page. Approve it once; no key copying is required." -ForegroundColor Yellow

    $StartInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $StartInfo.FileName = $StripeCli
    $StartInfo.Arguments = "login"
    $StartInfo.UseShellExecute = $false
    $StartInfo.RedirectStandardInput = $true
    $StartInfo.RedirectStandardOutput = $false
    $StartInfo.RedirectStandardError = $false
    $StartInfo.CreateNoWindow = $false

    $Process = [System.Diagnostics.Process]::new()
    $Process.StartInfo = $StartInfo
    if (-not $Process.Start()) {
        throw "Stripe CLI login could not start."
    }

    Start-Sleep -Milliseconds 800
    $Process.StandardInput.WriteLine()
    $Process.StandardInput.Flush()
    $Process.WaitForExit()

    if ($Process.ExitCode -ne 0) {
        throw "Stripe CLI authorization failed with exit code $($Process.ExitCode)."
    }

    Write-Host "PASS: Stripe CLI authorization completed" -ForegroundColor Green
}

function Get-OrProvisionStripeKey {
    if ($ResetStripeKey -and (Test-Path -LiteralPath $VaultPath)) {
        Remove-Item -LiteralPath $VaultPath -Force
        Write-Host "PASS: Previous encrypted Stripe server key removed" -ForegroundColor Green
    }

    if (-not $ForceStripeLogin) {
        $VaultKey = Read-StripeKeyVault
        if ($VaultKey) {
            Test-StripeKeyAccess -Key $VaultKey
            Write-Host "PASS: Windows-encrypted Stripe server key reused" -ForegroundColor Green
            return $VaultKey
        }

        $ExistingCliKey = Read-StripeCliKey
        if ($ExistingCliKey) {
            Test-StripeKeyAccess -Key $ExistingCliKey
            Save-StripeKeyVault -Key $ExistingCliKey
            Write-Host "PASS: Existing Stripe CLI key validated and encrypted locally" -ForegroundColor Green
            return $ExistingCliKey
        }
    }

    $StripeCli = Get-StripeCliPath
    Invoke-AutomaticStripeLogin -StripeCli $StripeCli
    $CliKey = Read-StripeCliKey

    if ($CliKey) {
        Test-StripeKeyAccess -Key $CliKey
        Save-StripeKeyVault -Key $CliKey
        Write-Host "PASS: Stripe CLI key validated and encrypted for unattended reuse" -ForegroundColor Green
        return $CliKey
    }

    if ($AllowManualKeyFallback) {
        Write-Host "Stripe CLI did not write a usable key; using the explicitly enabled hidden fallback." -ForegroundColor Yellow
        $SecureKey = Read-Host "Stripe server key" -AsSecureString
        if ($SecureKey.Length -eq 0) {
            throw "The Stripe server key cannot be empty."
        }
        $Credential = [System.Management.Automation.PSCredential]::new("stripe-server-key", $SecureKey)
        $ManualKey = $Credential.GetNetworkCredential().Password
        Assert-StripeKeyMode -Key $ManualKey
        Test-StripeKeyAccess -Key $ManualKey
        Save-StripeKeyVault -Key $ManualKey
        Remove-Variable Credential -ErrorAction SilentlyContinue
        Remove-Variable SecureKey -ErrorAction SilentlyContinue
        return $ManualKey
    }

    throw "Stripe CLI authorization completed but no usable key was found. Re-run with -ForceStripeLogin, or explicitly use -AllowManualKeyFallback."
}

function Get-BuiltGitSha {
    if (-not (Test-Path -LiteralPath $BuildMetadata -PathType Leaf)) {
        return $null
    }
    try {
        return [string](Get-Content -Raw -LiteralPath $BuildMetadata | ConvertFrom-Json).gitSha
    }
    catch {
        return $null
    }
}

Write-Host "VISHVAKARMA.OS FULLY AUTOMATED STRIPE CHECKOUT RECOVERY" -ForegroundColor Magenta
Write-Host "Repository: $RepoRoot"
Write-Host "Target: $PagesUrl"
Write-Host "Mode: $(if ($LiveMode) { 'LIVE' } else { 'TEST' })" -ForegroundColor Cyan
Write-Host "Key source order: DPAPI vault -> Stripe CLI config -> automatic Stripe CLI authorization" -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path $VaultRoot | Out-Null
Assert-IgnoredPath -AbsolutePath $VaultRoot
Assert-IgnoredPath -AbsolutePath $ToolRoot

foreach ($RequiredPath in @($Finalizer, $WindowsCompat)) {
    if (-not (Test-Path -LiteralPath $RequiredPath)) {
        throw "Missing required Stripe recovery component: $RequiredPath"
    }
}

if (-not $SkipGitSync) {
    Write-Host "`nISC:: SELF-SYNC STRIPE RECOVERY BRANCH" -ForegroundColor Cyan
    Normalize-GeneratedState
    $RealChanges = Get-RealRepositoryChanges
    if ($RealChanges.Count -gt 0) {
        throw "Real repository changes are present and were not touched:`n$($RealChanges -join "`n")"
    }

    $HeadBefore = (git rev-parse HEAD).Trim()
    Invoke-NativeChecked -Label "Fetch migration branch" -Action {
        git fetch origin $ExpectedBranch
    }
    Invoke-NativeChecked -Label "Switch migration branch" -Action {
        git switch $ExpectedBranch
    }
    Invoke-NativeChecked -Label "Fast-forward migration branch" -Action {
        git merge --ff-only "origin/$ExpectedBranch"
    }
    $HeadAfter = (git rev-parse HEAD).Trim()

    if ($HeadAfter -ne $HeadBefore) {
        Write-Host "PASS: Branch updated; relaunching the new autopilot code" -ForegroundColor Green
        $Relaunch = @{
            PagesUrl = $PagesUrl
            ProjectName = $ProjectName
            SkipGitSync = $true
        }
        if ($ResetStripeKey) { $Relaunch.ResetStripeKey = $true }
        if ($LiveMode) { $Relaunch.LiveMode = $true }
        if ($Rebuild) { $Relaunch.Rebuild = $true }
        if ($SkipFocusedTests) { $Relaunch.SkipFocusedTests = $true }
        if ($ForceStripeLogin) { $Relaunch.ForceStripeLogin = $true }
        if ($AllowManualKeyFallback) { $Relaunch.AllowManualKeyFallback = $true }

        & $PSCommandPath @Relaunch
        exit $LASTEXITCODE
    }
}

$Branch = (git branch --show-current).Trim()
if ($Branch -ne $ExpectedBranch) {
    throw "Wrong branch: $Branch. Expected: $ExpectedBranch"
}

if (-not $SkipFocusedTests) {
    Write-Host "`nISC:: INSTALL DEPENDENCIES AND RUN FOCUSED STRIPE SAFETY TESTS" -ForegroundColor Cyan
    Invoke-NativeChecked -Label "Install locked dependencies" -Action {
        npx --yes "pnpm@$PnpmVersion" install --frozen-lockfile
    }
    Invoke-NativeChecked -Label "Focused Stripe safety tests" -Action {
        npx --yes "pnpm@$PnpmVersion" exec vitest run `
            src/test/stripeSecureRecoveryScript.test.ts `
            src/test/stripeCheckoutFinalizer.test.ts `
            src/services/billing/stripeCheckout.test.ts `
            api/stripe/create-checkout-session.test.ts
    }
    Write-Host "PASS: Focused Stripe safety tests" -ForegroundColor Green
}

$CurrentHead = (git rev-parse HEAD).Trim()
$BuiltHead = Get-BuiltGitSha
if ($Rebuild -or -not (Test-Path -LiteralPath $DistIndex) -or $BuiltHead -ne $CurrentHead) {
    Write-Host "`nISC:: BUILD EXACT PRODUCTION ARTIFACT" -ForegroundColor Cyan
    $env:VITE_SUPABASE_URL = "https://jyocvwipthswfcmvqgqe.supabase.co"
    $env:VITE_SUPABASE_ANON_KEY = "sb_publishable_2vZsi4PoOlDb2lqs9mV0QQ_peQDtE6b"
    $env:VITE_AUTH_REDIRECT_ORIGIN = $PagesUrl.TrimEnd('/')
    $env:VITE_STRIPE_BILLING_ENABLED = "true"
    $env:VITE_PRICING_PAGE_ENABLED = "true"

    Invoke-NativeChecked -Label "Production build" -Action {
        npx --yes "pnpm@$PnpmVersion" run build
    }

    $Package = Get-Content (Join-Path $RepoRoot "package.json") -Raw | ConvertFrom-Json
    [ordered]@{
        service = $Package.name
        version = $Package.version
        gitSha = $CurrentHead
        branch = $ExpectedBranch
        provider = "cloudflare-pages"
        builtAt = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json | Set-Content -LiteralPath $BuildMetadata -Encoding utf8
    Write-Host "PASS: Exact production artifact built for $($CurrentHead.Substring(0, 8))" -ForegroundColor Green
}

$StripeKey = Get-OrProvisionStripeKey
if ($StripeKey.StartsWith('rk_')) {
    Write-Host "INFO: Stripe CLI restricted key detected; the finalizer will prove every required permission." -ForegroundColor Yellow
}

$PreviousStripeKey = $env:STRIPE_SECRET_KEY
$PreviousStripeMode = $env:VISH_STRIPE_MODE

try {
    $env:STRIPE_SECRET_KEY = $StripeKey
    $env:VISH_STRIPE_MODE = if ($LiveMode) { "live" } else { "test" }
    $StripeKey = $null

    Write-Host "`nISC:: RUN FOCUSED STRIPE CHECKOUT FINALIZER" -ForegroundColor Cyan
    Write-Host "Creating/verifying prices and webhook, uploading Cloudflare secrets, deploying the exact commit, proving Checkout and signed webhook." -ForegroundColor Cyan

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

Write-Host "`nVISH FULLY AUTOMATED STRIPE CHECKOUT RECOVERY: PASS" -ForegroundColor Green
Write-Host "Future runs reuse the Windows-encrypted key without prompts." -ForegroundColor Green
