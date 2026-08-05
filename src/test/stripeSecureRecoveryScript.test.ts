import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (...parts: string[]) =>
  readFileSync(path.join(process.cwd(), ...parts), 'utf8');

describe('secure Stripe recovery launcher', () => {
  it('stores Stripe credentials only in a Windows-encrypted ignored vault', () => {
    const launcher = read('RUN_VISH_STRIPE_SECURE_RECOVERY.ps1');
    const gitignore = read('.gitignore');

    expect(launcher).toContain('Export-Clixml');
    expect(launcher).toContain('Import-Clixml');
    expect(launcher).toContain('.local\\cloudflare-auth');
    expect(launcher).toContain('git check-ignore --quiet');
    expect(launcher).not.toContain('Write-Host $StripeKey');
    expect(launcher).not.toContain('--api-key');
    expect(gitignore).toContain('.local/cloudflare-auth/');
    expect(gitignore).toContain('.local/tools/');
  });

  it('automatically installs and verifies the official Stripe CLI', () => {
    const launcher = read('RUN_VISH_STRIPE_SECURE_RECOVERY.ps1');

    expect(launcher).toContain('https://api.github.com/repos/stripe/stripe-cli/releases/latest');
    expect(launcher).toContain('stripe-windows-checksums.txt');
    expect(launcher).toContain('Get-FileHash');
    expect(launcher).toContain('Stripe CLI SHA-256 verification failed');
    expect(launcher).toContain('Expand-Archive');
    expect(launcher).toContain('stripe.exe');
  });

  it('automatically authorizes Stripe CLI and encrypts the generated key', () => {
    const launcher = read('RUN_VISH_STRIPE_SECURE_RECOVERY.ps1');

    expect(launcher).toContain('Invoke-AutomaticStripeLogin');
    expect(launcher).toContain('$StartInfo.Arguments = "login"');
    expect(launcher).toContain('$Process.StandardInput.WriteLine()');
    expect(launcher).toContain('Read-StripeCliKey');
    expect(launcher).toContain('Test-StripeKeyAccess');
    expect(launcher).toContain('Save-StripeKeyVault');
    expect(launcher).toContain('validated and encrypted for unattended reuse');
  });

  it('self-syncs, runs focused tests, builds the exact commit, and invokes the finalizer', () => {
    const launcher = read('RUN_VISH_STRIPE_SECURE_RECOVERY.ps1');

    expect(launcher).toContain('SELF-SYNC STRIPE RECOVERY BRANCH');
    expect(launcher).toContain('git merge --ff-only');
    expect(launcher).toContain('stripeCheckoutFinalizer.test.ts');
    expect(launcher).toContain('create-checkout-session.test.ts');
    expect(launcher).toContain('dist\\build-meta.json');
    expect(launcher).toContain('vish-stripe-checkout-finalizer.mjs');
    expect(launcher).toContain('VITE_STRIPE_BILLING_ENABLED = "true"');
    expect(launcher).toContain('VISH FULLY AUTOMATED STRIPE CHECKOUT RECOVERY: PASS');
  });

  it('defaults to test mode and keeps manual key entry opt-in only', () => {
    const launcher = read('RUN_VISH_STRIPE_SECURE_RECOVERY.ps1');

    expect(launcher).toContain("'^(sk|rk)_test_");
    expect(launcher).toContain("'^(sk|rk)_live_");
    expect(launcher).toContain('[switch]$AllowManualKeyFallback');
    expect(launcher).toContain('if ($AllowManualKeyFallback)');
    expect(launcher).toContain('Read-Host "Stripe server key" -AsSecureString');
  });
});
