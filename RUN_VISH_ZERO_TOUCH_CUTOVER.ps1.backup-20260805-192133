[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$CustomDomain = "vishvakarma-os.app",
    [string]$ProjectName = "vishvakarma-os",
    [string]$VercelProjectName = "vishvakarma-os",
    [int]$PullRequestNumber = 144,
    [int]$DomainWaitMinutes = 20,
    [int]$PostCutoverSoakSeconds = 120,
    [switch]$KeepVercelRollback,
    [switch]$DeleteVercelProject,
    [switch]$ForceUnlock,
    [switch]$ForceStripeLogin,
    [switch]$ResetStripeKey
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ISC = Injection Script Code
# ZERO-TOUCH CHAIN:
# CLEAN -> SYNC -> STRIPE -> FULL PROOF -> MERGE -> MAIN BUILD ->
# CLOUDFLARE MAIN -> CUSTOM DOMAIN -> LIVE AUTH/BILLING -> RETIRE VERCEL.
#
# The controller is fail-closed. It never prints secrets, never commits local
# vaults, and only touches explicitly allow-listed generated evidence paths.

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepositorySlug = "brysonandtiff-ops/vishvakarma-os"
$MigrationBranch = "agent/cloudflare-pages-workers-migration"
$MainBranch = "main"
$WranglerVersion = "4.118.0"
$PnpmVersion = "9.15.0"
$VercelVersion = "latest"
$StripeAutopilot = Join-Path $RepoRoot "RUN_VISH_STRIPE_AUTOPILOT.ps1"
$FullProof = Join-Path $RepoRoot "RUN_VISH_ISC_ALL_IN_ONE.ps1"
$BuildRunner = Join-Path $RepoRoot "scripts\vercel-build.mjs"
$LiveVerifier = Join-Path $RepoRoot "scripts\deployment\verify-cloudflare-live.mjs"
$AuthCheckoutVerifier = Join-Path $RepoRoot "scripts\deployment\verify-cloudflare-interactive-auth-checkout.mjs"
$StripeFinalizer = Join-Path $RepoRoot "scripts\deployment\vish-stripe-checkout-finalizer.mjs"
$WindowsCompat = Join-Path $RepoRoot "scripts\deployment\windows-command-spawn-compat.cjs"
$SupabaseCredentialVault = Join-Path $RepoRoot ".local\cloudflare-auth\supabase-login.clixml"
$StripeCredentialVault = Join-Path $RepoRoot ".local\cloudflare-auth\stripe-server-key.clixml"
$LocalRoot = Join-Path $RepoRoot ".local\cloudflare-proof"
$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$ArchiveRoot = Join-Path $LocalRoot "zero-touch-generated-archive\$RunId"
$LockPath = Join-Path $LocalRoot "zero-touch-cutover.lock.json"
$LastRunPath = Join-Path $LocalRoot "zero-touch-cutover-last-run.json"
$ReportPath = Join-Path $LocalRoot "zero-touch-cutover-$RunId.md"
$CustomOrigin = "https://$CustomDomain"
$CutoverStarted = $false
$CustomDomainAddedByRun = $false
$OwnsLock = $false
$PreviousProject = $null
$PreviousProductionDeployment = $null
$CloudflareAccountId = $null
$CloudflareToken = $null
$Steps = [System.Collections.Generic.List[object]]::new()

Set-Location $RepoRoot
New-Item -ItemType Directory -Force -Path $LocalRoot | Out-Null

function Add-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Status,
        [Parameter(Mandatory = $true)][string]$Detail
    )
    [void]$Steps.Add([pscustomobject]@{
        Name = $Name
        Status = $Status
        Detail = $Detail
        RecordedAt = (Get-Date).ToString("o")
    })
    $Color = if ($Status -eq "PASS") { "Green" } elseif ($Status -eq "WARN") { "Yellow" } else { "Red" }
    Write-Host "$Status: $Name - $Detail" -ForegroundColor $Color
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Action,
        [switch]$Optional
    )
    Write-Host "`nISC:: $Name" -ForegroundColor Cyan
    try {
        $Value = & $Action
        Add-Step -Name $Name -Status "PASS" -Detail "Completed successfully"
        return $Value
    }
    catch {
        $Message = $_.Exception.Message
        Add-Step -Name $Name -Status $(if ($Optional) { "WARN" } else { "FAIL" }) -Detail $Message
        if (-not $Optional) { throw }
        return $null
    }
}

