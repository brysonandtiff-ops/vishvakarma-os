import { describe, expect, it } from 'vitest';
import {
  REQUIRED_CLOUD_BROWSER_CHECKS,
  validateCloudSaveEvidence,
} from './save-reload-evidence.mjs';

const SHA = '0123456789abcdef0123456789abcdef01234567';
const proven = () => ({
  mode: 'interactive',
  result: 'PASS',
  certified: true,
  commitSha: SHA,
  checks: REQUIRED_CLOUD_BROWSER_CHECKS.map((name) => ({ name, pass: true })),
});

describe('LAW 105 exact-source cloud save evidence boundary', () => {
  it('certifies all five real authenticated-browser checks on the exact SHA only', () => {
    expect(validateCloudSaveEvidence(proven(), SHA)).toEqual([]);
  });

  it('never accepts a service-role API roundtrip as authenticated user proof', () => {
    const receipt = { ...proven(), mode: 'api-roundtrip', operator: 'service role' };
    expect(validateCloudSaveEvidence(receipt, SHA).join(' ')).toContain('interactive-browser');
  });

  it('rejects older evidence when the application SHA changes', () => {
    expect(validateCloudSaveEvidence(proven(), 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb').join(' ')).toContain('current exact');
  });

  it('refuses success when any browser action was skipped or failed', () => {
    const receipt = proven();
    receipt.checks[2].pass = false;
    expect(validateCloudSaveEvidence(receipt, SHA).join(' ')).toContain('cloud save toast');
  });

  it('requires an explicitly certified receipt, not just a PASS label', () => {
    const receipt = { ...proven(), certified: false };
    expect(validateCloudSaveEvidence(receipt, SHA).join(' ')).toContain('not been explicitly certified');
  });

  it('rejects duplicated, missing or malformed browser checks', () => {
    const receipt = proven();
    receipt.checks.push({ name: REQUIRED_CLOUD_BROWSER_CHECKS[0], pass: true });
    expect(validateCloudSaveEvidence(receipt, SHA).join(' ')).toContain('not proven exactly once');
    expect(validateCloudSaveEvidence({ ...receipt, checks: null }, SHA).join(' ')).toContain('must be an array');
  });

  it('rejects zero-detail and nonmatching receipts', () => {
    expect(validateCloudSaveEvidence(null, SHA).length).toBeGreaterThan(0);
    expect(validateCloudSaveEvidence(proven(), 'unknown').join(' ')).toContain('40-character');
  });
});
