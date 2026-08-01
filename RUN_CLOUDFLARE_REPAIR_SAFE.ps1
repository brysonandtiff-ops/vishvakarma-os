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

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepairScript = Join-Path $RepoRoot "REPAIR_AND_RUN_CLOUDFLARE_FINAL_PROOFS.ps1"
$TrackedGeneratedPath = "dist/index.html"
$SkipWorktreeApplied = $false

Set-Location $RepoRoot

if (-not (Test-Path $RepairScript)) {
    throw "Missing repair script: $RepairScript"
}

try {
    Write-Host "VISHVAKARMA.OS SAFE CLOUDFLARE REPAIR LAUNCHER" -ForegroundColor Cyan
    Write-Host "Repository: $RepoRoot"

    git ls-files --error-unmatch -- $TrackedGeneratedPath *> $null
    if ($LASTEXITCODE -eq 0) {
        git update-index --skip-worktree -- $TrackedGeneratedPath
        if ($LASTEXITCODE -ne 0) {
            throw "Could not mark $TrackedGeneratedPath as generated for this run."
        }
        $SkipWorktreeApplied = $true
        Write-Host "Temporarily ignoring generated tracked file: $TrackedGeneratedPath" -ForegroundColor Yellow
    }

    $Forward = @{
        PagesUrl = $PagesUrl
        ProjectName = $ProjectName
    }
    if ($ResetVault) { $Forward.ResetVault = $true }
    if ($ResetAuthSession) { $Forward.ResetAuthSession = $true }
    if ($NonInteractive) { $Forward.NonInteractive = $true }
    if ($SkipSupabaseConfigPush) { $Forward.SkipSupabaseConfigPush = $true }
    if ($SkipCloudflareDeploy) { $Forward.SkipCloudflareDeploy = $true }

    & $RepairScript @Forward
}
finally {
    if ($SkipWorktreeApplied) {
        git update-index --no-skip-worktree -- $TrackedGeneratedPath
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Could not remove skip-worktree from $TrackedGeneratedPath. Run: git update-index --no-skip-worktree -- $TrackedGeneratedPath"
        }
        else {
            git restore --staged --worktree -- $TrackedGeneratedPath
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Could not restore $TrackedGeneratedPath automatically. Run: git restore --staged --worktree -- $TrackedGeneratedPath"
            }
            else {
                Write-Host "Restored generated tracked file and removed temporary Git flag: $TrackedGeneratedPath" -ForegroundColor Green
            }
        }
    }
}
