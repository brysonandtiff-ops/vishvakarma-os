[CmdletBinding()]
param(
    [string]$PagesUrl = "https://vishvakarma-os.pages.dev",
    [string]$ProjectName = "vishvakarma-os",
    [int]$MaxAttempts = 3,
    [int]$RetryDelaySeconds = 20,
    [int]$MinimumFreeDiskGB = 3,
    [switch]$ResetVault,
    [switch]$ResetAuthSession,
    [switch]$NonInteractive,
    [switch]$SkipSupabaseConfigPush,
    [switch]$SkipCloudflareDeploy,
    [switch]$SkipBrowserInstall,
    [switch]$ForceUnlock,
    [switch]$PreflightOnly,
    [switch]$DisableAutoRollback
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ExpectedBranch = "agent/cloudflare-pages-workers-migration"
$ExpectedRemotePattern = "brysonandtiff-ops/vishvakarma-os"
$WranglerVersion = "4.118.0"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$AutopilotPath = Join-Path $RepoRoot "RUN_CLOUDFLARE_AUTOPILOT.ps1"
$LocalRoot = Join-Path $RepoRoot ".local\cloudflare-proof"
$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$LockPath = Join-Path $LocalRoot "release-controller.lock.json"
$StatePath = Join-Path $LocalRoot "release-controller-state.json"
$LastRunPath = Join-Path $LocalRoot "release-controller-last-run.json"
$ReportPath = Join-Path $LocalRoot "release-controller-$RunId.md"
$TranscriptPath = Join-Path $LocalRoot "release-controller-$RunId.log"
$OwnsLock = $false
$TranscriptStarted = $false
$Steps = [System.Collections.Generic.List[object]]::new()
$PreviousDeployment = $null
$CurrentDeployment = $null
$RollbackResult = $null
$CoreResult = $null
$FinalResult = "BLOCKED"
$FinalReason = $null

function Write-State {
    param(
        [Parameter(Mandatory = $true)][string]$Phase,
        [string]$Detail
    )

    $Payload = [pscustomobject]@{
        UpdatedAt = (Get-Date).ToString("o")
        Phase = $Phase
        Detail = $Detail
        ProcessId = $PID
        Repository = $RepoRoot
        Target = $PagesUrl
        Steps = @($Steps)
    }
    $Payload | ConvertTo-Json -Depth 8 | Set-Content -Path $StatePath -Encoding utf8
}

function Add-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Status,
        [Parameter(Mandatory = $true)][string]$Detail,
        [double]$Seconds = 0
    )

    [void]$Steps.Add([pscustomobject]@{
        Name = $Name
        Status = $Status
        Detail = $Detail
        DurationSeconds = [Math]::Round($Seconds, 2)
        RecordedAt = (Get-Date).ToString("o")
    })
    Write-State -Phase $Name -Detail "$Status - $Detail"
}

function Invoke-ControllerStep {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command,
        [switch]$Optional
    )

    $Watch = [Diagnostics.Stopwatch]::StartNew()
    Write-Host "`n==> $Name" -ForegroundColor Cyan
    try {
        $Value = & $Command
        $Watch.Stop()
        Add-Step -Name $Name -Status "PASS" -Detail "Completed successfully" -Seconds $Watch.Elapsed.TotalSeconds
        Write-Host "PASS: $Name" -ForegroundColor Green
        return $Value
    }
    catch {
        $Watch.Stop()
        $Message = $_.Exception.Message
        Add-Step -Name $Name -Status $(if ($Optional) { "WARN" } else { "FAIL" }) -Detail $Message -Seconds $Watch.Elapsed.TotalSeconds
        Write-Host "$(if ($Optional) { 'WARN' } else { 'FAIL' }): $Name - $Message" -ForegroundColor $(if ($Optional) { 'Yellow' } else { 'Red' })
        if (-not $Optional) {
            throw
        }
        return $null
    }
}

function Invoke-Native {
    param([Parameter(Mandatory = $true)][scriptblock]$Command)
    $global:LASTEXITCODE = 0
    $Output = & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Native command returned exit code $LASTEXITCODE"
    }
    return $Output
}

function Get-CommandPathRequired {
    param([Parameter(Mandatory = $true)][string]$Name)
    $Command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $Command) {
        throw "Required command is missing: $Name"
    }
    return $Command.Source
}

