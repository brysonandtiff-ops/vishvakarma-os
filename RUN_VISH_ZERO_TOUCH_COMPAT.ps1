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
# Compatibility launcher for the zero-touch controller. It patches only known
# PowerShell interpolation defects and generated-output normalization rules,
# parses the complete result, and then executes it from the ignored local vault.

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourcePath = Join-Path $RepoRoot "RUN_VISH_ZERO_TOUCH_CUTOVER.ps1"
$CompatRoot = Join-Path $RepoRoot ".local\cloudflare-proof\zero-touch-compat"
$PatchedPath = Join-Path $CompatRoot "RUN_VISH_ZERO_TOUCH_CUTOVER.patched.ps1"

if (-not (Test-Path -LiteralPath $SourcePath -PathType Leaf)) {
    throw "Missing zero-touch controller: $SourcePath"
}

New-Item -ItemType Directory -Force -Path $CompatRoot | Out-Null

$Source = Get-Content -Raw -LiteralPath $SourcePath

$RequiredRepairs = [ordered]@{
    'Write-Host "$Status: $Name - $Detail"' = 'Write-Host "${Status}: $Name - $Detail"'
    'git merge --no-ff "origin/$MigrationBranch" -m "Merge PR #$PullRequestNumber: Cloudflare Pages and Workers migration"' = 'git merge --no-ff "origin/$MigrationBranch" -m "Merge PR #${PullRequestNumber}: Cloudflare Pages and Workers migration"'
    '$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path' = '$RepoRoot = [Environment]::GetEnvironmentVariable("VISH_ZERO_TOUCH_REPO_ROOT", "Process")'
    '"dist/build-meta.json",' = '"dist",'
}

foreach ($Entry in $RequiredRepairs.GetEnumerator()) {
    if (-not $Source.Contains($Entry.Key)) {
        throw "Expected zero-touch compatibility target was not found: $($Entry.Key)"
    }
    $Source = $Source.Replace($Entry.Key, $Entry.Value)
}

$MergeMarker = @'
    Invoke-Step -Name "Merge pull request branch into main" -Action {
        Invoke-NativeChecked -Label "Fetch main" -Action { git fetch origin $MainBranch } | Out-Null
'@

$MergeReplacement = @'
    Invoke-Step -Name "Merge pull request branch into main" -Action {
        # Stripe, browser and repository proofs regenerate dist/evidence. Archive
        # and normalize them before changing branches so build output can never
        # block the verified merge.
        Normalize-GeneratedEvidence
        Invoke-NativeChecked -Label "Fetch main" -Action { git fetch origin $MainBranch } | Out-Null
'@

if (-not $Source.Contains($MergeMarker)) {
    throw "Could not locate the pre-main merge normalization insertion point."
}
$Source = $Source.Replace($MergeMarker, $MergeReplacement)

Set-Content -LiteralPath $PatchedPath -Value $Source -Encoding utf8

$Tokens = $null
$ParseErrors = $null
[void][System.Management.Automation.Language.Parser]::ParseFile(
    $PatchedPath,
    [ref]$Tokens,
    [ref]$ParseErrors
)

if (@($ParseErrors).Count -gt 0) {
    $Details = @($ParseErrors | ForEach-Object {
        "line $($_.Extent.StartLineNumber), column $($_.Extent.StartColumnNumber): $($_.Message)"
    }) -join "`n"
    throw "The patched zero-touch controller still contains PowerShell syntax errors:`n$Details"
}

Write-Host "PASS: Zero-touch PowerShell controller parsed without errors" -ForegroundColor Green
Write-Host "PASS: Complete dist/ output is classified as generated" -ForegroundColor Green
Write-Host "PASS: Pre-main branch cleanup is installed" -ForegroundColor Green

$PreviousRepoRoot = [Environment]::GetEnvironmentVariable(
    "VISH_ZERO_TOUCH_REPO_ROOT",
    "Process"
)

try {
    [Environment]::SetEnvironmentVariable(
        "VISH_ZERO_TOUCH_REPO_ROOT",
        $RepoRoot,
        "Process"
    )

    & $PatchedPath @PSBoundParameters
    if ($LASTEXITCODE -ne 0) {
        throw "Patched zero-touch controller returned exit code $LASTEXITCODE."
    }

    $global:LASTEXITCODE = 0
}
finally {
    [Environment]::SetEnvironmentVariable(
        "VISH_ZERO_TOUCH_REPO_ROOT",
        $PreviousRepoRoot,
        "Process"
    )
}