function Invoke-NativeChecked {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )
    $global:LASTEXITCODE = 0
    $Output = & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
    return $Output
}

function Acquire-Lock {
    if (Test-Path -LiteralPath $LockPath) {
        $ExistingPid = 0
        try {
            $ExistingPid = [int](Get-Content -Raw -LiteralPath $LockPath | ConvertFrom-Json).ProcessId
        }
        catch { }
        $Alive = $ExistingPid -gt 0 -and $null -ne (Get-Process -Id $ExistingPid -ErrorAction SilentlyContinue)
        if ($Alive -and -not $ForceUnlock) {
            throw "Another zero-touch cutover is running as PID $ExistingPid."
        }
        Remove-Item -LiteralPath $LockPath -Force -ErrorAction SilentlyContinue
    }
    [pscustomobject]@{
        ProcessId = $PID
        StartedAt = (Get-Date).ToString("o")
        Repository = $RepoRoot
        Machine = $env:COMPUTERNAME
    } | ConvertTo-Json | Set-Content -LiteralPath $LockPath -Encoding utf8
    $script:OwnsLock = $true
}

function Remove-Lock {
    if ($script:OwnsLock) {
        Remove-Item -LiteralPath $LockPath -Force -ErrorAction SilentlyContinue
    }
}

function Assert-IgnoredPath {
    param([Parameter(Mandatory = $true)][string]$AbsolutePath)
    $Relative = [IO.Path]::GetRelativePath($RepoRoot, $AbsolutePath).Replace("\", "/")
    $global:LASTEXITCODE = 0
    git check-ignore --quiet -- $Relative
    if ($LASTEXITCODE -ne 0) {
        throw "$Relative must be excluded by .gitignore."
    }
}

function Copy-ToArchive {
    param([Parameter(Mandatory = $true)][string]$RelativePath)
    $Source = Join-Path $RepoRoot $RelativePath
    if (-not (Test-Path -LiteralPath $Source)) { return }
    $Destination = Join-Path $ArchiveRoot $RelativePath
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Destination) | Out-Null
    if (Test-Path -LiteralPath $Source -PathType Container) {
        Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
    }
    else {
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
    }
}

