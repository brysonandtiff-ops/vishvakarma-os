[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [switch]$SkipPull,
    [switch]$SkipInstall,
    [switch]$SkipBrowserInstall,
    [switch]$SkipRepositoryGates,
    [switch]$SkipDeploymentWait,
    [int]$DeploymentTimeoutMinutes = 15,
    [switch]$Headed,
    [switch]$ResetAuthSession,
    [switch]$BootstrapOnly,
    [switch]$NonInteractive
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$EvidenceRoot = Join-Path $RepoRoot "evidence\cloudflare-cutover"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$TranscriptPath = Join-Path $EvidenceRoot "final-automation-$Timestamp.log"
$SummaryJsonPath = Join-Path $EvidenceRoot "final-automation-$Timestamp.json"
$SummaryMarkdownPath = Join-Path $EvidenceRoot "final-automation-$Timestamp.md"
$StepResults = [System.Collections.Generic.List[object]]::new()
$RunnerBlocked = $false
$RunnerBlockReason = $null

New-Item -ItemType Directory -Force -Path $EvidenceRoot | Out-Null
Set-Location $RepoRoot
Start-Transcript -Path $TranscriptPath -Force | Out-Null

function Invoke-Proof {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command,
        [switch]$Required
    )

    $StartedAt = Get-Date
    $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Host "`n==> $Name" -ForegroundColor Cyan

    try {
        $global:LASTEXITCODE = 0
        & $Command
        $Code = $LASTEXITCODE
        if ($null -ne $Code -and $Code -ne 0) {
            throw "$Name returned exit code $Code"
        }

        $Stopwatch.Stop()
        [void]$StepResults.Add([pscustomobject]@{
            Name = $Name
            Status = "PASS"
            Detail = "Completed successfully"
            StartedAt = $StartedAt.ToString("o")
            DurationSeconds = [Math]::Round($Stopwatch.Elapsed.TotalSeconds, 2)
        })
        Write-Host "PASS: $Name" -ForegroundColor Green
        return $true
    }
    catch {
        $Stopwatch.Stop()
        $Message = $_.Exception.Message
        [void]$StepResults.Add([pscustomobject]@{
            Name = $Name
            Status = "FAIL"
            Detail = $Message
            StartedAt = $StartedAt.ToString("o")
            DurationSeconds = [Math]::Round($Stopwatch.Elapsed.TotalSeconds, 2)
        })
        Write-Host "FAIL: $Name — $Message" -ForegroundColor Red

        if ($Required) {
            throw
        }
        return $false
    }
}

function Write-AutomationSummary {
    param(
        [Parameter(Mandatory = $true)][string]$Result,
        [string]$BlockReason
    )

    $GitHead = "unknown"
    $Branch = "unknown"
    try { $GitHead = (git rev-parse HEAD).Trim() } catch { }
    try { $Branch = (git branch --show-current).Trim() } catch { }

    $Summary = [pscustomobject]@{
        GeneratedAt = (Get-Date).ToString("o")
        Target = $PagesUrl
        Repository = $RepoRoot
        Branch = $Branch
        GitHead = $GitHead
        Result = $Result
        BlockReason = $BlockReason
        Steps = @($StepResults)
        Transcript = $TranscriptPath
    }

    $Summary | ConvertTo-Json -Depth 8 | Set-Content -Path $SummaryJsonPath -Encoding utf8

    $Markdown = [System.Collections.Generic.List[string]]::new()
    [void]$Markdown.Add("# Vishvakarma.OS Cloudflare Final Automation")
    [void]$Markdown.Add("")
    [void]$Markdown.Add("- Generated: $($Summary.GeneratedAt)")
    [void]$Markdown.Add("- Target: $($Summary.Target)")
    [void]$Markdown.Add("- Branch: $($Summary.Branch)")
    [void]$Markdown.Add("- Git head: $($Summary.GitHead)")
    [void]$Markdown.Add("- Result: **$Result**")
    if ($BlockReason) {
        [void]$Markdown.Add("- Block reason: $BlockReason")
    }
    [void]$Markdown.Add("")
    [void]$Markdown.Add("| Check | Result | Seconds | Detail |")
    [void]$Markdown.Add("| --- | --- | ---: | --- |")
    foreach ($Step in $StepResults) {
        $SafeName = ([string]$Step.Name).Replace("|", "\|")
        $SafeDetail = ([string]$Step.Detail).Replace("|", "\|")
        [void]$Markdown.Add("| $SafeName | $($Step.Status) | $($Step.DurationSeconds) | $SafeDetail |")
    }
    [void]$Markdown.Add("")
    $Markdown | Set-Content -Path $SummaryMarkdownPath -Encoding utf8
}

