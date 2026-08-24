import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepositoryFile(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('production authentication certification', () => {
  it('rejects Google provider error pages instead of treating redirects as success', () => {
    const verifier = readRepositoryFile('scripts/verify-production-auth-flow.mjs');

    expect(verifier).toContain('invalid_client');
    expect(verifier).toContain('deleted_client');
    expect(verifier).toContain('/signin/oauth/error');
    expect(verifier).toContain('Google OAuth client accepted');
    expect(verifier).toContain('usable Google sign-in surface');
    expect(verifier).not.toContain('firefox-no-error');
    expect(verifier).not.toContain("name === 'firefox' && postAlert === null");
  });

  it('runs the repository credential guard before Cloudflare quality gates', () => {
    const build = readRepositoryFile('scripts/deployment/certify-cloudflare-release.mjs');
    const guard = readRepositoryFile('scripts/security/check-repository-secrets.mjs');

    expect(build).toContain('check-repository-secrets.mjs');
    expect(build.indexOf('check-repository-secrets.mjs')).toBeLessThan(
      build.indexOf('verify-cloudflare-config.mjs'),
    );

    expect(guard).toContain("git', ['ls-files', '-z']");
    expect(guard).toContain('tracked local environment file');
    expect(guard).toContain('private key material');
    expect(guard).toContain('Stripe secret key');
  });
});
