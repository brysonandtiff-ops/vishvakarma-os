import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = readFileSync(
  join(process.cwd(), 'RUN_VISH_ZERO_TOUCH_CUTOVER.ps1'),
  'utf8',
);

describe('Vishvakarma.OS zero-touch cutover controller', () => {
  it('runs the complete fail-closed release chain', () => {
    for (const phrase of [
      'RUN_VISH_STRIPE_AUTOPILOT.ps1',
      'RUN_VISH_ISC_ALL_IN_ONE.ps1',
      'READY_FOR_MERGE_AND_CUTOVER',
      'git merge --no-ff',
      'git push origin $MainBranch',
      'production_branch = $MainBranch',
      'pages deploy dist',
      'verify-cloudflare-live.mjs',
      'verify-cloudflare-interactive-auth-checkout.mjs',
      'vish-stripe-checkout-finalizer.mjs',
      'Attach and activate the custom Cloudflare domain',
      'Retire Vercel production traffic',
      'VISHVAKARMA.OS ZERO-TOUCH CUTOVER: PASS',
    ]) {
      expect(script).toContain(phrase);
    }
  });

  it('protects source files and preserves rollback evidence', () => {
    for (const phrase of [
      'Genuine repository changes remain and were not touched',
      'zero-touch-generated-archive',
      'release-controller-last-run.json',
      'Snapshot current Cloudflare production state',
      'AUTOMATIC CLOUDFLARE CUTOVER ROLLBACK',
      '/rollback',
      'No password, API key, access token, or webhook secret was printed or committed.',
    ]) {
      expect(script).toContain(phrase);
    }
    expect(script).not.toContain('Write-Host $StripeKey');
    expect(script).not.toContain('Write-Host $CloudflareToken');
  });

  it('requires exact main and custom-domain authentication/payment proof', () => {
    expect(script).toContain('EXPECTED_GIT_SHA');
    expect(script).toContain('Run-LiveVerifier -Origin $PagesUrl -ExpectedHead $MainHead');
    expect(script).toContain('Run-LiveVerifier -Origin $CustomOrigin -ExpectedHead $MainHead');
    expect(script).toContain('Run-AuthenticatedCheckoutProof -Origin $PagesUrl');
    expect(script).toContain('Run-AuthenticatedCheckoutProof -Origin $CustomOrigin');
    expect(script).toContain('Run-StripeFinalizerForCurrentHead -Origin $PagesUrl');
    expect(script).toContain('Custom-domain health stopped reporting ok:true.');
  });
});
