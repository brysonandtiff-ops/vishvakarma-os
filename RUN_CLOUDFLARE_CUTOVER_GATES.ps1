[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [switch]$SkipInstall,
    [switch]$SkipSupabaseConfigPush
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$ProjectRef = "jyocvwipthswfcmvqgqe"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$EvidenceRoot = Join-Path $RepoRoot "evidence\cloudflare-cutover"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$TranscriptPath = Join-Path $EvidenceRoot "cloudflare-cutover-$Timestamp.log"

New-Item -ItemType Directory -Force -Path $EvidenceRoot | Out-Null
Set-Location $RepoRoot
Start-Transcript -Path $TranscriptPath -Force | Out-Null

function Invoke-Gate {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host "`n==> $Name" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
    Write-Host "PASS: $Name" -ForegroundColor Green
}

try {
    $CurrentBranch = (git branch --show-current).Trim()
    if ($CurrentBranch -ne $ExpectedBranch) {
        throw "Wrong branch. Expected '$ExpectedBranch' but found '$CurrentBranch'."
    }

    Invoke-Gate "Fetch migration branch" {
        git fetch origin $ExpectedBranch
    }

    Invoke-Gate "Fast-forward migration branch" {
        git pull --ff-only origin $ExpectedBranch
    }

    Invoke-Gate "Enable Corepack" {
        corepack enable
    }

    Invoke-Gate "Activate pnpm 9.15.0" {
        corepack prepare pnpm@9.15.0 --activate
    }

    if (-not $SkipInstall) {
        Invoke-Gate "Install locked dependencies" {
            pnpm install --frozen-lockfile
        }
    }

    if (-not $SkipSupabaseConfigPush) {
        if ([string]::IsNullOrWhiteSpace($env:SUPABASE_ACCESS_TOKEN)) {
            throw "SUPABASE_ACCESS_TOKEN is required to push the Cloudflare callback allow-list. Set it only in this terminal or your secure local environment."
        }

        Invoke-Gate "Link Supabase project" {
            npx supabase link --project-ref $ProjectRef
        }

        Invoke-Gate "Push Supabase Auth callback configuration" {
            npx supabase config push --yes
        }
    }

    Invoke-Gate "Cloudflare production build gates" {
        node scripts/vercel-build.mjs
    }

    Invoke-Gate "System contract gates" {
        pnpm run contract:gates
    }

    Invoke-Gate "Authentication configuration gates" {
        pnpm run auth:gates
    }

    Invoke-Gate "PWA gates" {
        pnpm run pwa:gates
    }

    Invoke-Gate "Performance gates" {
        pnpm run perf:gates
    }

    Invoke-Gate "Deep-route browser proof" {
        pnpm run test:e2e:deep-proof
    }

    $env:CLOUDFLARE_PAGES_URL = $PagesUrl

    Invoke-Gate "Live Cloudflare health, SPA, API, PWA and cache proof" {
        node scripts/deployment/verify-cloudflare-live.mjs
    }

    Invoke-Gate "Stripe account, price and environment verification" {
        pnpm run verify:stripe-billing
    }

    Invoke-Gate "Signed Stripe webhook delivery proof" {
        node scripts/deployment/verify-cloudflare-stripe-webhook.mjs
    }

    Write-Host "`nAUTOMATED CLOUDFLARE CUTOVER GATES: PASS" -ForegroundColor Green
    Write-Host "Evidence log: $TranscriptPath" -ForegroundColor Green
    Write-Host "`nTwo human-session proofs remain before merge:" -ForegroundColor Yellow
    Write-Host "1. Complete Google or email-link login on $PagesUrl/auth and confirm editor access/session restore."
    Write-Host "2. Start a test Studio checkout on $PagesUrl/pricing and confirm Stripe Checkout opens, then cancel it."
    Write-Host "Do not move DNS or remove Vercel until those two proofs are recorded." -ForegroundColor Yellow
}
catch {
    Write-Host "`nCLOUDFLARE CUTOVER BLOCKED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Evidence log: $TranscriptPath" -ForegroundColor Yellow
    exit 1
}
finally {
    Stop-Transcript | Out-Null
}
