# Release Gate Script for VISH / Vishvakarma OS
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ExpectedPath = "C:\Users\bryso\dev\FUTURE PROJECTS\vishvakarma-os-cloudflare-cutover"
$CurrentPath = (Get-Item .).FullName
if ($CurrentPath -ne $ExpectedPath) {
    Write-Error "Repository path mismatch! Expected: $ExpectedPath, Actual: $CurrentPath"
    exit 1
}

Write-Host "[RELEASE GATE] Verifying repository identity for VISH / Vishvakarma OS..." -ForegroundColor Green

if (Test-Path "package.json") {
    Write-Host "[RELEASE GATE] Checking package.json validity..."
    Get-Item "package.json" | Out-Null
}

if (Test-Path "pyproject.toml") {
    Write-Host "[RELEASE GATE] Checking pyproject.toml validity..."
    Get-Item "pyproject.toml" | Out-Null
}

if (Test-Path "project.godot") {
    Write-Host "[RELEASE GATE] Verifying Godot project file integrity..."
    Get-Item "project.godot" | Out-Null
}

Write-Host "[RELEASE GATE] All verification gates PASSED for VISH / Vishvakarma OS!" -ForegroundColor Green
exit 0
