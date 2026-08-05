[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$ProjectName = "vishvakarma-os",
    [switch]$LiveMode,
    [switch]$ResetStripeKey,
    [switch]$Rebuild,
    [switch]$ForceStripeLogin,
    [switch]$AllowManualKeyFallback,
    [switch]$SkipFocusedTests
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$InnerAutopilot = Join-Path $RepoRoot "RUN_VISH_STRIPE_SECURE_RECOVERY.ps1"
$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$ArchiveRoot = Join-Path $RepoRoot ".local\cloudflare-proof\generated-evidence-archive\$RunId"

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

function Copy-GeneratedPathToArchive {
    param([Parameter(Mandatory = $true)][string]$RelativePath)

    $Source = Join-Path $RepoRoot $RelativePath
    if (-not (Test-Path -LiteralPath $Source)) {
        return
    }

    $Destination = Join-Path $ArchiveRoot $RelativePath
    $DestinationParent = Split-Path -Parent $Destination
    New-Item -ItemType Directory -Force -Path $DestinationParent | Out-Null

    if (Test-Path -LiteralPath $Source -PathType Container) {
        Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
    }
    else {
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
    }
}

function Normalize-GeneratedEvidenceSafely {
    Write-Host "`nISC:: ARCHIVE AND NORMALIZE GENERATED EVIDENCE" -ForegroundColor Cyan

    $GeneratedPaths = @(
        "docs/release/evidence",
        "evidence",
        "supabase/.temp",
        "dist/build-meta.json",
        "public/build-meta.json"
    )

    foreach ($RelativePath in $GeneratedPaths) {
        Copy-GeneratedPathToArchive -RelativePath $RelativePath
    }

    # Restore tracked generated files, then remove only untracked files inside
    # the explicitly allow-listed generated paths. Genuine source files are untouched.
    git restore --staged --worktree -- @GeneratedPaths 2>$null
    $global:LASTEXITCODE = 0

    git clean -fd -- @GeneratedPaths | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Could not clean the allow-listed generated evidence paths."
    }

    $RemainingChanges = @(
        git status --porcelain | Where-Object {
            $Line = [string]$_
            -not $Line.StartsWith("?? .local/")
        }
    )

    if ($RemainingChanges.Count -gt 0) {
        throw "Genuine repository changes remain and were not touched:`n$($RemainingChanges -join "`n")"
    }

    if (Test-Path -LiteralPath $ArchiveRoot) {
        Write-Host "PASS: Generated evidence archived at $ArchiveRoot" -ForegroundColor Green
    }
    else {
        Write-Host "PASS: No generated evidence required archiving" -ForegroundColor Green
    }

    Write-Host "PASS: Repository is clean for safe branch synchronization" -ForegroundColor Green
}

Write-Host "VISHVAKARMA.OS ONE-COMMAND STRIPE AUTOPILOT" -ForegroundColor Magenta
Write-Host "Repository: $RepoRoot"
Write-Host "Target: $PagesUrl"
Write-Host "Mode: $(if ($LiveMode) { 'LIVE' } else { 'TEST' })" -ForegroundColor Cyan
Write-Host "Generated evidence is archived before synchronization." -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $InnerAutopilot -PathType Leaf)) {
    throw "Missing inner Stripe autopilot: $InnerAutopilot"
}

Normalize-GeneratedEvidenceSafely

Write-Host "`nISC:: SELF-SYNC CLOUDFLARE MIGRATION BRANCH" -ForegroundColor Cyan
Invoke-NativeChecked -Label "Fetch migration branch" -Action {
    git fetch origin $ExpectedBranch
}
Invoke-NativeChecked -Label "Switch migration branch" -Action {
    git switch $ExpectedBranch
}
Invoke-NativeChecked -Label "Fast-forward migration branch" -Action {
    git merge --ff-only "origin/$ExpectedBranch"
}

$Branch = (git branch --show-current).Trim()
if ($Branch -ne $ExpectedBranch) {
    throw "Wrong branch after synchronization: $Branch"
}

$Head = (git rev-parse --short=8 HEAD).Trim()
Write-Host "PASS: Migration branch synchronized at $Head" -ForegroundColor Green

# Re-resolve after synchronization so the newest inner autopilot is always used.
$InnerAutopilot = Join-Path $RepoRoot "RUN_VISH_STRIPE_SECURE_RECOVERY.ps1"
if (-not (Test-Path -LiteralPath $InnerAutopilot -PathType Leaf)) {
    throw "The synchronized branch is missing $InnerAutopilot"
}

$InnerArguments = @{
    PagesUrl = $PagesUrl
    ProjectName = $ProjectName
    SkipGitSync = $true
}
if ($LiveMode) { $InnerArguments.LiveMode = $true }
if ($ResetStripeKey) { $InnerArguments.ResetStripeKey = $true }
if ($Rebuild) { $InnerArguments.Rebuild = $true }
if ($ForceStripeLogin) { $InnerArguments.ForceStripeLogin = $true }
if ($AllowManualKeyFallback) { $InnerArguments.AllowManualKeyFallback = $true }
if ($SkipFocusedTests) { $InnerArguments.SkipFocusedTests = $true }

Write-Host "`nISC:: RUN FULLY AUTOMATED STRIPE RECOVERY" -ForegroundColor Cyan
& $InnerAutopilot @InnerArguments

if ($LASTEXITCODE -ne 0) {
    throw "Stripe autopilot returned exit code $LASTEXITCODE."
}

Write-Host "`nVISH ONE-COMMAND STRIPE AUTOPILOT: PASS" -ForegroundColor Green
Write-Host "Generated evidence archive: $ArchiveRoot" -ForegroundColor Green
