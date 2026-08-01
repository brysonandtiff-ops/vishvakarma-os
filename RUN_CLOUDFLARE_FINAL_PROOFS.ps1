[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [switch]$SkipPull
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$EvidenceRoot = Join-Path $RepoRoot "evidence\cloudflare-cutover"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$TranscriptPath = Join-Path $EvidenceRoot "final-proofs-$Timestamp.log"
$Passes = [System.Collections.Generic.List[string]]::new()
$Failures = [System.Collections.Generic.List[string]]::new()

New-Item -ItemType Directory -Force -Path $EvidenceRoot | Out-Null
Set-Location $RepoRoot
Start-Transcript -Path $TranscriptPath -Force | Out-Null

function Invoke-Proof {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host "`n==> $Name" -ForegroundColor Cyan
    try {
        $global:LASTEXITCODE = 0
        & $Command
        $Code = $LASTEXITCODE
        if ($null -ne $Code -and $Code -ne 0) {
            throw "$Name returned exit code $Code"
        }
        $Passes.Add($Name)
        Write-Host "PASS: $Name" -ForegroundColor Green
    }
    catch {
        $Failures.Add("$Name — $($_.Exception.Message)")
        Write-Host "FAIL: $Name — $($_.Exception.Message)" -ForegroundColor Red
    }
}

try {
    Write-Host "VISHVAKARMA.OS FINAL CLOUDFLARE PROOFS" -ForegroundColor Cyan
    Write-Host "Repository: $RepoRoot"
    Write-Host "Target: $PagesUrl"

    $CurrentBranch = (git branch --show-current).Trim()
    if ($CurrentBranch -ne $ExpectedBranch) {
        throw "Wrong branch. Expected '$ExpectedBranch' but found '$CurrentBranch'."
    }

    if (-not $SkipPull) {
        Invoke-Proof "Fetch migration branch" {
            git fetch origin $ExpectedBranch
        }
        Invoke-Proof "Fast-forward migration branch" {
            git pull --ff-only origin $ExpectedBranch
        }
    }

    $env:CLOUDFLARE_PAGES_URL = $PagesUrl
    $env:PRODUCTION_URL = $PagesUrl

    Invoke-Proof "Live health, deep routes, secured API, PWA and cache checks" {
        node .\scripts\deployment\verify-cloudflare-live.mjs
    }

    Write-Host "`nA Chromium window will open for the next proof." -ForegroundColor Yellow
    Write-Host "Complete Google sign-in when prompted." -ForegroundColor Yellow
    Write-Host "When Stripe Checkout opens, do NOT enter card details." -ForegroundColor Yellow

    Invoke-Proof "Google callback, session refresh and Studio Checkout proof" {
        node .\scripts\deployment\verify-cloudflare-interactive-auth-checkout.mjs
    }

    Invoke-Proof "Signed Stripe webhook delivery proof" {
        node .\scripts\deployment\verify-cloudflare-stripe-webhook.mjs
    }

    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "PASSED: $($Passes.Count)" -ForegroundColor Green
    Write-Host "FAILED: $($Failures.Count)" -ForegroundColor $(if ($Failures.Count -gt 0) { "Red" } else { "Green" })

    if ($Failures.Count -eq 0) {
        Write-Host "`nFINAL CLOUDFLARE PRE-MERGE PROOFS: PASS" -ForegroundColor Green
        Write-Host "Auth callback, session persistence, Stripe Checkout, signed webhook, health, routes and PWA are proven." -ForegroundColor Green
    }
    else {
        Write-Host "`nFINAL CLOUDFLARE PRE-MERGE PROOFS: BLOCKED" -ForegroundColor Red
        foreach ($Failure in $Failures) {
            Write-Host " - $Failure" -ForegroundColor Red
        }
    }

    Write-Host "`nEvidence log: $TranscriptPath" -ForegroundColor Yellow
}
catch {
    Write-Host "`nRUNNER BLOCKED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Evidence log: $TranscriptPath" -ForegroundColor Yellow
}
finally {
    Stop-Transcript | Out-Null
}

Write-Host ""
Read-Host "Press Enter only after taking a screenshot"