function Normalize-GeneratedEvidence {
    $Generated = @(
        "docs/release/evidence",
        "evidence",
        "supabase/.temp",
        "dist/build-meta.json",
        "public/build-meta.json",
        "coverage",
        "playwright-report",
        "test-results"
    )
    foreach ($Path in $Generated) { Copy-ToArchive -RelativePath $Path }
    git restore --staged --worktree -- @Generated 2>$null
    $global:LASTEXITCODE = 0
    git clean -fd -- @Generated | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Generated evidence cleanup failed." }

    $Unexpected = @(
        git status --porcelain=v1 --untracked-files=all | Where-Object {
            $Line = [string]$_
            -not $Line.StartsWith("?? .local/")
        }
    )
    if ($Unexpected.Count -gt 0) {
        throw "Genuine repository changes remain and were not touched:`n$($Unexpected -join "`n")"
    }
}

function Convert-WranglerJson {
    param([Parameter(Mandatory = $true)][object[]]$Lines)
    $Text = ($Lines | ForEach-Object { [string]$_ }) -join "`n"
    $ArrayStart = $Text.IndexOf('[')
    $ObjectStart = $Text.IndexOf('{')
    $Start = if ($ArrayStart -ge 0 -and ($ObjectStart -lt 0 -or $ArrayStart -lt $ObjectStart)) { $ArrayStart } else { $ObjectStart }
    if ($Start -lt 0) { throw "Wrangler did not return JSON." }
    return $Text.Substring($Start) | ConvertFrom-Json
}

function Find-CloudflareAccountId {
    param($Payload)
    if (-not $Payload) { return $null }
    foreach ($Name in @('account_id', 'accountId', 'id')) {
        $Property = $Payload.PSObject.Properties[$Name]
        if ($Property -and [string]$Property.Value -match '^[a-f0-9]{32}$') {
            return [string]$Property.Value
        }
    }
    foreach ($Property in $Payload.PSObject.Properties) {
        if ($Property.Value -is [pscustomobject]) {
            $Found = Find-CloudflareAccountId -Payload $Property.Value
            if ($Found) { return $Found }
        }
        elseif ($Property.Value -is [array]) {
            foreach ($Item in @($Property.Value)) {
                $Found = Find-CloudflareAccountId -Payload $Item
                if ($Found) { return $Found }
            }
        }
    }
    return $null
}

function Initialize-CloudflareApi {
    $IdentityLines = Invoke-NativeChecked -Label "Read Wrangler identity" -Action {
        npx --yes "wrangler@$WranglerVersion" whoami --json
    }
    $Identity = Convert-WranglerJson -Lines @($IdentityLines)
    $script:CloudflareAccountId = Find-CloudflareAccountId -Payload $Identity
    if ([string]::IsNullOrWhiteSpace($script:CloudflareAccountId)) {
        throw "Could not resolve the Cloudflare account ID."
    }

    $TokenLines = Invoke-NativeChecked -Label "Read Wrangler OAuth token" -Action {
        npx --yes "wrangler@$WranglerVersion" auth token --json
    }
    $TokenPayload = Convert-WranglerJson -Lines @($TokenLines)
    $script:CloudflareToken = [string]$TokenPayload.token
    if ([string]::IsNullOrWhiteSpace($script:CloudflareToken)) {
        throw "Wrangler did not provide an OAuth token."
    }
}

function Invoke-CloudflareApi {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('GET','POST','PATCH','DELETE')][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body
    )
    if ([string]::IsNullOrWhiteSpace($CloudflareAccountId) -or [string]::IsNullOrWhiteSpace($CloudflareToken)) {
        Initialize-CloudflareApi
    }
    $Uri = "https://api.cloudflare.com/client/v4/accounts/$CloudflareAccountId$Path"
    $Arguments = @{
        Uri = $Uri
        Method = $Method
        Headers = @{ Authorization = "Bearer $CloudflareToken"; "Content-Type" = "application/json" }
        TimeoutSec = 90
    }
    if ($null -ne $Body) { $Arguments.Body = $Body | ConvertTo-Json -Depth 12 -Compress }
    $Response = Invoke-RestMethod @Arguments
    if ($Response.PSObject.Properties['success'] -and $Response.success -ne $true) {
        $Message = (@($Response.errors) | ForEach-Object { $_.message }) -join '; '
        throw "Cloudflare API failed: $Message"
    }
    return $Response
}

function Get-CloudflareProject {
    return (Invoke-CloudflareApi -Method GET -Path "/pages/projects/$ProjectName").result
}

function Get-ProductionDeployment {
    $Lines = Invoke-NativeChecked -Label "List Cloudflare production deployments" -Action {
        npx --yes "wrangler@$WranglerVersion" pages deployment list --project-name $ProjectName --environment production --json
    }
    $Payload = Convert-WranglerJson -Lines @($Lines)
    $Deployments = if ($Payload.result) { @($Payload.result) } elseif ($Payload.deployments) { @($Payload.deployments) } else { @($Payload) }
    return $Deployments | Select-Object -First 1
}

function Get-DeploymentId {
    param($Deployment)
    foreach ($Name in @('id','deployment_id','deploymentId')) {
        $Property = $Deployment.PSObject.Properties[$Name]
        if ($Property -and $Property.Value) { return [string]$Property.Value }
    }
    return $null
}

