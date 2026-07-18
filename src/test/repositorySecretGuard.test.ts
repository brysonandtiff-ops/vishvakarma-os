import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const guard = readFileSync(
  join(process.cwd(), 'scripts/security/check-repository-secrets.mjs'),
  'utf8',
);

describe('repository secret guard', () => {
  it('fails closed on tracked env files and credential classes', () => {
    expect(guard).toContain("['ls-files', '-z']");
    expect(guard).toContain('tracked local environment file');
    expect(guard).toContain('private key material');
    expect(guard).toContain('Stripe webhook secret');
    expect(guard).toContain('service-account JSON');
    expect(guard).toContain('non-placeholder ${key}');
    expect(guard).toContain('process.exit(1)');
  });

  it('restricts tracked env files to explicit fixtures and templates', () => {
    expect(guard).toContain("'.env.e2e'");
    expect(guard).toContain("'.env.e2e-local'");
    expect(guard).toContain("'.env.vercel.production'");
    expect(guard).toContain("'config/e2e-env/.env'");
    expect(guard).toContain("new Set(['.env.example'])");
    expect(guard).toContain('/^\\.env\\..+\\.example$/');
  });
});
