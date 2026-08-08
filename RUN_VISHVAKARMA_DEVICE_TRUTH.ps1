[CmdletBinding()]
param(
    [switch]$InstallBrowsers,
    [switch]$Final,
    [string]$Project = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExpectedRepo = "brysonandtiff-ops/vishvakarma-os"
$ExpectedPackageName = "vishvakarma-os"

function Fail-Guard([string]$Message) {
    Write-Host ""
    Write-Host "[BLOCKED] VISHVAKARMA.OS repository guard failed." -ForegroundColor Red
    Write-Host $Message -ForegroundColor Red
    Write-Host "No tests were started and no repository files were changed by this runner." -ForegroundColor Yellow
    exit 2
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host " VISHVAKARMA.OS MULTI-DEVICE HUMAN TRUTH VALIDATION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host ""

Push-Location $RepoRoot
try {
    if (-not (Test-Path (Join-Path $RepoRoot "package.json"))) {
        Fail-Guard "package.json is missing from $RepoRoot"
    }

    $Package = Get-Content (Join-Path $RepoRoot "package.json") -Raw | ConvertFrom-Json
    if ($Package.name -ne $ExpectedPackageName) {
        Fail-Guard "package.json name '$($Package.name)' does not equal '$ExpectedPackageName'."
    }

    $GitRoot = (& git rev-parse --show-toplevel 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { Fail-Guard "This folder is not a valid Git repository." }

    $Origin = (& git remote get-url origin 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { Fail-Guard "Git origin remote is missing." }

    $CanonicalRemote = $Origin -match "github\.com[:/]brysonandtiff-ops/vishvakarma-os(?:\.git)?$"
    if (-not $CanonicalRemote) {
        Fail-Guard "Origin '$Origin' is not the canonical $ExpectedRepo repository."
    }

    $Branch = (& git branch --show-current | Out-String).Trim()
    $Head = (& git rev-parse HEAD | Out-String).Trim()
    $Status = (& git status --short | Out-String).Trim()

    Write-Host "Repository : $ExpectedRepo" -ForegroundColor Green
    Write-Host "Local root : $GitRoot"
    Write-Host "Branch     : $Branch"
    Write-Host "HEAD       : $Head"
    Write-Host "Origin     : $Origin"
    if ([string]::IsNullOrWhiteSpace($Status)) {
        Write-Host "Worktree   : CLEAN" -ForegroundColor Green
    }
    else {
        Write-Host "Worktree   : DIRTY - recorded, testing will continue" -ForegroundColor Yellow
        Write-Host $Status -ForegroundColor DarkYellow
    }

    Write-Host ""
    Write-Host "IMPORTANT TRUTH BOUNDARY" -ForegroundColor Yellow
    Write-Host "Playwright phone/iPad/tablet profiles are EMULATED DEVICE evidence." -ForegroundColor Yellow
    Write-Host "They must not be described as physical-device proof." -ForegroundColor Yellow
    Write-Host ""

    $NodeArgs = @("scripts/device-truth/run.mjs")
    if ($InstallBrowsers) { $NodeArgs += "--install-browsers" }
    if ($Final) { $NodeArgs += "--final" }
    if (-not [string]::IsNullOrWhiteSpace($Project)) {
        $NodeArgs += "--project=$Project"
    }

    & node @NodeArgs
    $ExitCode = $LASTEXITCODE

    Write-Host ""
    if ($ExitCode -eq 0) {
        Write-Host "[PASS] Automated multi-device truth run completed." -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] The truth run found failures. This is useful baseline evidence; do not hide it." -ForegroundColor Red
    }

    Write-Host "Evidence folder: $RepoRoot\evidence\device-tests" -ForegroundColor Cyan
    exit $ExitCode
}
finally {
    Pop-Location
}