function Restore-PreviousCloudflareState {
    if (-not $CutoverStarted -or -not $PreviousProject) { return }
    Write-Host "`nISC:: AUTOMATIC CLOUDFLARE CUTOVER ROLLBACK" -ForegroundColor Yellow
    try {
        if ($CustomDomainAddedByRun) {
            Invoke-CloudflareApi -Method DELETE -Path "/pages/projects/$ProjectName/domains/$CustomDomain" | Out-Null
        }
    }
    catch { Write-Warning "Could not remove the failed custom-domain association: $($_.Exception.Message)" }
    try {
        Invoke-CloudflareApi -Method PATCH -Path "/pages/projects/$ProjectName" -Body @{
            production_branch = [string]$PreviousProject.production_branch
        } | Out-Null
    }
    catch { Write-Warning "Could not restore the previous production branch: $($_.Exception.Message)" }
    try {
        $PreviousId = Get-DeploymentId -Deployment $PreviousProductionDeployment
        if ($PreviousId) {
            Invoke-CloudflareApi -Method POST -Path "/pages/projects/$ProjectName/deployments/$PreviousId/rollback" -Body @{} | Out-Null
        }
    }
    catch { Write-Warning "Could not roll back the previous Cloudflare deployment: $($_.Exception.Message)" }
}

function Test-ReleaseReadyForHead {
    param([Parameter(Mandatory = $true)][string]$Head)
    $Path = Join-Path $LocalRoot "release-controller-last-run.json"
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    try {
        $Payload = Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
        return $Payload.Result -eq "READY_FOR_MERGE_AND_CUTOVER" -and [string]$Payload.GitHead -eq $Head
    }
    catch { return $false }
}

function Read-StripeServerKey {
    if (-not (Test-Path -LiteralPath $StripeCredentialVault -PathType Leaf)) {
        throw "The Windows-encrypted Stripe key vault is missing after Stripe autopilot."
    }
    $Credential = Import-Clixml -LiteralPath $StripeCredentialVault
    if (-not ($Credential -is [Management.Automation.PSCredential])) {
        throw "The Windows-encrypted Stripe key vault is invalid."
    }
    $Key = $Credential.GetNetworkCredential().Password
    Remove-Variable Credential -ErrorAction SilentlyContinue
    if ($Key -notmatch '^(sk|rk)_(test|live)_[A-Za-z0-9_]+$') {
        throw "The Stripe key vault does not contain a valid server key."
    }
    return $Key
}

function Run-LiveVerifier {
    param(
        [Parameter(Mandatory = $true)][string]$Origin,
        [Parameter(Mandatory = $true)][string]$ExpectedHead
    )
    $PreviousPages = $env:CLOUDFLARE_PAGES_URL
    $PreviousProduction = $env:PRODUCTION_URL
    $PreviousExpected = $env:EXPECTED_GIT_SHA
    try {
        $env:CLOUDFLARE_PAGES_URL = $Origin.TrimEnd('/')
        $env:PRODUCTION_URL = $Origin.TrimEnd('/')
        $env:EXPECTED_GIT_SHA = $ExpectedHead
        Invoke-NativeChecked -Label "Live exact-commit verifier" -Action { node $LiveVerifier } | Out-Null
    }
    finally {
        $env:CLOUDFLARE_PAGES_URL = $PreviousPages
        $env:PRODUCTION_URL = $PreviousProduction
        $env:EXPECTED_GIT_SHA = $PreviousExpected
    }
}

