# PHIRO Forge Self-Hosted Runner

This repository can use a trusted Windows self-hosted GitHub Actions runner when GitHub-hosted runner allocation is unavailable.

## Security model

- Do not expose this runner to arbitrary public fork pull requests.
- Registration tokens are temporary secrets and must never be committed.
- The runner label is `phiro-forge`.
- The intended runner identity is `PHIRO-FORGE-WIN-X64`.
- Keep the Windows host patched and dedicated to trusted repository automation.

## One-time Windows bootstrap

Open an elevated PowerShell session from a trusted Windows machine, generate a fresh temporary registration token from repository Settings > Actions > Runners, then run:

```powershell
$token = Read-Host 'Paste fresh GitHub runner registration token'
.\tools\phiro\Install-PHIROForgeRunner.ps1 -RegistrationToken $token -InstallAsService
Remove-Variable token
```

The script downloads GitHub Actions Runner v2.336.0 to `C:\actions-runner`, verifies the pinned SHA-256 checksum, registers the runner with labels `phiro-forge,windows,x64`, and optionally installs it as a Windows service.

## Verification

Once GitHub shows the runner as Online, dispatch `PHIRO Forge Smoke` or update this branch. The smoke job must emit:

```text
PHIRO_FORGE_RUNNER_OK=true
```

Only after this smoke passes should production certification jobs be migrated from `ubuntu-latest` to the PHIRO Forge runner.
