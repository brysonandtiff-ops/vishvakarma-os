[CmdletBinding()]
param(
    [string]$RepoPath = "C:\Users\bryso\dev\FUTURE PROJECTS\vishvakarma-os-cloudflare-cutover",
    [string]$Branch = "agent/cloudflare-pages-workers-migration",
    [switch]$ForceStripeLogin,
    [switch]$ResetStripeKey,
    [bool]$DeleteVercelProject = $true
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ISC = Injection Script Code
# This bootstrap is intentionally safe to execute from $env:TEMP. It repairs a
# checkout blocked only by generated build/evidence files, synchronizes the
# exact migration branch, then hands control to RUN_VISH_EVERYTHING.ps1.

if (-not (Test-Path -LiteralPath $RepoPath -PathType Container)) {
    throw "Vishvakarma.OS repository was not found: $RepoPath"
}

Set-Location $RepoPath

$Origin = (git remote get-url origin).Trim()
if ($LASTEXITCODE -ne 0 -or $Origin -notmatch 'brysonandtiff-ops/vishvakarma-os') {
    throw "The target folder is not the expected Vishvakarma.OS repository."
}

$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$LocalRoot = Join-Path $RepoPath ".local\cloudflare-proof"
$ArchiveRoot = Join-Path $LocalRoot "one-click-generated-archive\$RunId"
$StatePath = Join-Path $LocalRoot "one-click-last-run.json"
$GeneratedPaths = @(
    "dist",
    "docs/release/evidence",
    "evidence",
    "supabase/.temp",
    "public/build-meta.json",
    "coverage",
    "playwright-report",
    "test-results",
    ".wrangler"
)

New-Item -ItemType Directory -Force -Path $ArchiveRoot | Out-Null

function Write-State {
    param(
        [Parameter(Mandatory = $true)][string]$Result,
        [Parameter(Mandatory = $true)][string]$Detail
    )

    [pscustomobject]@{
        GeneratedAt = (Get-Date).ToString("o")
        Result = $Result
        Detail = $Detail
        Repository = $RepoPath
        Branch = $Branch
        Head = $(try { (git rev-parse HEAD).Trim() } catch { $null })
        GeneratedArchive = $ArchiveRoot
    } | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $StatePath -Encoding utf8
}

function Copy-GeneratedPath {
    param([Parameter(Mandatory = $true)][string]$RelativePath)

    $Source = Join-Path $RepoPath $RelativePath
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

try {
    Write-Host "VISHVAKARMA.OS TRUE ONE-CLICK EVERYTHING AUTOPILOT" -ForegroundColor Magenta
    Write-Host "Repository: $RepoPath"
    Write-Host "Chain: archive generated output -> clean -> sync -> full release -> cutover" -ForegroundColor Cyan

    Write-Host "`nISC:: ARCHIVE ALL GENERATED OUTPUT" -ForegroundColor Cyan
    foreach ($Path in $GeneratedPaths) {
        Copy-GeneratedPath -RelativePath $Path
    }
    Write-Host "PASS: Generated build and evidence files archived" -ForegroundColor Green

    Write-Host "`nISC:: NORMALIZE GENERATED OUTPUT" -ForegroundColor Cyan
    $TrackedGenerated = @(
        git ls-files -- @GeneratedPaths | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }
    )
    if ($TrackedGenerated.Count -gt 0) {
        Invoke-NativeChecked -Label "Restore tracked generated output" -Action {
            git restore --staged --worktree -- @TrackedGenerated
        } | Out-Null
    }

    Invoke-NativeChecked -Label "Remove untracked generated output" -Action {
        git clean -fd -- @GeneratedPaths
    } | Out-Null

    $Unexpected = @(
        git status --porcelain=v1 --untracked-files=all | Where-Object {
            $Line = [string]$_
            -not $Line.StartsWith("?? .local/")
        }
    )
    if ($Unexpected.Count -gt 0) {
        throw "Real source changes remain and were protected:`n$($Unexpected -join "`n")"
    }
    Write-Host "PASS: Generated output normalized; genuine source protection remains active" -ForegroundColor Green

    Write-Host "`nISC:: SYNCHRONIZE EXACT MIGRATION BRANCH" -ForegroundColor Cyan
    Invoke-NativeChecked -Label "Fetch migration branch" -Action {
        git fetch origin $Branch
    } | Out-Null
    Invoke-NativeChecked -Label "Switch migration branch" -Action {
        git switch $Branch
    } | Out-Null
    Invoke-NativeChecked -Label "Fast-forward migration branch" -Action {
        git merge --ff-only "origin/$Branch"
    } | Out-Null

    $Head = (git rev-parse HEAD).Trim()
    $RemoteHead = (git rev-parse "origin/$Branch").Trim()
    if ($Head -ne $RemoteHead) {
        throw "Local migration head does not match origin after synchronization."
    }
    Write-Host "PASS: Exact migration branch synchronized at $($Head.Substring(0, 8))" -ForegroundColor Green

    $Everything = Join-Path $RepoPath "RUN_VISH_EVERYTHING.ps1"
    if (-not (Test-Path -LiteralPath $Everything -PathType Leaf)) {
        throw "The synchronized branch is missing RUN_VISH_EVERYTHING.ps1."
    }

    Write-Host "`nISC:: RUN COMPLETE EVERYTHING CONTROLLER" -ForegroundColor Cyan
    $Arguments = @{
        ForceUnlock = $true
        DeleteVercelProject = $DeleteVercelProject
    }
    if ($ForceStripeLogin) { $Arguments.ForceStripeLogin = $true }
    if ($ResetStripeKey) { $Arguments.ResetStripeKey = $true }

    & $Everything @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Everything controller returned exit code $LASTEXITCODE."
    }

    Write-State -Result "PASS" -Detail "Generated output normalized; exact branch synchronized; everything controller passed."
    Write-Host "`nVISHVAKARMA.OS TRUE ONE-CLICK AUTOPILOT: PASS" -ForegroundColor Green
    Write-Host "State: $StatePath" -ForegroundColor Yellow
    $global:LASTEXITCODE = 0
}
catch {
    Write-State -Result "BLOCKED" -Detail $_.Exception.Message
    Write-Host "`nVISHVAKARMA.OS TRUE ONE-CLICK AUTOPILOT: BLOCKED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "No source change, password, API key, access token, or webhook secret was printed or committed." -ForegroundColor Yellow
    Write-Host "Generated archive: $ArchiveRoot" -ForegroundColor Yellow
    $global:LASTEXITCODE = 1
}