function Run-AuthenticatedCheckoutProof {
    param([Parameter(Mandatory = $true)][string]$Origin)
    if (-not (Test-Path -LiteralPath $SupabaseCredentialVault -PathType Leaf)) {
        throw "The Windows-encrypted Supabase login vault is missing."
    }
    Assert-IgnoredPath -AbsolutePath $SupabaseCredentialVault
    $StatePath = Join-Path $RepoRoot ".local\cloudflare-auth\$($Origin.Replace('https://','').Replace('.','-'))-state.json"
    $PreviousPages = $env:CLOUDFLARE_PAGES_URL
    $PreviousProduction = $env:PRODUCTION_URL
    $PreviousVault = $env:VISH_SUPABASE_CREDENTIAL_VAULT
    $PreviousState = $env:CLOUDFLARE_AUTH_STATE_PATH
    try {
        $env:CLOUDFLARE_PAGES_URL = $Origin.TrimEnd('/')
        $env:PRODUCTION_URL = $Origin.TrimEnd('/')
        $env:VISH_SUPABASE_CREDENTIAL_VAULT = $SupabaseCredentialVault
        $env:CLOUDFLARE_AUTH_STATE_PATH = $StatePath
        Invoke-NativeChecked -Label "Authenticated Supabase and Stripe Checkout proof" -Action {
            node $AuthCheckoutVerifier --non-interactive --reset-session
        } | Out-Null
    }
    finally {
        $env:CLOUDFLARE_PAGES_URL = $PreviousPages
        $env:PRODUCTION_URL = $PreviousProduction
        $env:VISH_SUPABASE_CREDENTIAL_VAULT = $PreviousVault
        $env:CLOUDFLARE_AUTH_STATE_PATH = $PreviousState
    }
}

function Run-StripeFinalizerForCurrentHead {
    param([Parameter(Mandatory = $true)][string]$Origin)
    $StripeKey = Read-StripeServerKey
    $PreviousKey = $env:STRIPE_SECRET_KEY
    $PreviousMode = $env:VISH_STRIPE_MODE
    try {
        $env:STRIPE_SECRET_KEY = $StripeKey
        $env:VISH_STRIPE_MODE = if ($StripeKey -match '_(live)_') { "live" } else { "test" }
        $StripeKey = $null
        Invoke-NativeChecked -Label "Stripe prices, Checkout and signed webhook finalizer" -Action {
            node --require $WindowsCompat $StripeFinalizer --pages-url $Origin --project-name $ProjectName
        } | Out-Null
    }
    finally {
        $env:STRIPE_SECRET_KEY = $PreviousKey
        $env:VISH_STRIPE_MODE = $PreviousMode
        $StripeKey = $null
    }
}

function Add-OrWaitForCustomDomain {
    $DomainsResponse = Invoke-CloudflareApi -Method GET -Path "/pages/projects/$ProjectName/domains"
    $Domain = @($DomainsResponse.result) | Where-Object { $_.name -eq $CustomDomain } | Select-Object -First 1
    if (-not $Domain) {
        Invoke-CloudflareApi -Method POST -Path "/pages/projects/$ProjectName/domains" -Body @{ name = $CustomDomain } | Out-Null
        $script:CustomDomainAddedByRun = $true
    }

    $Deadline = (Get-Date).AddMinutes($DomainWaitMinutes)
    do {
        $DomainResponse = Invoke-CloudflareApi -Method GET -Path "/pages/projects/$ProjectName/domains/$CustomDomain"
        $Domain = $DomainResponse.result
        if ($Domain.status -eq 'active') { return $Domain }
        if ($Domain.status -in @('error','blocked','deactivated')) {
            throw "Cloudflare custom domain entered status $($Domain.status): $($Domain.validation_data.error_message)"
        }
        Start-Sleep -Seconds 10
    } while ((Get-Date) -lt $Deadline)
    throw "Custom domain did not become active within $DomainWaitMinutes minutes; last status: $($Domain.status)"
}

