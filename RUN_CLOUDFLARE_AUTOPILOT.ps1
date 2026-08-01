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
    [switch]$NoSelfUpdate,
    [switch]$ResumeAfterSelfUpdate
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$ExpectedRemotePattern = "brysonandtiff-ops/vishvakarma-os"
$PnpmVersion = "9.15.0"
$WranglerVersion = "4.118.0"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ScriptPath = $MyInvocation.MyCommand.Path
$RepairScript = Join-Path $RepoRoot "REPAIR_AND_RUN_CLOUDFLARE_FINAL_PROOFS.ps1"
$FinalProofScript = Join-Path $RepoRoot "RUN_CLOUDFLARE_FINAL_PROOFS.ps1"
$LocalRoot = Join-Path $RepoRoot ".local\cloudflare-proof"
$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path $LocalRoot "generated-backups\$RunId"
$TranscriptPath = Join-Path $LocalRoot "autopilot-$RunId.log"
$LastRunPath = Join-Path $LocalRoot "autopilot-last-run.json"
$TranscriptStarted = $false
$GeneratedIndexFlagsApplied = [System.Collections.Generic.List[string]]::new()
$AutopilotSucceeded = $false
$FinalReason = $null
$FinalSummaryPath = $null

function Invoke-NativeRequired {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host "`n==> $Name" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
    Write-Host "PASS: $Name" -ForegroundColor Green
}

