import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  isVerifiedBrowserSaveLoadProof,
  REQUIRED_BROWSER_SAVE_LOAD_CHECKS,
} from './save-load-proof-verdict.mjs';

function browserReceipt() {
  return {
    mode: 'interactive',
    result: 'PASS',
    commitSha: 'a'.repeat(40),
    deploymentUrl: 'https://vishvakarma-os.pages.dev',
    qualifies_as_release_browser_acceptance: true,
    release_authorized: false,
    checks: REQUIRED_BROWSER_SAVE_LOAD_CHECKS.map((name) => ({ name, pass: true })),
  };
}

describe('S.I.R.E. browser save/load evidence guard', () => {
  it('accepts only a complete explicit signed-in browser receipt', () => {
    expect(isVerifiedBrowserSaveLoadProof(browserReceipt())).toBe(true);
  });

  it('rejects API-only proof even with an otherwise green check set', () => {
    expect(isVerifiedBrowserSaveLoadProof({ ...browserReceipt(), mode: 'api-roundtrip' })).toBe(false);
  });

  it('rejects a legacy receipt with no explicit browser-acceptance marker', () => {
    const receipt = browserReceipt();
    delete receipt.qualifies_as_release_browser_acceptance;
    expect(isVerifiedBrowserSaveLoadProof(receipt)).toBe(false);
  });

  it('rejects a missing import check and any failed check', () => {
    const incomplete = browserReceipt();
    incomplete.checks.pop();
    expect(isVerifiedBrowserSaveLoadProof(incomplete)).toBe(false);

    const failed = browserReceipt();
    failed.checks[2].pass = false;
    expect(isVerifiedBrowserSaveLoadProof(failed)).toBe(false);
  });

  it('rejects invalid or non-HTTPS source provenance', () => {
    expect(isVerifiedBrowserSaveLoadProof({ ...browserReceipt(), commitSha: 'unknown' })).toBe(false);
    expect(isVerifiedBrowserSaveLoadProof({ ...browserReceipt(), deploymentUrl: 'http://example.org' })).toBe(false);
  });

  it('wires the guard into the real release script and Cloudflare build', () => {
    const releaseGate = readFileSync('scripts/verify-all.js', 'utf8');
    const recorder = readFileSync('scripts/verify-supabase-save-reload.mjs', 'utf8');
    const build = readFileSync('scripts/cloudflare-build.mjs', 'utf8');
    expect(releaseGate).toContain('isVerifiedBrowserSaveLoadProof(receipt)');
    expect(releaseGate).toContain('checkBrowserSaveLoadEvidenceGate()');
    expect(releaseGate).not.toContain("'Result: `PARTIAL`']));");
    expect(recorder).toContain('if (!browserProofVerified)');
    expect(build).toContain('scripts/lib/save-load-proof-verdict.test.mjs');
  });
});
