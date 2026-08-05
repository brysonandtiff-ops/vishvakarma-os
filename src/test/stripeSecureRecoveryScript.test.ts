import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (...parts: string[]) =>
  readFileSync(path.join(process.cwd(), ...parts), 'utf8');

describe('secure Stripe recovery launcher', () => {
  it('stores server keys only in a Windows-encrypted ignored vault', () => {
    const launcher = read('RUN_VISH_STRIPE_SECURE_RECOVERY.ps1');
    const gitignore = read('.gitignore');

    expect(launcher).toContain('Export-Clixml');
    expect(launcher).toContain('Import-Clixml');
    expect(launcher).toContain('.local\\cloudflare-auth');
    expect(launcher).toContain('git check-ignore --quiet');
    expect(launcher).not.toContain('Write-Host $StripeKey');
    expect(launcher).not.toContain('--api-key');
    expect(gitignore).toContain('.local/cloudflare-auth/');
  });

  it('automatically installs, verifies, authorizes, and reuses Stripe CLI credentials', () => {
    const launcher = read('RUN_VISH_STRIPE_SECURE_RECOVERY.ps1');

    expect(launcher).toContain('api.github.com/repos/stripe/stripe-cli/releases/latest');
    expect(launcher).toContain('stripe-windows-checksums.txt');
    expect(launcher).toContain('Get-FileHash');
    expect(launcher).toContain('SHA-256 verification failed');
    expect(launcher).toContain('Invoke-AutomaticStripeLogin');
    expect(launcher).toContain('Read-StripeCliKey');
    expect(launcher).toContain('Save-StripeKeyVault');
    expect(launcher).toContain('VISH FULLY AUTOMATED STRIPE CHECKOUT RECOVERY: PASS');
  });

  it('archives generated evidence and blocks genuine edits before self-sync', () => {
    const autopilot = read('RUN_VISH_STRIPE_AUTOPILOT.ps1');

    expect(autopilot).toContain('Normalize-GeneratedEvidenceSafely');
    expect(autopilot).toContain('.local\\cloudflare-proof\\generated-evidence-archive');
    expect(autopilot).toContain('docs/release/evidence');
    expect(autopilot).toContain('git restore --staged --worktree -- @GeneratedPaths');
    expect(autopilot).toContain('git clean -fd -- @GeneratedPaths');
    expect(autopilot).toContain('Genuine repository changes remain and were not touched');
    expect(autopilot).toContain('RUN_VISH_STRIPE_SECURE_RECOVERY.ps1');
    expect(autopilot).toContain('SkipGitSync = $true');
    expect(autopilot).toContain('VISH ONE-COMMAND STRIPE AUTOPILOT: PASS');
  });
});
