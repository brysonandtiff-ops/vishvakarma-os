import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const cutover = readFileSync(
  join(process.cwd(), 'RUN_VISH_ZERO_TOUCH_CUTOVER.ps1'),
  'utf8',
);
const everything = readFileSync(
  join(process.cwd(), 'RUN_VISH_EVERYTHING.ps1'),
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
      'VISHVAKARMA.OS ZERO-TOUCH CUTOVER: PASS',
    ]) {
      expect(cutover).toContain(phrase);
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
      expect(cutover).toContain(phrase);
    }
    expect(cutover).not.toContain('Write-Host $StripeKey');
    expect(cutover).not.toContain('Write-Host $CloudflareToken');
  });

  it('requires exact main and custom-domain authentication/payment proof', () => {
    expect(cutover).toContain('EXPECTED_GIT_SHA');
    expect(cutover).toContain('Run-LiveVerifier -Origin $PagesUrl -ExpectedHead $MainHead');
    expect(cutover).toContain('Run-LiveVerifier -Origin $CustomOrigin -ExpectedHead $MainHead');
    expect(cutover).toContain('Run-AuthenticatedCheckoutProof -Origin $PagesUrl');
    expect(cutover).toContain('Run-AuthenticatedCheckoutProof -Origin $CustomOrigin');
    expect(cutover).toContain('Run-StripeFinalizerForCurrentHead -Origin $PagesUrl');
    expect(cutover).toContain('Custom-domain health stopped reporting ok:true.');
  });

  it('retires Vercel only after Cloudflare passes and never rolls Cloudflare back for cleanup failure', () => {
    expect(everything).toContain('RUN_VISH_ZERO_TOUCH_CUTOVER.ps1');
    expect(everything).toContain('KeepVercelRollback = $true');
    expect(everything).toContain('RETIRE VERCEL AFTER VERIFIED CLOUDFLARE CUTOVER');
    expect(everything).toContain('alias rm $CustomDomain --yes');
    expect(everything).toContain('project rm $VercelProjectName --yes');
    expect(everything).toContain('PASS_WITH_VERCEL_WARNING');
    expect(everything).toContain('Cloudflare is live and verified, but Vercel cleanup needs attention');
    expect(everything).not.toContain('STRIPE_SECRET_KEY =');
    expect(everything).not.toContain('CLOUDFLARE_API_TOKEN =');
  });
});
