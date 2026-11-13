import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  SECURITY_INCIDENT_URL,
  validateReleaseUrl,
  requireClosedSecurityIncident,
  requireReleaseSecurityPreflight,
} from './release-security-preflight.mjs';

const canonical = 'https://vishvakarma-os.app';
const preview = 'https://abc12345.vishvakarma-os.pages.dev';
const closedIssue = {
  number: 153,
  state: 'closed',
  closed_at: '2026-11-04T00:00:00Z',
};

describe('S.I.R.E. Cloudflare release security preflight', () => {
  it('requires a real target URL and accepts only approved Cloudflare HTTPS origins', () => {
    expect(() => validateReleaseUrl('')).toThrow(/required/);
    expect(validateReleaseUrl(canonical)).toBe(canonical);
    expect(validateReleaseUrl(preview+'/')).toBe(preview);
    expect(validateReleaseUrl('https://www.vishvakarma-os.app')).toBe('https://www.vishvakarma-os.app');
  });

  it('rejects http, lookalike hosts, secrets in URLs and non-root targets', () => {
    for (const value of [
      'http://vishvakarma-os.app',
      'https://vishvakarma-os.app.attacker.invalid',
      'https://evilvishvakarma-os.pages.dev',
      'https://user:pass@vishvakarma-os.app',
      'https://vishvakarma-os.app/?token=value',
      'https://vishvakarma-os.app/editor',
    ]) {
      expect(() => validateReleaseUrl(value)).toThrow();
    }
  });

  it('fails closed for open, missing, malformed or PR-masquerading incident records', () => {
    expect(() => requireClosedSecurityIncident({ ...closedIssue, state: 'open', closed_at: null })).toThrow();
    expect(() => requireClosedSecurityIncident(null)).toThrow();
    expect(() => requireClosedSecurityIncident({ ...closedIssue, number: 154 })).toThrow();
    expect(() => requireClosedSecurityIncident({ ...closedIssue, pull_request: {} })).toThrow();
  });

  it('rejects an API failure, auth failure or invalid JSON', async () => {
    const unavailable = vi.fn().mockResolvedValue({ status: 403, json: vi.fn() });
    await expect(requireReleaseSecurityPreflight(preview, unavailable)).rejects.toThrow(/unavailable/);
    const invalid = vi.fn().mockResolvedValue({ status: 200, json: async () => { throw Error('parse'); } });
    await expect(requireReleaseSecurityPreflight(preview, invalid)).rejects.toThrow(/invalid/);
    const offline = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(requireReleaseSecurityPreflight(preview, offline)).rejects.toThrow(/blocked/);
  });

  it('does not allow an open issue even when GitHub responds 200', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ ...closedIssue, state: 'open', closed_at: null }),
    });
    await expect(requireReleaseSecurityPreflight(preview, fetchFn)).rejects.toThrow(/#153/);
    expect(fetchFn).toHaveBeenCalledWith(SECURITY_INCIDENT_URL, expect.objectContaining({
      method: 'GET',
      redirect: 'error',
    }));
  });

  it('allows preflight only after issue closure, without implying release certification', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => closedIssue,
    });
    expect(await requireReleaseSecurityPreflight(preview, fetchFn)).toBe(preview);
  });

  it('enforces preflight before running expensive gates and requires strict checks', () => {
    const cert = readFileSync('scripts/deployment/certify-cloudflare-release.mjs','utf8');
    expect(cert).toContain('await requireReleaseSecurityPreflight(liveUrl)');
    expect(cert).toContain("'release:gates:strict'");
    expect(cert).toContain("'launch:evidence:strict'");
    expect(cert.indexOf('await requireReleaseSecurityPreflight(liveUrl)')).toBeLessThan(
      cert.indexOf("run('node', ['scripts/security/check-repository-secrets.mjs'])"),
    );
    expect(cert).not.toContain('release certification PASSED');
  });
});