function Retire-Vercel {
    if ($KeepVercelRollback) {
        Add-Step -Name "Retire Vercel" -Status "WARN" -Detail "Kept intentionally as rollback protection"
        return
    }

    $VercelArchive = Join-Path $LocalRoot "vercel-retirement-$RunId"
    New-Item -ItemType Directory -Force -Path $VercelArchive | Out-Null
    $Authenticated = $true
    try {
        Invoke-NativeChecked -Label "Verify Vercel login" -Action { npx --yes "vercel@$VercelVersion" whoami } | Out-Null
    }
    catch { $Authenticated = $false }
    if (-not $Authenticated) {
        Write-Host "Vercel authorization is required once; opening the official login flow." -ForegroundColor Yellow
        Invoke-NativeChecked -Label "Authorize Vercel CLI" -Action { npx --yes "vercel@$VercelVersion" login } | Out-Null
    }

    try {
        npx --yes "vercel@$VercelVersion" project inspect $VercelProjectName --json *> (Join-Path $VercelArchive "project.json")
        $global:LASTEXITCODE = 0
    }
    catch { }

    Invoke-NativeChecked -Label "Remove Vercel custom-domain alias" -Action {
        npx --yes "vercel@$VercelVersion" alias rm $CustomDomain --yes
    } | Out-Null

    if ($DeleteVercelProject) {
        Invoke-NativeChecked -Label "Delete retired Vercel project" -Action {
            npx --yes "vercel@$VercelVersion" project rm $VercelProjectName --yes
        } | Out-Null
        Add-Step -Name "Retire Vercel" -Status "PASS" -Detail "Custom domain detached and Vercel project deleted"
    }
    else {
        Add-Step -Name "Retire Vercel" -Status "PASS" -Detail "Custom domain detached; Vercel project retained as a cold archive"
    }
}

function Write-FinalArtifacts {
    param([string]$Result, [string]$Reason, [string]$MainHead)
    $Payload = [pscustomobject]@{
        GeneratedAt = (Get-Date).ToString("o")
        Result = $Result
        Reason = $Reason
        Repository = $RepositorySlug
        PullRequest = $PullRequestNumber
        MainHead = $MainHead
        PagesUrl = $PagesUrl
        CustomDomain = $CustomOrigin
        VercelProject = $VercelProjectName
        VercelDeleted = [bool]$DeleteVercelProject
        Steps = @($Steps)
        GeneratedArchive = $ArchiveRoot
        Report = $ReportPath
    }
    $Payload | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $LastRunPath -Encoding utf8
    @(
        '# Vishvakarma.OS Zero-Touch Cutover',
        '',
        "- Result: **$Result**",
        "- Reason: $Reason",
        "- Generated: $($Payload.GeneratedAt)",
        "- Main head: $MainHead",
        "- Cloudflare Pages: $PagesUrl",
        "- Custom domain: $CustomOrigin",
        "- Vercel project: $VercelProjectName",
        '',
        '| Step | Status | Detail |',
        '| --- | --- | --- |',
        ($Steps | ForEach-Object { "| $($_.Name) | $($_.Status) | $([string]$_.Detail -replace '\|','\\|') |" })
    ) | Set-Content -LiteralPath $ReportPath -Encoding utf8
}

$FinalResult = "BLOCKED"
$FinalReason = "The controller did not complete."
$MainHead = $null