function Test-GeneratedPath {
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

function Assert-NoRealSourceChanges {
    $Unexpected = [System.Collections.Generic.List[string]]::new()
    foreach ($Line in @(git status --porcelain=v1 --untracked-files=all)) {
        if ([string]::IsNullOrWhiteSpace($Line) -or $Line.Length -lt 4) { continue }
        $PathText = $Line.Substring(3).Trim()
        if ($PathText -match ' -> ') { $PathText = ($PathText -split ' -> ')[-1] }
        $PathText = $PathText.Trim('"').Replace('\', '/')
        if (-not (Test-GeneratedPath $PathText)) {
            [void]$Unexpected.Add("$($Line.Substring(0, 2)) $PathText")
        }
    }
    if ($Unexpected.Count -gt 0) {
        throw "Real source changes are present and will not be touched: $($Unexpected -join ', ')"
    }
}

function Acquire-ControllerLock {
    New-Item -ItemType Directory -Force -Path $LocalRoot | Out-Null

    if (Test-Path $LockPath) {
        $Existing = $null
        try { $Existing = Get-Content -Raw -Path $LockPath | ConvertFrom-Json } catch { }
        $ExistingPid = if ($Existing -and $Existing.ProcessId) { [int]$Existing.ProcessId } else { 0 }
        $Alive = $false
        if ($ExistingPid -gt 0) {
            $Alive = $null -ne (Get-Process -Id $ExistingPid -ErrorAction SilentlyContinue)
        }
        if ($Alive -and -not $ForceUnlock) {
            throw "Another Vish Cloudflare release controller is running as PID $ExistingPid. Use -ForceUnlock only after confirming it is not active."
        }
        Remove-Item -Force $LockPath
    }

    $Lock = [pscustomobject]@{
        ProcessId = $PID
        StartedAt = (Get-Date).ToString("o")
        Machine = $env:COMPUTERNAME
        User = $env:USERNAME
        Repository = $RepoRoot
    }
    $Json = $Lock | ConvertTo-Json -Depth 4
    $Stream = [IO.File]::Open($LockPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    try {
        $Bytes = [Text.Encoding]::UTF8.GetBytes($Json)
        $Stream.Write($Bytes, 0, $Bytes.Length)
    }
    finally {
        $Stream.Dispose()
    }
    $script:OwnsLock = $true
}

function Remove-ControllerLock {
    if ($script:OwnsLock -and (Test-Path $LockPath)) {
        Remove-Item -Force $LockPath -ErrorAction SilentlyContinue
    }
}

function Get-FreeDiskGB {
    $Root = [IO.Path]::GetPathRoot($RepoRoot)
    $Drive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$($Root.TrimEnd('\'))'"
    if (-not $Drive) { return 0 }
    return [Math]::Round(($Drive.FreeSpace / 1GB), 2)
}

function Test-Endpoint {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [int[]]$AllowedStatus = @(200)
    )
    $Response = Invoke-WebRequest -Uri $Uri -Method Get -MaximumRedirection 5 -SkipHttpErrorCheck -TimeoutSec 30 -Headers @{ "Cache-Control" = "no-cache" }
    if ($AllowedStatus -notcontains [int]$Response.StatusCode) {
        throw "$Uri returned HTTP $($Response.StatusCode)"
    }
    return $Response
}

function Convert-WranglerJson {
    param([Parameter(Mandatory = $true)][object[]]$Lines)
    $Text = ($Lines | ForEach-Object { [string]$_ }) -join "`n"
    $Start = $Text.IndexOf('[')
    $ObjectStart = $Text.IndexOf('{')
    if ($Start -lt 0 -or ($ObjectStart -ge 0 -and $ObjectStart -lt $Start)) { $Start = $ObjectStart }
    if ($Start -lt 0) { throw "Wrangler did not return JSON." }
    return ($Text.Substring($Start) | ConvertFrom-Json)
}

function Get-ProductionDeployments {
    $Lines = Invoke-Native { npx --yes "wrangler@$WranglerVersion" pages deployment list --project-name $ProjectName --environment production --json }
    $Payload = Convert-WranglerJson -Lines @($Lines)
    if ($Payload -is [array]) { return @($Payload) }
    if ($Payload.result) { return @($Payload.result) }
    if ($Payload.deployments) { return @($Payload.deployments) }
    return @($Payload)
}

function Get-DeploymentIdentity {
    param($Deployment)
    if (-not $Deployment) { return $null }
    foreach ($Name in @('id', 'deployment_id', 'deploymentId')) {
        $Property = $Deployment.PSObject.Properties[$Name]
        if ($Property -and -not [string]::IsNullOrWhiteSpace([string]$Property.Value)) {
            return [string]$Property.Value
        }
    }
    return $null
}

function Get-DeploymentUrl {
    param($Deployment)
    if (-not $Deployment) { return $null }
    foreach ($Name in @('url', 'deployment_url', 'deploymentUrl')) {
        $Property = $Deployment.PSObject.Properties[$Name]
        if ($Property -and -not [string]::IsNullOrWhiteSpace([string]$Property.Value)) {
            return [string]$Property.Value
        }
    }
    return $null
}

function Get-WranglerIdentity {
    $Lines = Invoke-Native { npx --yes "wrangler@$WranglerVersion" whoami --json }
    return Convert-WranglerJson -Lines @($Lines)
}

function Find-AccountId {
    param($Payload)
    if (-not $Payload) { return $null }
    foreach ($Name in @('account_id', 'accountId', 'id')) {
        $Property = $Payload.PSObject.Properties[$Name]
        if ($Property -and [string]$Property.Value -match '^[a-f0-9]{32}$') { return [string]$Property.Value }
    }
    foreach ($CollectionName in @('accounts', 'memberships')) {
        $Collection = $Payload.PSObject.Properties[$CollectionName]
        if ($Collection) {
            foreach ($Item in @($Collection.Value)) {
                $Found = Find-AccountId $Item
                if ($Found) { return $Found }
            }
        }
    }
    foreach ($Property in $Payload.PSObject.Properties) {
        if ($Property.Value -is [pscustomobject]) {
            $Found = Find-AccountId $Property.Value
            if ($Found) { return $Found }
        }
    }
    return $null
}

function Get-WranglerBearerToken {
    $Lines = Invoke-Native { npx --yes "wrangler@$WranglerVersion" auth token --json }
    $Payload = Convert-WranglerJson -Lines @($Lines)
    $Token = [string]$Payload.token
    if ([string]::IsNullOrWhiteSpace($Token)) { throw "Wrangler did not provide an authentication token." }
    return $Token
}

function Test-CriticalAvailability {
    $Result = [ordered]@{ Home = $false; Health = $false; HealthPayload = $null; Error = $null }
    try {
        $Home = Test-Endpoint -Uri "$($PagesUrl.TrimEnd('/'))/" -AllowedStatus @(200)
        $Result.Home = [string]$Home.Headers['Content-Type'] -match 'text/html'
        $HealthResponse = Test-Endpoint -Uri "$($PagesUrl.TrimEnd('/'))/api/health" -AllowedStatus @(200)
        $HealthPayload = $HealthResponse.Content | ConvertFrom-Json
        $Result.HealthPayload = $HealthPayload
        $Result.Health = $HealthPayload.ok -eq $true
    }
    catch {
        $Result.Error = $_.Exception.Message
    }
    return [pscustomobject]$Result
}

function Invoke-PagesRollback {
    param([Parameter(Mandatory = $true)][string]$DeploymentId)

    $Identity = Get-WranglerIdentity
    $AccountId = Find-AccountId $Identity
    if ([string]::IsNullOrWhiteSpace($AccountId)) { throw "Could not resolve the Cloudflare account ID." }
    $Token = Get-WranglerBearerToken
    $Uri = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName/deployments/$DeploymentId/rollback"
    $Response = Invoke-RestMethod -Uri $Uri -Method Post -Headers @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" } -Body '{}' -TimeoutSec 60
    if ($Response.success -ne $true) { throw "Cloudflare rollback API did not report success." }
    return $Response
}

function Read-CoreResult {
    $Path = Join-Path $LocalRoot "autopilot-last-run.json"
    if (-not (Test-Path $Path)) { return $null }
    try { return Get-Content -Raw -Path $Path | ConvertFrom-Json } catch { return $null }
}

function Write-FinalArtifacts {
    param(
        [Parameter(Mandatory = $true)][string]$Result,
        [string]$Reason
    )

    $Head = "unknown"
    $Branch = "unknown"
    try { $Head = (git rev-parse HEAD).Trim() } catch { }
    try { $Branch = (git branch --show-current).Trim() } catch { }
    $Payload = [pscustomobject]@{
        GeneratedAt = (Get-Date).ToString("o")
        Result = $Result
        Reason = $Reason
        Repository = $RepoRoot
        Branch = $Branch
        GitHead = $Head
        Target = $PagesUrl
        PreviousDeploymentId = Get-DeploymentIdentity $PreviousDeployment
        PreviousDeploymentUrl = Get-DeploymentUrl $PreviousDeployment
        CurrentDeploymentId = Get-DeploymentIdentity $CurrentDeployment
        CurrentDeploymentUrl = Get-DeploymentUrl $CurrentDeployment
        Rollback = $RollbackResult
        CoreResult = $CoreResult
        Steps = @($Steps)
        Transcript = $TranscriptPath
        Report = $ReportPath
    }
    $Payload | ConvertTo-Json -Depth 12 | Set-Content -Path $LastRunPath -Encoding utf8

    $Lines = [System.Collections.Generic.List[string]]::new()
    [void]$Lines.Add('# Vishvakarma.OS Cloudflare Release Controller')
    [void]$Lines.Add('')
    [void]$Lines.Add("- Generated: $($Payload.GeneratedAt)")
    [void]$Lines.Add("- Result: **$Result**")
    [void]$Lines.Add("- Reason: $Reason")
    [void]$Lines.Add("- Branch: $Branch")
    [void]$Lines.Add("- Git head: $Head")
    [void]$Lines.Add("- Target: $PagesUrl")
    [void]$Lines.Add("- Previous deployment: $($Payload.PreviousDeploymentId)")
    [void]$Lines.Add("- Current deployment: $($Payload.CurrentDeploymentId)")
    [void]$Lines.Add('')
    [void]$Lines.Add('| Step | Result | Seconds | Detail |')
    [void]$Lines.Add('| --- | --- | ---: | --- |')
    foreach ($Step in $Steps) {
        $Name = ([string]$Step.Name).Replace('|', '\|')
        $Detail = ([string]$Step.Detail).Replace('|', '\|')
        [void]$Lines.Add("| $Name | $($Step.Status) | $($Step.DurationSeconds) | $Detail |")
    }
    [void]$Lines.Add('')
    $Lines | Set-Content -Path $ReportPath -Encoding utf8
}

New-Item -ItemType Directory -Force -Path $LocalRoot | Out-Null
Set-Location $RepoRoot

try {
    Acquire-ControllerLock
    try {
        Start-Transcript -Path $TranscriptPath -Force | Out-Null
        $TranscriptStarted = $true
    }
    catch {
        Write-Warning "Could not start transcript: $($_.Exception.Message)"
    }

    Write-Host "VISHVAKARMA.OS CLOUDFLARE RELEASE CONTROLLER" -ForegroundColor Cyan
    Write-Host "Repository: $RepoRoot"
    Write-Host "Target: $PagesUrl"
    Write-State -Phase "Starting" -Detail "Release controller acquired the single-run lock."

    Invoke-ControllerStep "Verify PowerShell, Git, Node and npx" {
        if ($PSVersionTable.PSVersion.Major -lt 7) { throw "PowerShell 7 or newer is required." }
        [void](Get-CommandPathRequired 'git')
        [void](Get-CommandPathRequired 'node')
        [void](Get-CommandPathRequired 'npx')
        $NodeMajor = [int]((node --version).TrimStart('v').Split('.')[0])
        if ($NodeMajor -lt 20 -or $NodeMajor -ge 25) { throw "Node 20, 22 or 24 is required; found $(node --version)." }
    } | Out-Null

    Invoke-ControllerStep "Verify repository, branch safety and scripts" {
        $Origin = (git remote get-url origin).Trim()
        if ($Origin -notmatch [regex]::Escape($ExpectedRemotePattern)) { throw "Wrong repository remote: $Origin" }
        Assert-NoRealSourceChanges
        if (-not (Test-Path $AutopilotPath)) { throw "Missing autopilot: $AutopilotPath" }
        foreach ($Required in @('REPAIR_AND_RUN_CLOUDFLARE_FINAL_PROOFS.ps1', 'RUN_CLOUDFLARE_FINAL_PROOFS.ps1', 'scripts/deployment/verify-cloudflare-live.mjs')) {
            if (-not (Test-Path (Join-Path $RepoRoot $Required))) { throw "Missing required file: $Required" }
        }
        git check-ignore --quiet -- '.local/cloudflare-proof/secrets.dpapi.json'
        if ($LASTEXITCODE -ne 0) { throw "Encrypted local proof vault is not excluded by .gitignore." }
    } | Out-Null

    Invoke-ControllerStep "Verify free disk space" {
        $FreeGB = Get-FreeDiskGB
        if ($FreeGB -lt $MinimumFreeDiskGB) { throw "Only $FreeGB GB free; at least $MinimumFreeDiskGB GB is required." }
        Write-Host "Free disk: $FreeGB GB" -ForegroundColor Green
    } | Out-Null

    Invoke-ControllerStep "Verify public network endpoints" {
        [void](Test-Endpoint -Uri "$($PagesUrl.TrimEnd('/'))/" -AllowedStatus @(200))
        [void](Test-Endpoint -Uri 'https://jyocvwipthswfcmvqgqe.supabase.co/auth/v1/health' -AllowedStatus @(200, 401, 404))
        [void](Test-Endpoint -Uri 'https://api.stripe.com/v1/' -AllowedStatus @(200, 401, 404))
    } | Out-Null

    if ($PreflightOnly) {
        $FinalResult = "PREFLIGHT_PASS"
        $FinalReason = "All release-controller preflight checks passed."
        Write-FinalArtifacts -Result $FinalResult -Reason $FinalReason
        Write-Host "`nCLOUDFLARE RELEASE CONTROLLER: PREFLIGHT PASS" -ForegroundColor Green
        $global:LASTEXITCODE = 0
        return
    }

    $PreviousDeployment = Invoke-ControllerStep "Snapshot current Cloudflare production deployment" {
        $Deployments = @(Get-ProductionDeployments)
        if ($Deployments.Count -eq 0) { throw "No production deployment was returned by Cloudflare." }
        return $Deployments[0]
    }

    $CoreForward = @{
        PagesUrl = $PagesUrl
        ProjectName = $ProjectName
        MaxAttempts = $MaxAttempts
        RetryDelaySeconds = $RetryDelaySeconds
    }
    if ($ResetVault) { $CoreForward.ResetVault = $true }
    if ($ResetAuthSession) { $CoreForward.ResetAuthSession = $true }
    if ($NonInteractive) { $CoreForward.NonInteractive = $true }
    if ($SkipSupabaseConfigPush) { $CoreForward.SkipSupabaseConfigPush = $true }
    if ($SkipCloudflareDeploy) { $CoreForward.SkipCloudflareDeploy = $true }
    if ($SkipBrowserInstall) { $CoreForward.SkipBrowserInstall = $true }

    Invoke-ControllerStep "Run self-healing Cloudflare autopilot" {
        $global:LASTEXITCODE = 0
        & $AutopilotPath @CoreForward
        $Core = Read-CoreResult
        $script:CoreResult = $Core
        if (-not $Core) { throw "Autopilot did not produce its machine-readable result." }
        if ([string]$Core.Result -ne 'PASS') { throw "Autopilot result is $($Core.Result): $($Core.Reason)" }
    } | Out-Null

    $CurrentDeployment = Invoke-ControllerStep "Resolve resulting Cloudflare production deployment" {
        $Deployments = @(Get-ProductionDeployments)
        if ($Deployments.Count -eq 0) { throw "No production deployment was returned after autopilot." }
        return $Deployments[0]
    }

    Invoke-ControllerStep "Independently verify exact live Git commit" {
        $Head = (git rev-parse HEAD).Trim()
        $CacheBuster = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $Meta = Invoke-RestMethod -Uri "$($PagesUrl.TrimEnd('/'))/build-meta.json?controller=$CacheBuster" -Headers @{ "Cache-Control" = "no-cache" } -TimeoutSec 30
        if ([string]$Meta.gitSha -ne $Head) { throw "Live gitSha '$($Meta.gitSha)' does not equal local HEAD '$Head'." }
    } | Out-Null

    Invoke-ControllerStep "Independently verify critical availability" {
        $Availability = Test-CriticalAvailability
        if (-not $Availability.Home -or -not $Availability.Health) { throw "Critical availability failed: $($Availability.Error)" }
    } | Out-Null

    Invoke-ControllerStep "Run independent live route, API and PWA verifier" {
        $env:CLOUDFLARE_PAGES_URL = $PagesUrl
        $env:PRODUCTION_URL = $PagesUrl
        $env:EXPECTED_GIT_SHA = (git rev-parse HEAD).Trim()
        Invoke-Native { node '.\scripts\deployment\verify-cloudflare-live.mjs' }
    } | Out-Null

    $FinalResult = "READY_FOR_MERGE_AND_CUTOVER"
    $FinalReason = "Exact commit, health, deep routes, API security, PWA, Supabase callback/session, Stripe Checkout and signed webhook are proven."
    Write-FinalArtifacts -Result $FinalResult -Reason $FinalReason
    Write-Host "`nCLOUDFLARE RELEASE CONTROLLER: READY FOR MERGE AND CUTOVER" -ForegroundColor Green
    Write-Host "Readiness certificate: $ReportPath" -ForegroundColor Yellow
    $global:LASTEXITCODE = 0
}
catch {
    $FinalReason = $_.Exception.Message
    Write-Host "`nRELEASE CONTROLLER BLOCKED: $FinalReason" -ForegroundColor Red

    try {
        $CurrentDeployments = @(Get-ProductionDeployments)
        if ($CurrentDeployments.Count -gt 0) { $CurrentDeployment = $CurrentDeployments[0] }
    }
    catch { }

    $Critical = Test-CriticalAvailability
    $PreviousId = Get-DeploymentIdentity $PreviousDeployment
    $CurrentId = Get-DeploymentIdentity $CurrentDeployment
    $CanRollback = (
        -not $DisableAutoRollback -and
        -not $SkipCloudflareDeploy -and
        -not [string]::IsNullOrWhiteSpace($PreviousId) -and
        -not [string]::IsNullOrWhiteSpace($CurrentId) -and
        $PreviousId -ne $CurrentId -and
        (-not $Critical.Home -or -not $Critical.Health)
    )

    if ($CanRollback) {
        Write-Host "Critical regression detected after a new deployment. Rolling back to $PreviousId..." -ForegroundColor Yellow
        try {
            [void](Invoke-PagesRollback -DeploymentId $PreviousId)
            Start-Sleep -Seconds 10
            $Recovered = Test-CriticalAvailability
            if ($Recovered.Home -and $Recovered.Health) {
                $RollbackResult = [pscustomobject]@{ Result = 'PASS'; DeploymentId = $PreviousId; Detail = 'Previous production deployment restored and health recovered.' }
                $FinalResult = "ROLLED_BACK_SAFELY"
                $FinalReason = "The new deployment failed critical availability and was rolled back safely. Original blocker: $FinalReason"
                Write-Host "ROLLBACK PASS: previous production availability restored." -ForegroundColor Green
            }
            else {
                throw "Rollback API succeeded but critical availability did not recover."
            }
        }
        catch {
            $RollbackResult = [pscustomobject]@{ Result = 'FAIL'; DeploymentId = $PreviousId; Detail = $_.Exception.Message }
            $FinalReason = "$FinalReason | Automatic rollback failed: $($_.Exception.Message)"
        }
    }
    else {
        $FinalResult = "BLOCKED_NO_CRITICAL_REGRESSION"
        if ($PreviousId -and $CurrentId -and $PreviousId -ne $CurrentId -and $Critical.Home -and $Critical.Health) {
            $FinalReason = "$FinalReason | The live site remains healthy, so rollback was intentionally not performed."
        }
    }

    Write-FinalArtifacts -Result $FinalResult -Reason $FinalReason
    Write-Host "Release-controller status: $LastRunPath" -ForegroundColor Yellow
    Write-Host "Readiness report: $ReportPath" -ForegroundColor Yellow
    $global:LASTEXITCODE = 1
}
finally {
    if ($TranscriptStarted) {
        Stop-Transcript | Out-Null
    }
    Remove-ControllerLock
}
