// @vitest-environment node
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { beforeEach, describe, expect, it } from 'vitest';
import { attestCloudflareDeployment } from './cloudflare-deployment-proof.mjs';
import {
  isVerifiedBrowserSaveLoadProof,
  REQUIRED_BROWSER_SAVE_LOAD_CHECKS,
} from './save-load-proof-verdict.mjs';

const requestedUrl = 'https://f64788e9.vishvakarma-os.pages.dev';
const expectedCommitSha = 'a'.repeat(40);
let deploymentProof;
function verify(receipt, overrides = {}) {
  return isVerifiedBrowserSaveLoadProof(receipt, { requestedUrl, expectedCommitSha, deploymentProof, ...overrides });
}

beforeEach(async () => {
  const deploymentId = 'f64788e9-fccd-4d4a-a28a-cb84f88f6e12';
  deploymentProof = await attestCloudflareDeployment({
    requestedUrl, expectedCommitSha,
    env: {
      CLOUDFLARE_ACCOUNT_ID: '023e105f4ecef8ad9ca31a8372d0c353',
      CLOUDFLARE_DEPLOYMENT_ID: deploymentId,
      CLOUDFLARE_API_TOKEN: 'synthetic-unit-test-token',
    },
    fetchFn: async () => new Response(JSON.stringify({
      success: true, errors: [], messages: [], result: {
        id: deploymentId, short_id: 'f64788e9', project_name: 'vishvakarma-os',
        url: requestedUrl, environment: 'preview', is_skipped: false,
        latest_stage: { name: 'deploy', status: 'success' }, source: { type: 'github' },
        deployment_trigger: { type: 'github:push', metadata: { commit_hash: expectedCommitSha, commit_dirty: false } },
      },
    })),
  });
});

function browserReceipt() {
  return {
    mode: 'interactive',
    result: 'PASS',
    commitSha: 'a'.repeat(40),
    deploymentUrl: requestedUrl,
    deploymentProof: { ...deploymentProof },
    qualifies_as_release_browser_acceptance: true,
    release_authorized: false,
    checks: REQUIRED_BROWSER_SAVE_LOAD_CHECKS.map((name) => ({ name, pass: true })),
  };
}

describe('S.I.R.E. browser save/load evidence guard', () => {
  it.each([
    'scripts/verify-supabase-save-reload.mjs',
    'scripts/verify-all.js',
    'scripts/lib/cloudflare-deployment-proof.mjs',
    'scripts/lib/save-load-proof-verdict.mjs',
  ])('parses the actual production evidence script: %s', (script) => {
    const result = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
  });

  it('rejects locally stamped source claims without authenticated deployment attestation', () => {
    expect(isVerifiedBrowserSaveLoadProof(browserReceipt(), {
      requestedUrl: 'https://vishvakarma-os.pages.dev',
      expectedCommitSha: 'a'.repeat(40),
    })).toBe(false);
  });

  it('rejects an arbitrary HTTPS host even with every required browser check', () => {
    expect(verify({
      ...browserReceipt(), deploymentUrl: 'https://example.org',
    })).toBe(false);
  });

  it('accepts only a complete explicit signed-in browser receipt', () => {
    expect(verify(browserReceipt())).toBe(true);
  });

  it('rejects API-only proof even with an otherwise green check set', () => {
    expect(verify({ ...browserReceipt(), mode: 'api-roundtrip' })).toBe(false);
  });

  it('rejects a legacy receipt with no explicit browser-acceptance marker', () => {
    const receipt = browserReceipt();
    delete receipt.qualifies_as_release_browser_acceptance;
    expect(verify(receipt)).toBe(false);
  });

  it('rejects a missing import check and any failed check', () => {
    const incomplete = browserReceipt();
    incomplete.checks.pop();
    expect(verify(incomplete)).toBe(false);

    const failed = browserReceipt();
    failed.checks[2].pass = false;
    expect(verify(failed)).toBe(false);
  });

  it('rejects an import receipt that never established an empty target', () => {
    const unchangedEditor = browserReceipt();
    unchangedEditor.checks = unchangedEditor.checks.filter(
      (check) => check.name !== 'browser: import target is empty',
    );

    expect(verify(unchangedEditor)).toBe(false);
  });

  it('rejects invalid or non-HTTPS source provenance', () => {
    expect(verify({ ...browserReceipt(), commitSha: 'unknown' })).toBe(false);
    expect(verify({ ...browserReceipt(), deploymentUrl: 'http://example.org' })).toBe(false);
  });

  it('rejects a receipt from another requested origin, stale source or substituted deployment', () => {
    expect(verify(browserReceipt(), { requestedUrl: 'https://11111111.vishvakarma-os.pages.dev' })).toBe(false);
    expect(verify(browserReceipt(), { expectedCommitSha: 'b'.repeat(40) })).toBe(false);
    const substituted = browserReceipt();
    substituted.deploymentProof.deploymentId = 'f64788e9-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    expect(verify(substituted)).toBe(false);
  });

  it('rejects stored/raw attestation objects without fresh authenticated verification', () => {
    expect(verify(browserReceipt(), { deploymentProof: { ...deploymentProof } })).toBe(false);
    expect(verify(browserReceipt(), { deploymentProof: undefined })).toBe(false);
  });

  it('wires the guard into the real release script and Cloudflare build', () => {
    const releaseGate = readFileSync('scripts/verify-all.js', 'utf8');
    const recorder = readFileSync('scripts/verify-supabase-save-reload.mjs', 'utf8');
    const build = readFileSync('scripts/cloudflare-build.mjs', 'utf8');
    expect(releaseGate).toContain('isVerifiedBrowserSaveLoadProof(receipt,');
    expect(releaseGate).toContain('attestCloudflareDeployment(');
    expect(releaseGate).toContain('requestedUrl: process.env.PRODUCTION_URL');
    expect(releaseGate).toContain('checkBrowserSaveLoadEvidenceGate()');
    expect(releaseGate).not.toContain("'Result: `PARTIAL`']));");
    expect(recorder).toContain('if (!browserProofVerified)');
    expect(build).toContain('scripts/lib/save-load-proof-verdict.test.mjs');
  });
});
