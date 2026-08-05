[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$ProjectName = "vishvakarma-os",
    [int]$MaxAttempts = 3,
    [int]$RetryDelaySeconds = 20,
    [switch]$ResetVault,
    [switch]$ResetAuthSession,
    [switch]$NonInteractive,
    [switch]$SkipSupabaseConfigPush,
    [switch]$SkipCloudflareDeploy,
    [switch]$SkipBrowserInstall,
    [switch]$SkipRepositoryGates
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeCore = Join-Path $RepoRoot "scripts\deployment\vish-supercharged-core.mjs"
$StripeFinalizer = Join-Path $RepoRoot "scripts\deployment\vish-stripe-checkout-finalizer.mjs"
$WindowsSpawnCompat = Join-Path $RepoRoot "scripts\deployment\windows-command-spawn-compat.cjs"

foreach ($Required in @($NodeCore, $StripeFinalizer, $WindowsSpawnCompat)) {
    if (-not (Test-Path -LiteralPath $Required)) {
        throw "Missing supercharged release component: $Required"
    }
}

if ($IsWindows) {
    $ProbePath = Join-Path $env:TEMP "vish-command-spawn-probe-$PID.cmd"
    try {
        "@echo off`r`nexit /b 0`r`n" | Set-Content -Path $ProbePath -Encoding ascii
        $ProbeJavaScript = @'
const { spawnSync } = require('node:child_process');
const result = spawnSync(process.argv[1], [], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
'@
        & node --require $WindowsSpawnCompat -e $ProbeJavaScript $ProbePath
        if ($LASTEXITCODE -ne 0) {
            throw "Windows .cmd compatibility self-test failed with exit code $LASTEXITCODE."
        }
        Write-Host "PASS: Windows .cmd/.bat process-launch compatibility" -ForegroundColor Green
    }
    finally {
        Remove-Item -Force $ProbePath -ErrorAction SilentlyContinue
    }
}

$Arguments = [System.Collections.Generic.List[string]]::new()
[void]$Arguments.Add('--require')
[void]$Arguments.Add($WindowsSpawnCompat)
[void]$Arguments.Add($NodeCore)
[void]$Arguments.Add('--pages-url')
[void]$Arguments.Add($PagesUrl)
[void]$Arguments.Add('--project-name')
[void]$Arguments.Add($ProjectName)
[void]$Arguments.Add('--max-attempts')
[void]$Arguments.Add([string]$MaxAttempts)
[void]$Arguments.Add('--retry-delay-seconds')
[void]$Arguments.Add([string]$RetryDelaySeconds)

if ($ResetAuthSession) { [void]$Arguments.Add('--reset-auth-session') }
if ($NonInteractive) { [void]$Arguments.Add('--non-interactive') }
if ($SkipSupabaseConfigPush) { [void]$Arguments.Add('--skip-supabase-config-push') }
if ($SkipCloudflareDeploy) { [void]$Arguments.Add('--skip-cloudflare-deploy') }
if ($SkipBrowserInstall) { [void]$Arguments.Add('--skip-browser-install') }
if ($SkipRepositoryGates) { [void]$Arguments.Add('--skip-repository-gates') }

if ($ResetVault) {
    Write-Host "ResetVault is no longer needed: Supabase and Stripe authentication are stored by their official CLIs." -ForegroundColor Yellow
}

& node @Arguments
$CoreExitCode = $LASTEXITCODE

if ($CoreExitCode -eq 0) {
    $global:LASTEXITCODE = 0
    return
}

Write-Host "`nISC:: CHECK FOR AUTH-PASSED STRIPE-ONLY RECOVERY" -ForegroundColor Cyan
Write-Host "The primary core blocked. The focused finalizer will continue only when recent evidence proves authentication passed and Stripe Checkout is the sole blocker." -ForegroundColor Yellow

& node `
    --require $WindowsSpawnCompat `
    $StripeFinalizer `
    --pages-url $PagesUrl `
    --project-name $ProjectName

$FinalizerExitCode = $LASTEXITCODE
if ($FinalizerExitCode -eq 0) {
    Write-Host "PASS: Focused Stripe checkout recovery completed" -ForegroundColor Green
    $global:LASTEXITCODE = 0
    return
}

Write-Host "BLOCKED: Primary release core and focused Stripe finalizer both failed." -ForegroundColor Red
$global:LASTEXITCODE = $FinalizerExitCode