try {
    Write-Host "VISHVAKARMA.OS FULLY AUTOMATED CLOUDFLARE PROOFS" -ForegroundColor Cyan
    Write-Host "Repository: $RepoRoot"
    Write-Host "Target: $PagesUrl"
    Write-Host "Expected branch: $ExpectedBranch"

    $CurrentBranch = (git branch --show-current).Trim()
    if ($CurrentBranch -ne $ExpectedBranch) {
        throw "Wrong branch. Expected '$ExpectedBranch' but found '$CurrentBranch'."
    }

    $TrackedChanges = @(git status --porcelain --untracked-files=no)
    if ($TrackedChanges.Count -gt 0) {
        throw "Tracked local changes are present. Commit or restore them before running final proofs."
    }

    if (-not $SkipPull) {
        Invoke-Proof "Fetch migration branch" {
            git fetch origin $ExpectedBranch
        } -Required | Out-Null

        Invoke-Proof "Fast-forward migration branch" {
            git pull --ff-only origin $ExpectedBranch
        } -Required | Out-Null
    }

    Invoke-Proof "Verify Node version" {
        $NodeMajor = [int]((node --version).TrimStart('v').Split('.')[0])
        if ($NodeMajor -lt 20 -or $NodeMajor -ge 25) {
            throw "Node 20, 22, or 24 is required; found $(node --version)."
        }
        node --version
    } -Required | Out-Null

    Invoke-Proof "Enable Corepack and activate pnpm 9.15.0" {
        corepack enable
        if ($LASTEXITCODE -ne 0) { throw "corepack enable failed" }
        corepack prepare pnpm@9.15.0 --activate
    } -Required | Out-Null

    if (-not $SkipInstall) {
        Invoke-Proof "Install locked dependencies" {
            pnpm install --frozen-lockfile
        } -Required | Out-Null
    }

    if (-not $SkipBrowserInstall) {
        Invoke-Proof "Install or verify Playwright Chromium" {
            pnpm exec playwright install chromium
        } -Required | Out-Null
    }

    $ExpectedGitSha = (git rev-parse HEAD).Trim()
    $env:CLOUDFLARE_PAGES_URL = $PagesUrl
    $env:PRODUCTION_URL = $PagesUrl
    $env:EXPECTED_GIT_SHA = $ExpectedGitSha

    if (-not $SkipRepositoryGates) {
        Invoke-Proof "Full repository production build gates" {
            node .\scripts\vercel-build.mjs
        } | Out-Null

        Invoke-Proof "System contract gates" {
            pnpm run contract:gates
        } | Out-Null

        Invoke-Proof "Authentication configuration gates" {
            pnpm run auth:gates
        } | Out-Null

        Invoke-Proof "PWA configuration gates" {
            pnpm run pwa:gates
        } | Out-Null
    }

    if (-not $SkipDeploymentWait) {
        Invoke-Proof "Wait for Cloudflare to deploy the exact Git commit" {
            $Base = $PagesUrl.TrimEnd('/')
            $Deadline = (Get-Date).AddMinutes($DeploymentTimeoutMinutes)
            $LastSeen = "unavailable"

            while ((Get-Date) -lt $Deadline) {
                try {
                    $CacheBuster = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    $Meta = Invoke-RestMethod `
                        -Uri "$Base/build-meta.json?proof=$CacheBuster" `
                        -Headers @{ "Cache-Control" = "no-cache" } `
                        -TimeoutSec 30
                    $LastSeen = [string]$Meta.gitSha
                    if ($LastSeen -eq $ExpectedGitSha) {
                        Write-Host "Cloudflare is serving exact commit $ExpectedGitSha" -ForegroundColor Green
                        return
                    }
                }
                catch {
                    $LastSeen = $_.Exception.Message
                }

                Write-Host "Waiting for Cloudflare. Expected $ExpectedGitSha; currently $LastSeen" -ForegroundColor Yellow
                Start-Sleep -Seconds 15
            }

            throw "Cloudflare did not serve exact commit $ExpectedGitSha within $DeploymentTimeoutMinutes minute(s). Last response: $LastSeen"
        } -Required | Out-Null
    }

    Invoke-Proof "Live exact-commit health, deep routes, secured API, PWA and cache checks" {
        node .\scripts\deployment\verify-cloudflare-live.mjs
    } -Required | Out-Null

    $AuthArguments = [System.Collections.Generic.List[string]]::new()
    [void]$AuthArguments.Add(".\scripts\deployment\verify-cloudflare-interactive-auth-checkout.mjs")
    if ($Headed) { [void]$AuthArguments.Add("--headed") }
    if ($ResetAuthSession) { [void]$AuthArguments.Add("--reset-session") }
    if ($BootstrapOnly) { [void]$AuthArguments.Add("--bootstrap-only") }
    if ($NonInteractive) { [void]$AuthArguments.Add("--non-interactive") }

    Invoke-Proof "Reusable Supabase session, callback refresh and Studio Checkout proof" {
        & node @AuthArguments
    } | Out-Null

    if (-not $BootstrapOnly) {
        Invoke-Proof "Stripe account, prices and environment verification" {
            pnpm run verify:stripe-billing
        } | Out-Null

        Invoke-Proof "Signed Stripe webhook delivery proof" {
            node .\scripts\deployment\verify-cloudflare-stripe-webhook.mjs
        } | Out-Null
    }
}
catch {
    $RunnerBlocked = $true
    $RunnerBlockReason = $_.Exception.Message
    Write-Host "`nRUNNER BLOCKED: $RunnerBlockReason" -ForegroundColor Red
}
finally {
    $FailedSteps = @($StepResults | Where-Object { $_.Status -eq "FAIL" })
    $Result = if (-not $RunnerBlocked -and $FailedSteps.Count -eq 0) { "PASS" } else { "BLOCKED" }

    Write-AutomationSummary -Result $Result -BlockReason $RunnerBlockReason

    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "PASSED: $(@($StepResults | Where-Object { $_.Status -eq 'PASS' }).Count)" -ForegroundColor Green
    Write-Host "FAILED: $($FailedSteps.Count)" -ForegroundColor $(if ($FailedSteps.Count -gt 0) { "Red" } else { "Green" })

    if ($Result -eq "PASS") {
        Write-Host "`nFINAL CLOUDFLARE PRE-MERGE PROOFS: PASS" -ForegroundColor Green
        Write-Host "Future runs reuse the securely stored local Supabase session and can run headlessly." -ForegroundColor Green
        $global:LASTEXITCODE = 0
    }
    else {
        Write-Host "`nFINAL CLOUDFLARE PRE-MERGE PROOFS: BLOCKED" -ForegroundColor Red
        foreach ($Step in $FailedSteps) {
            Write-Host " - $($Step.Name): $($Step.Detail)" -ForegroundColor Red
        }
        if ($RunnerBlockReason) {
            Write-Host " - Runner: $RunnerBlockReason" -ForegroundColor Red
        }
        $global:LASTEXITCODE = 1
    }

    Write-Host "`nTranscript: $TranscriptPath" -ForegroundColor Yellow
    Write-Host "JSON summary: $SummaryJsonPath" -ForegroundColor Yellow
    Write-Host "Markdown summary: $SummaryMarkdownPath" -ForegroundColor Yellow
    Stop-Transcript | Out-Null
}
