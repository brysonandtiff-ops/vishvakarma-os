import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateApiProofTarget } from './api-proof-guard.mjs';

const SAMPLE_ID = '11111111-1111-4111-8111-111111111111';
const permitted = ['--api-only', '--allow-live-test-data-write'];

describe('S.I.R.E. API-only diagnostic safety', () => {
  it('rejects writes without explicit operator opt-in', () => {
    expect(validateApiProofTarget(['--api-only'], { SUPABASE_PROOF_USER_ID: SAMPLE_ID }).ok).toBe(false);
  });

  it('rejects missing dedicated test profile IDs', () => {
    expect(validateApiProofTarget(permitted, {}).ok).toBe(false);
    expect(validateApiProofTarget(permitted, { SUPABASE_PROOF_USER_ID: '' }).ok).toBe(false);
  });

  it('rejects malformed profile IDs rather than selecting any user', () => {
    expect(validateApiProofTarget(permitted, { SUPABASE_PROOF_USER_ID: 'first-profile' }).ok).toBe(false);
  });

  it('accepts only a dedicated test UUID with both opt-in flags', () => {
    expect(validateApiProofTarget(permitted, { SUPABASE_PROOF_USER_ID: SAMPLE_ID })).toEqual({
      ok: true,
      userId: SAMPLE_ID,
    });
    expect(validateApiProofTarget(['--allow-live-test-data-write'], { SUPABASE_PROOF_USER_ID: SAMPLE_ID }).ok).toBe(false);
  });

  it('requires finally cleanup and rejects the old arbitrary-first-profile selection', () => {
    const script = readFileSync('scripts/verify-supabase-save-reload.mjs', 'utf8');
    const apiFunction = script.split('async function runApiRoundtrip(env) {')[1].split('async function runInteractiveBrowser() {')[0];
    expect(apiFunction).toContain('finally {');
    expect(apiFunction).toContain('.delete()');
    expect(apiFunction).toContain(".eq('id', insertedId)");
    expect(apiFunction).not.toContain('.limit(1)');
    expect(apiFunction).toContain('return passed && cleanupVerified;');
  });
});