function Invoke-WithRetry {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command,
        [int]$Attempts = 3,
        [int]$DelaySeconds = 10
    )

    $LastError = $null
    for ($Attempt = 1; $Attempt -le $Attempts; $Attempt++) {
        try {
            Invoke-NativeRequired "$Name (attempt $Attempt/$Attempts)" $Command
            return
        }
        catch {
            $LastError = $_
            if ($Attempt -ge $Attempts) {
                throw
            }
            Write-Host "$Name failed transiently: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "Retrying in $DelaySeconds second(s)..." -ForegroundColor Yellow
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    if ($LastError) {
        throw $LastError
    }
}

function Test-IsGeneratedPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    $Normalized = $Path.Replace('\', '/').Trim('"')
    return (
        $Normalized -eq "public/build-meta.json" -or
        $Normalized.StartsWith("dist/") -or
        $Normalized.StartsWith("docs/release/evidence/") -or
        $Normalized.StartsWith("evidence/") -or
        $Normalized.StartsWith(".local/") -or
        $Normalized.StartsWith(".wrangler/") -or
        $Normalized.StartsWith("coverage/") -or
        $Normalized.StartsWith("playwright-report/") -or
        $Normalized.StartsWith("test-results/")
    )
}

function Get-WorktreeEntries {
    $Lines = @(git status --porcelain=v1 --untracked-files=all)
    $Entries = [System.Collections.Generic.List[object]]::new()

    foreach ($Line in $Lines) {
        if ([string]::IsNullOrWhiteSpace($Line) -or $Line.Length -lt 4) {
            continue
        }

        $Status = $Line.Substring(0, 2)
        $PathText = $Line.Substring(3).Trim()
        if ($PathText -match ' -> ') {
            $PathText = ($PathText -split ' -> ')[-1]
        }
        $PathText = $PathText.Trim('"').Replace('\', '/')

        [void]$Entries.Add([pscustomobject]@{
            Status = $Status
            Path = $PathText
            IsUntracked = ($Status -eq "??")
            IsGenerated = (Test-IsGeneratedPath -Path $PathText)
        })
    }

    return @($Entries)
}

function Backup-And-ResetGeneratedChanges {
    param([Parameter(Mandatory = $true)][string]$Reason)

    $Entries = @(Get-WorktreeEntries)
    $SourceEntries = @($Entries | Where-Object { -not $_.IsGenerated })
    if ($SourceEntries.Count -gt 0) {
        $SourceList = ($SourceEntries | ForEach-Object { "$($_.Status) $($_.Path)" }) -join ', '
        throw "Real source changes are present and were not touched: $SourceList"
    }

    $TrackedGenerated = @($Entries | Where-Object { $_.IsGenerated -and -not $_.IsUntracked })
    if ($TrackedGenerated.Count -eq 0) {
        return
    }

    Write-Host "Preserving generated files before $Reason..." -ForegroundColor Yellow
    foreach ($Entry in $TrackedGenerated) {
        $SourcePath = Join-Path $RepoRoot $Entry.Path
        if (Test-Path -LiteralPath $SourcePath -PathType Leaf) {
            $Destination = Join-Path $BackupRoot $Entry.Path
            $DestinationParent = Split-Path -Parent $Destination
            New-Item -ItemType Directory -Force -Path $DestinationParent | Out-Null
            Copy-Item -LiteralPath $SourcePath -Destination $Destination -Force
        }
    }

    $Paths = @($TrackedGenerated | ForEach-Object { $_.Path } | Select-Object -Unique)
    & git restore --staged --worktree -- @Paths
    if ($LASTEXITCODE -ne 0) {
        throw "Could not reset generated files before $Reason."
    }

    Write-Host "Generated changes were backed up to $BackupRoot and reset safely." -ForegroundColor Green
}

function Get-TrackedGeneratedPaths {
    $Paths = @(git ls-files -- dist docs/release/evidence public/build-meta.json)
    return @($Paths | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
}

function Enable-GeneratedIndexIsolation {
    foreach ($Path in @(Get-TrackedGeneratedPaths)) {
        git update-index --no-assume-unchanged -- $Path 2>$null
        git update-index --no-skip-worktree -- $Path 2>$null
        git update-index --skip-worktree -- $Path
        if ($LASTEXITCODE -ne 0) {
            throw "Could not isolate generated tracked file: $Path"
        }
        [void]$GeneratedIndexFlagsApplied.Add($Path)
    }

    if ($GeneratedIndexFlagsApplied.Count -gt 0) {
        Write-Host "Temporarily isolated $($GeneratedIndexFlagsApplied.Count) tracked generated file(s)." -ForegroundColor Green
    }
}

function Disable-GeneratedIndexIsolation {
    foreach ($Path in $GeneratedIndexFlagsApplied) {
        git update-index --no-skip-worktree -- $Path 2>$null
        git update-index --no-assume-unchanged -- $Path 2>$null
        git restore --staged --worktree -- $Path 2>$null
    }
    $GeneratedIndexFlagsApplied.Clear()
}

function Import-LocalEnvironmentFile {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return
    }

    foreach ($Line in Get-Content -LiteralPath $Path) {
        $Trimmed = $Line.Trim()
        if ([string]::IsNullOrWhiteSpace($Trimmed) -or $Trimmed.StartsWith('#')) {
            continue
        }

        if ($Trimmed -notmatch '^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            continue
        }

        $Name = $Matches[1]
        $Value = $Matches[2].Trim()
        if (($Value.StartsWith('"') -and $Value.EndsWith('"')) -or ($Value.StartsWith("'") -and $Value.EndsWith("'"))) {
            $Value = $Value.Substring(1, $Value.Length - 2)
        }

        $Existing = [Environment]::GetEnvironmentVariable($Name, "Process")
        if ([string]::IsNullOrWhiteSpace($Existing)) {
            [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
        }
    }

    Write-Host "Loaded available local environment values from $(Split-Path -Leaf $Path) without printing secrets." -ForegroundColor Green
}

function Get-LatestFinalSummary {
    param([Parameter(Mandatory = $true)][datetime]$Since)

    $EvidenceRoot = Join-Path $RepoRoot "evidence\cloudflare-cutover"
    if (-not (Test-Path $EvidenceRoot)) {
        return $null
    }

    $File = Get-ChildItem -Path $EvidenceRoot -Filter "final-automation-*.json" -File |
        Where-Object { $_.LastWriteTime -ge $Since.AddSeconds(-5) } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $File) {
        return $null
    }

    try {
        $Payload = Get-Content -Raw -Path $File.FullName | ConvertFrom-Json
        return [pscustomobject]@{
            Path = $File.FullName
            Payload = $Payload
        }
    }
    catch {
        return $null
    }
}

function Get-SummaryFailureText {
    param($Summary)

    if (-not $Summary) {
        return "The repair stopped before a final proof summary was produced."
    }

    $Details = [System.Collections.Generic.List[string]]::new()
    if (-not [string]::IsNullOrWhiteSpace([string]$Summary.Payload.BlockReason)) {
        [void]$Details.Add([string]$Summary.Payload.BlockReason)
    }

    foreach ($Step in @($Summary.Payload.Steps)) {
        if ([string]$Step.Status -eq "FAIL") {
            [void]$Details.Add("$($Step.Name): $($Step.Detail)")
        }
    }

    if ($Details.Count -eq 0) {
        return "Final proof result was $($Summary.Payload.Result)."
    }

    return ($Details -join " | ")
}

function Write-AutopilotResult {
    param(
        [Parameter(Mandatory = $true)][string]$Result,
        [string]$Reason,
        [string]$SummaryPath
    )

    $Head = "unknown"
    $Branch = "unknown"
    try { $Head = (git rev-parse HEAD).Trim() } catch { }
    try { $Branch = (git branch --show-current).Trim() } catch { }

    $GeneratedBackup = $null
    if (Test-Path $BackupRoot) {
        $GeneratedBackup = $BackupRoot
    }

    $Payload = [pscustomobject]@{
        GeneratedAt = (Get-Date).ToString("o")
        Result = $Result
        Reason = $Reason
        Repository = $RepoRoot
        Branch = $Branch
        GitHead = $Head
        Target = $PagesUrl
        FinalSummary = $SummaryPath
        Transcript = $TranscriptPath
        GeneratedBackup = $GeneratedBackup
    }

    $Payload | ConvertTo-Json -Depth 6 | Set-Content -Path $LastRunPath -Encoding utf8
}

function New-ForwardParameters {
    param([switch]$ForSelfUpdate)

    $Forward = @{
        PagesUrl = $PagesUrl
        ProjectName = $ProjectName
        MaxAttempts = $MaxAttempts
        RetryDelaySeconds = $RetryDelaySeconds
    }
    if ($ResetVault) { $Forward.ResetVault = $true }
    if ($ResetAuthSession) { $Forward.ResetAuthSession = $true }
    if ($NonInteractive) { $Forward.NonInteractive = $true }
    if ($SkipSupabaseConfigPush) { $Forward.SkipSupabaseConfigPush = $true }
    if ($SkipCloudflareDeploy) { $Forward.SkipCloudflareDeploy = $true }
    if ($SkipBrowserInstall) { $Forward.SkipBrowserInstall = $true }
    if ($NoSelfUpdate) { $Forward.NoSelfUpdate = $true }
    if ($ForSelfUpdate) { $Forward.ResumeAfterSelfUpdate = $true }
    return $Forward
}

New-Item -ItemType Directory -Force -Path $LocalRoot | Out-Null
Set-Location $RepoRoot

if (-not (Test-Path $RepairScript)) {
    throw "Missing repair script: $RepairScript"
}
if (-not (Test-Path $FinalProofScript)) {
    throw "Missing final proof script: $FinalProofScript"
}

# Clear stale index flags from an interrupted older run before inspecting the tree.
foreach ($Path in @(Get-TrackedGeneratedPaths)) {
    git update-index --no-skip-worktree -- $Path 2>$null
    git update-index --no-assume-unchanged -- $Path 2>$null
}

Backup-And-ResetGeneratedChanges -Reason "autopilot startup"

$OriginUrl = (git remote get-url origin).Trim()
if ($OriginUrl -notmatch [regex]::Escape($ExpectedRemotePattern)) {
    throw "Wrong repository remote: $OriginUrl"
}

$HeadBeforeUpdate = (git rev-parse HEAD).Trim()
Invoke-WithRetry "Fetch Cloudflare migration branch" {
    git fetch origin $ExpectedBranch
} -Attempts $MaxAttempts -DelaySeconds $RetryDelaySeconds

$CurrentBranch = (git branch --show-current).Trim()
if ($CurrentBranch -ne $ExpectedBranch) {
    $LocalBranchExists = git branch --list $ExpectedBranch
    if ([string]::IsNullOrWhiteSpace(($LocalBranchExists -join ""))) {
        Invoke-NativeRequired "Create local migration branch" {
            git switch --track "origin/$ExpectedBranch"
        }
    }
    else {
        Invoke-NativeRequired "Switch to migration branch" {
            git switch $ExpectedBranch
        }
    }
}

Invoke-NativeRequired "Fast-forward migration branch" {
    git merge --ff-only "origin/$ExpectedBranch"
}

$HeadAfterUpdate = (git rev-parse HEAD).Trim()
if (-not $NoSelfUpdate -and -not $ResumeAfterSelfUpdate -and $HeadAfterUpdate -ne $HeadBeforeUpdate) {
    Write-Host "Launcher updated from GitHub. Restarting automatically on commit $($HeadAfterUpdate.Substring(0, 8))..." -ForegroundColor Yellow
    $Forward = New-ForwardParameters -ForSelfUpdate
    & $ScriptPath @Forward
    $global:LASTEXITCODE = $LASTEXITCODE
    return
}

try {
    try {
        Start-Transcript -Path $TranscriptPath -Force | Out-Null
        $TranscriptStarted = $true
    }
    catch {
        Write-Warning "Could not start transcript: $($_.Exception.Message)"
    }

    Write-Host "VISHVAKARMA.OS CLOUDFLARE AUTOPILOT" -ForegroundColor Cyan
    Write-Host "Repository: $RepoRoot"
    Write-Host "Branch: $ExpectedBranch"
    Write-Host "Commit: $HeadAfterUpdate"
    Write-Host "Target: $PagesUrl"
    $ModeLabel = if ($NonInteractive) {
        "unattended vault/session reuse"
    }
    else {
        "automatic with one-time secure prompts when required"
    }
    Write-Host "Mode: $ModeLabel" -ForegroundColor Yellow

    foreach ($EnvFile in @(
        ".env.stripe.local",
        ".env.local",
        ".dev.vars.local",
        ".dev.vars"
    )) {
        Import-LocalEnvironmentFile -Path (Join-Path $RepoRoot $EnvFile)
    }

    if (-not $SkipBrowserInstall) {
        Invoke-WithRetry "Install or verify Playwright Chromium" {
            npx --yes "pnpm@$PnpmVersion" exec playwright install chromium
        } -Attempts $MaxAttempts -DelaySeconds $RetryDelaySeconds
    }

    $WranglerReady = $true
    try {
        Invoke-NativeRequired "Verify Cloudflare Wrangler login" {
            npx --yes "wrangler@$WranglerVersion" whoami
        }
    }
    catch {
        $WranglerReady = $false
    }

    if (-not $WranglerReady) {
        if ($NonInteractive) {
            throw "Wrangler is not logged in. Run once without -NonInteractive so Cloudflare login can complete."
        }
        Invoke-NativeRequired "Complete Cloudflare Wrangler login" {
            npx --yes "wrangler@$WranglerVersion" login
        }
        Invoke-NativeRequired "Recheck Cloudflare Wrangler login" {
            npx --yes "wrangler@$WranglerVersion" whoami
        }
    }

    Enable-GeneratedIndexIsolation

    $AttemptResetAuth = $ResetAuthSession.IsPresent
    for ($Attempt = 1; $Attempt -le $MaxAttempts; $Attempt++) {
        $AttemptStarted = Get-Date
        Write-Host "`n============================================================" -ForegroundColor Cyan
        Write-Host "AUTOPILOT REPAIR ATTEMPT $Attempt OF $MaxAttempts" -ForegroundColor Cyan
        Write-Host "============================================================" -ForegroundColor Cyan

        $RepairForward = @{
            PagesUrl = $PagesUrl
            ProjectName = $ProjectName
        }
        if ($ResetVault -and $Attempt -eq 1) { $RepairForward.ResetVault = $true }
        if ($AttemptResetAuth) { $RepairForward.ResetAuthSession = $true }
        if ($NonInteractive) { $RepairForward.NonInteractive = $true }
        if ($SkipSupabaseConfigPush) { $RepairForward.SkipSupabaseConfigPush = $true }
        if ($SkipCloudflareDeploy) { $RepairForward.SkipCloudflareDeploy = $true }

        $global:LASTEXITCODE = 0
        & $RepairScript @RepairForward

        $Summary = Get-LatestFinalSummary -Since $AttemptStarted
        if ($Summary -and [string]$Summary.Payload.Result -eq "PASS") {
            $AutopilotSucceeded = $true
            $FinalSummaryPath = $Summary.Path
            $FinalReason = "All Cloudflare, Supabase, Stripe, auth, checkout, webhook, route and PWA proofs passed."
            break
        }

        if ($Summary) {
            $FinalSummaryPath = $Summary.Path
        }
        else {
            $FinalSummaryPath = $null
        }
        $FinalReason = Get-SummaryFailureText $Summary
        Write-Host "Attempt $Attempt remains blocked: $FinalReason" -ForegroundColor Red

        if (-not $NonInteractive -and $FinalReason -match '(?i)session|callback|google|auth') {
            $AttemptResetAuth = $true
            Write-Host "The next attempt will rebuild the saved authentication session automatically." -ForegroundColor Yellow
        }

        if ($Attempt -lt $MaxAttempts) {
            Write-Host "Retrying the complete idempotent repair in $RetryDelaySeconds second(s)..." -ForegroundColor Yellow
            Start-Sleep -Seconds $RetryDelaySeconds
        }
    }

    if (-not $AutopilotSucceeded) {
        throw "Autopilot exhausted $MaxAttempts attempt(s). Last blocker: $FinalReason"
    }

    Write-AutopilotResult -Result "PASS" -Reason $FinalReason -SummaryPath $FinalSummaryPath
    Write-Host "`nCLOUDFLARE AUTOPILOT: PASS" -ForegroundColor Green
    Write-Host "Exact commit, Supabase callback/session, Stripe prices/Checkout/webhook, health, deep routes and PWA are proven." -ForegroundColor Green
    Write-Host "Final evidence: $FinalSummaryPath" -ForegroundColor Yellow
    Write-Host "Autopilot status: $LastRunPath" -ForegroundColor Yellow
    $global:LASTEXITCODE = 0
}
catch {
    $FinalReason = $_.Exception.Message
    Write-AutopilotResult -Result "BLOCKED" -Reason $FinalReason -SummaryPath $FinalSummaryPath
    Write-Host "`nCLOUDFLARE AUTOPILOT: BLOCKED" -ForegroundColor Red
    Write-Host $FinalReason -ForegroundColor Red
    Write-Host "No secret values were printed or committed." -ForegroundColor Yellow
    Write-Host "Autopilot status: $LastRunPath" -ForegroundColor Yellow
    $global:LASTEXITCODE = 1
}
finally {
    Disable-GeneratedIndexIsolation
    if ($TranscriptStarted) {
        Stop-Transcript | Out-Null
    }
}