try {
    Acquire-Lock
    Write-Host "VISHVAKARMA.OS ZERO-TOUCH FULL RELEASE + CUTOVER" -ForegroundColor Magenta
    Write-Host "Repository: $RepoRoot"
    Write-Host "Chain: CLEAN -> PROVE -> MERGE -> MAIN -> DOMAIN -> RETIRE VERCEL" -ForegroundColor Cyan

    Invoke-Step -Name "Archive and normalize generated evidence" -Action {
        Normalize-GeneratedEvidence
    } | Out-Null

    Invoke-Step -Name "Synchronize Cloudflare migration branch" -Action {
        Invoke-NativeChecked -Label "Fetch migration branch" -Action { git fetch origin $MigrationBranch } | Out-Null
        Invoke-NativeChecked -Label "Switch migration branch" -Action { git switch $MigrationBranch } | Out-Null
        Invoke-NativeChecked -Label "Fast-forward migration branch" -Action { git merge --ff-only "origin/$MigrationBranch" } | Out-Null
    } | Out-Null

    foreach ($Required in @($StripeAutopilot,$FullProof,$BuildRunner,$LiveVerifier,$AuthCheckoutVerifier,$StripeFinalizer,$WindowsCompat)) {
        if (-not (Test-Path -LiteralPath $Required -PathType Leaf)) { throw "Missing required controller component: $Required" }
    }

    Invoke-Step -Name "Repair and prove Stripe Checkout and webhook" -Action {
        $Arguments = @{ PagesUrl = $PagesUrl; ProjectName = $ProjectName }
        if ($ForceStripeLogin) { $Arguments.ForceStripeLogin = $true }
        if ($ResetStripeKey) { $Arguments.ResetStripeKey = $true }
        & $StripeAutopilot @Arguments
        if ($LASTEXITCODE -ne 0) { throw "Stripe autopilot returned exit code $LASTEXITCODE." }
    } | Out-Null

    $MigrationHead = (git rev-parse HEAD).Trim()
    if (-not (Test-ReleaseReadyForHead -Head $MigrationHead)) {
        Invoke-Step -Name "Run complete Supabase, repository and Cloudflare release proof" -Action {
            & $FullProof -PagesUrl $PagesUrl -ForceUnlock
            if ($LASTEXITCODE -ne 0) { throw "Full ISC proof returned exit code $LASTEXITCODE." }
        } | Out-Null
    }
    else {
        Add-Step -Name "Run complete Supabase, repository and Cloudflare release proof" -Status "PASS" -Detail "Reused exact-head READY_FOR_MERGE_AND_CUTOVER certificate"
    }

    $MigrationHead = (git rev-parse HEAD).Trim()
    if (-not (Test-ReleaseReadyForHead -Head $MigrationHead)) {
        throw "The exact migration head is not certified READY_FOR_MERGE_AND_CUTOVER."
    }

    Invoke-Step -Name "Snapshot current Cloudflare production state" -Action {
        Initialize-CloudflareApi
        $script:PreviousProject = Get-CloudflareProject
        $script:PreviousProductionDeployment = Get-ProductionDeployment
    } | Out-Null

    Invoke-Step -Name "Merge pull request branch into main" -Action {
        Invoke-NativeChecked -Label "Fetch main" -Action { git fetch origin $MainBranch } | Out-Null
        Invoke-NativeChecked -Label "Switch main" -Action { git switch $MainBranch } | Out-Null
        Invoke-NativeChecked -Label "Fast-forward local main" -Action { git merge --ff-only "origin/$MainBranch" } | Out-Null
        $global:LASTEXITCODE = 0
        git merge-base --is-ancestor "origin/$MigrationBranch" HEAD
        $AlreadyMerged = $LASTEXITCODE -eq 0
        $global:LASTEXITCODE = 0
        if (-not $AlreadyMerged) {
            Invoke-NativeChecked -Label "Create PR merge commit" -Action {
                git merge --no-ff "origin/$MigrationBranch" -m "Merge PR #$PullRequestNumber: Cloudflare Pages and Workers migration"
            } | Out-Null
            Invoke-NativeChecked -Label "Push merged main" -Action { git push origin $MainBranch } | Out-Null
        }
        $script:MainHead = (git rev-parse HEAD).Trim()
        $RemoteMain = (git ls-remote origin "refs/heads/$MainBranch" | ForEach-Object { ($_ -split '\s+')[0] }).Trim()
        if ($RemoteMain -ne $script:MainHead) { throw "Remote main does not match the local merged commit." }
    } | Out-Null

    Invoke-Step -Name "Build and certify exact merged main commit" -Action {
        Normalize-GeneratedEvidence
        Invoke-NativeChecked -Label "Install locked dependencies" -Action { npx --yes "pnpm@$PnpmVersion" install --frozen-lockfile } | Out-Null
        $env:VITE_SUPABASE_URL = "https://jyocvwipthswfcmvqgqe.supabase.co"
        $env:VITE_SUPABASE_ANON_KEY = "sb_publishable_2vZsi4PoOlDb2lqs9mV0QQ_peQDtE6b"
        $env:VITE_AUTH_REDIRECT_ORIGIN = $CustomOrigin
        $env:VITE_STRIPE_BILLING_ENABLED = "true"
        $env:VITE_PRICING_PAGE_ENABLED = "true"
        Invoke-NativeChecked -Label "Exact main production build" -Action { node $BuildRunner } | Out-Null
    } | Out-Null

    Invoke-Step -Name "Switch Cloudflare production branch to main" -Action {
        $script:CutoverStarted = $true
        Invoke-CloudflareApi -Method PATCH -Path "/pages/projects/$ProjectName" -Body @{ production_branch = $MainBranch } | Out-Null
        $Project = Get-CloudflareProject
        if ([string]$Project.production_branch -ne $MainBranch) { throw "Cloudflare did not retain production_branch=main." }
    } | Out-Null

    Invoke-Step -Name "Deploy exact main commit to Cloudflare production" -Action {
        Invoke-NativeChecked -Label "Deploy main to Pages" -Action {
            npx --yes "wrangler@$WranglerVersion" pages deploy dist --project-name $ProjectName --branch $MainBranch --commit-hash $MainHead --commit-message "Zero-touch main cutover $($MainHead.Substring(0,8))"
        } | Out-Null
        Run-LiveVerifier -Origin $PagesUrl -ExpectedHead $MainHead
        Run-StripeFinalizerForCurrentHead -Origin $PagesUrl
        Run-AuthenticatedCheckoutProof -Origin $PagesUrl
    } | Out-Null

    Invoke-Step -Name "Attach and activate the custom Cloudflare domain" -Action {
        Add-OrWaitForCustomDomain | Out-Null
        Run-LiveVerifier -Origin $CustomOrigin -ExpectedHead $MainHead
        Run-AuthenticatedCheckoutProof -Origin $CustomOrigin
    } | Out-Null

    Invoke-Step -Name "Post-cutover stability soak" -Action {
        $Deadline = (Get-Date).AddSeconds([Math]::Max(30, $PostCutoverSoakSeconds))
        do {
            $Health = Invoke-RestMethod -Uri "$CustomOrigin/api/health?soak=$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())" -Headers @{ "Cache-Control" = "no-cache" } -TimeoutSec 30
            if ($Health.ok -ne $true) { throw "Custom-domain health stopped reporting ok:true." }
            Start-Sleep -Seconds 15
        } while ((Get-Date) -lt $Deadline)
    } | Out-Null

    Invoke-Step -Name "Retire Vercel production traffic" -Action {
        Retire-Vercel
    } | Out-Null

    $FinalResult = "PASS"
    $FinalReason = "Main is merged, deployed on Cloudflare, the custom domain is active, Supabase and Stripe are proven, and Vercel traffic is retired."
    Write-FinalArtifacts -Result $FinalResult -Reason $FinalReason -MainHead $MainHead
    Write-Host "`nVISHVAKARMA.OS ZERO-TOUCH CUTOVER: PASS" -ForegroundColor Green
    Write-Host "Live: $CustomOrigin" -ForegroundColor Green
    Write-Host "Report: $ReportPath" -ForegroundColor Yellow
    $global:LASTEXITCODE = 0
}
catch {
    $FinalReason = $_.Exception.Message
    Restore-PreviousCloudflareState
    Write-FinalArtifacts -Result "BLOCKED" -Reason $FinalReason -MainHead $MainHead
    Write-Host "`nVISHVAKARMA.OS ZERO-TOUCH CUTOVER: BLOCKED" -ForegroundColor Red
    Write-Host $FinalReason -ForegroundColor Red
    Write-Host "No password, API key, access token, or webhook secret was printed or committed." -ForegroundColor Yellow
    Write-Host "Report: $ReportPath" -ForegroundColor Yellow
    $global:LASTEXITCODE = 1
}
finally {
    $script:CloudflareToken = $null
    Remove-Lock
}
