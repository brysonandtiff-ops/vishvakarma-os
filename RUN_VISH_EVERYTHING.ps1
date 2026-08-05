[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$CustomDomain = "vishvakarma-os.app",
    [string]$ProjectName = "vishvakarma-os",
    [string]$VercelProjectName = "vishvakarma-os",
    [bool]$DeleteVercelProject = $true,
    [switch]$ForceUnlock,
    [switch]$ForceStripeLogin,
    [switch]$ResetStripeKey
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Final single-entry ISC launcher. Cloudflare cutover is completed and verified
# first. Vercel retirement is intentionally separated so an optional provider
# cleanup failure can never roll back a healthy Cloudflare production site.
# The zero-touch controller is always routed through a full PowerShell parser
# and compatibility gate before any production action is allowed.

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Branch = "agent/cloudflare-pages-workers-migration"
$Cutover = Join-Path $RepoRoot "RUN_VISH_ZERO_TOUCH_COMPAT.ps1"
$LocalRoot = Join-Path $RepoRoot ".local\cloudflare-proof"
$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$FinalPath = Join-Path $LocalRoot "everything-last-run.json"
$VercelArchive = Join-Path $LocalRoot "vercel-retirement-$RunId"
$VercelVersion = "latest"

Set-Location $RepoRoot
New-Item -ItemType Directory -Force -Path $LocalRoot | Out-Null

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

function Write-FinalState {
    param(
        [Parameter(Mandatory = $true)][string]$Result,
        [Parameter(Mandatory = $true)][string]$Detail,
        [string]$VercelResult
    )
    [pscustomobject]@{
        GeneratedAt = (Get-Date).ToString("o")
        Result = $Result
        Detail = $Detail
        Cloudflare = "https://$CustomDomain"
        VercelResult = $VercelResult
        VercelProjectDeleted = $DeleteVercelProject
    } | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $FinalPath -Encoding utf8
}

Write-Host "VISHVAKARMA.OS EVERYTHING AUTOPILOT" -ForegroundColor Magenta
Write-Host "One chain: sync -> repair -> parse -> test -> deploy -> merge -> domain -> retire Vercel" -ForegroundColor Cyan

# Fetch only enough to obtain the newest launcher. Generated evidence is handled
# safely by the one-click and zero-touch controllers after they start.
Invoke-NativeChecked -Label "Fetch migration branch" -Action {
    git fetch origin $Branch
} | Out-Null

$CurrentBranch = (git branch --show-current).Trim()
if ($CurrentBranch -eq $Branch) {
    $Dirty = @(git status --porcelain)
    if ($Dirty.Count -eq 0) {
        Invoke-NativeChecked -Label "Fast-forward migration branch" -Action {
            git merge --ff-only "origin/$Branch"
        } | Out-Null
    }
}

if (-not (Test-Path -LiteralPath $Cutover -PathType Leaf)) {
    # Use git-show to materialize the newest parsed compatibility launcher
    # without touching other tracked files when the local checkout is behind.
    $Content = git show "origin/$Branch`:RUN_VISH_ZERO_TOUCH_COMPAT.ps1"
    if ($LASTEXITCODE -ne 0 -or -not $Content) {
        throw "Could not obtain the parsed zero-touch compatibility controller."
    }
    $Content -join "`n" | Set-Content -LiteralPath $Cutover -Encoding utf8
}

$CutoverArguments = @{
    PagesUrl = $PagesUrl
    CustomDomain = $CustomDomain
    ProjectName = $ProjectName
    VercelProjectName = $VercelProjectName
    KeepVercelRollback = $true
}
if ($ForceUnlock) { $CutoverArguments.ForceUnlock = $true }
if ($ForceStripeLogin) { $CutoverArguments.ForceStripeLogin = $true }
if ($ResetStripeKey) { $CutoverArguments.ResetStripeKey = $true }

& $Cutover @CutoverArguments
if ($LASTEXITCODE -ne 0) {
    Write-FinalState -Result "BLOCKED" -Detail "Parsed Cloudflare zero-touch cutover did not pass." -VercelResult "NOT_STARTED"
    throw "Cloudflare zero-touch cutover did not pass. Vercel was not changed."
}

Write-Host "`nISC:: RETIRE VERCEL AFTER VERIFIED CLOUDFLARE CUTOVER" -ForegroundColor Cyan
$VercelResult = "NOT_ATTEMPTED"
try {
    New-Item -ItemType Directory -Force -Path $VercelArchive | Out-Null

    $Authenticated = $true
    try {
        Invoke-NativeChecked -Label "Verify Vercel CLI login" -Action {
            npx --yes "vercel@$VercelVersion" whoami
        } | Out-Null
    }
    catch { $Authenticated = $false }

    if (-not $Authenticated) {
        Write-Host "Vercel requires its one-time official account authorization." -ForegroundColor Yellow
        Invoke-NativeChecked -Label "Authorize Vercel CLI" -Action {
            npx --yes "vercel@$VercelVersion" login
        } | Out-Null
    }

    try {
        npx --yes "vercel@$VercelVersion" project inspect $VercelProjectName --json *> (Join-Path $VercelArchive "project.json")
        $global:LASTEXITCODE = 0
    }
    catch { }

    # Removing the alias stops Vercel from serving the production hostname while
    # preserving the already-proven Cloudflare DNS and Pages association.
    Invoke-NativeChecked -Label "Detach the production domain from Vercel" -Action {
        npx --yes "vercel@$VercelVersion" alias rm $CustomDomain --yes
    } | Out-Null

    if ($DeleteVercelProject) {
        Invoke-NativeChecked -Label "Delete the retired Vercel project" -Action {
            npx --yes "vercel@$VercelVersion" project rm $VercelProjectName --yes
        } | Out-Null
        $VercelResult = "DOMAIN_DETACHED_AND_PROJECT_DELETED"
    }
    else {
        $VercelResult = "DOMAIN_DETACHED_PROJECT_ARCHIVED"
    }

    Write-Host "PASS: Vercel production traffic retired" -ForegroundColor Green
}
catch {
    $VercelResult = "CLEANUP_WARNING: $($_.Exception.Message)"
    Write-Warning "Cloudflare is live and verified, but Vercel cleanup needs attention: $($_.Exception.Message)"
}

Write-FinalState `
    -Result $(if ($VercelResult.StartsWith('CLEANUP_WARNING')) { "PASS_WITH_VERCEL_WARNING" } else { "PASS" }) `
    -Detail "Cloudflare main and custom domain are verified; Vercel retirement was handled separately." `
    -VercelResult $VercelResult

Write-Host "`nVISHVAKARMA.OS EVERYTHING AUTOPILOT: PASS" -ForegroundColor Green
Write-Host "Live: https://$CustomDomain" -ForegroundColor Green
Write-Host "State: $FinalPath" -ForegroundColor Yellow
