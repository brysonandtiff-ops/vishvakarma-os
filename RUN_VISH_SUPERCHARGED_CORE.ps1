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

if (-not (Test-Path $NodeCore)) {
    throw "Missing supercharged Node core: $NodeCore"
}

$Arguments = [System.Collections.Generic.List[string]]::new()
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
$global:LASTEXITCODE = $LASTEXITCODE
