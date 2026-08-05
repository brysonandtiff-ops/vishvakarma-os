import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (...parts: string[]) =>
  readFileSync(path.join(process.cwd(), ...parts), 'utf8');

describe('secure Stripe recovery launcher', () => {
  it('stores the Stripe server key only in a Windows-encrypted ignored vault', () => {
    const launcher = read('RUN_VISH_STRIPE_SECURE_RECOVERY.ps1');
    const gitignore = read('.gitignore');

    expect(launcher).toContain('Read-Host "Stripe server key" -AsSecureString');
    expect(launcher).toContain('Export-Clixml');
    expect(launcher).toContain('Import-Clixml');
    expect(launcher).toContain('.local\\cloudflare-auth');
    expect(launcher).toContain('git check-ignore --quiet');
    expect(launcher).not.toContain('Write-Host $StripeKey');
    expect(launcher).not.toContain('--api-key');
    expect(gitignore).toContain('.local/cloudflare-auth/');
  });

  it('defaults to test mode and invokes the focused checkout finalizer', () => {
    const launcher = read('RUN_VISH_STRIPE_SECURE_RECOVERY.ps1');

    expect(launcher).toContain("'^(sk|rk)_test_");
    expect(launcher).toContain("'^(sk|rk)_live_");
    expect(launcher).toContain('vish-stripe-checkout-finalizer.mjs');
    expect(launcher).toContain('VITE_STRIPE_BILLING_ENABLED = "true"');
    expect(launcher).toContain('VISH SECURE STRIPE CHECKOUT RECOVERY: PASS');
  });
});
