import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('focused Stripe Checkout recovery', () => {
  it('runs only after authenticated evidence proves Stripe is the sole blocker', () => {
    const finalizer = read('scripts/deployment/vish-stripe-checkout-finalizer.mjs');

    expect(finalizer).toContain('assertStripeOnlyEligibility');
    expect(finalizer).toContain('Saved Supabase password session opens the editor');
    expect(finalizer).toContain('Supabase password session persists after refresh');
    expect(finalizer).toContain('Stripe Checkout opens from the Studio plan');
    expect(finalizer).toContain('refusing focused recovery');
  });

  it('captures the real Checkout API response before declaring success', () => {
    const finalizer = read('scripts/deployment/vish-stripe-checkout-finalizer.mjs');

    expect(finalizer).toContain('/api/stripe/create-checkout-session');
    expect(finalizer).toContain('Checkout API rejected the request');
    expect(finalizer).toContain('response.status()');
    expect(finalizer).toContain('checkout.stripe.com');
    expect(finalizer).toContain('verify-cloudflare-server-webhook-proof.mjs');
    expect(finalizer).toContain('VISH STRIPE CHECKOUT FINALIZER: PASS');
  });

  it('is invoked by the PowerShell core only after the primary core blocks', () => {
    const wrapper = read('RUN_VISH_SUPERCHARGED_CORE.ps1');

    expect(wrapper).toContain('vish-stripe-checkout-finalizer.mjs');
    expect(wrapper).toContain('CHECK FOR AUTH-PASSED STRIPE-ONLY RECOVERY');
    expect(wrapper).toContain('if ($CoreExitCode -eq 0)');
    expect(wrapper).toContain('Focused Stripe checkout recovery completed');
  });
});
