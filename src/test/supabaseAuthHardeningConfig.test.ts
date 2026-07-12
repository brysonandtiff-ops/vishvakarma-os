import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepoFile(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), 'utf8');
}

describe('Supabase Auth hardening configuration', () => {
  it('keeps local Auth Google-only with TOTP enabled', () => {
    const config = readRepoFile('supabase', 'config.toml');

    expect(config).toContain('[auth.email]\nenable_signup = false');
    expect(config).toContain('[auth.sms]\nenable_signup = false');
    expect(config).toContain('[auth.mfa.totp]\nenroll_enabled = true\nverify_enabled = true');
    expect(config).toContain('[auth.mfa.phone]\nenroll_enabled = false\nverify_enabled = false');
    expect(config).toContain('[auth.external.google]\nenabled = true');
  });

  it('provides a verifiable hosted Auth Management API hardening script', () => {
    const script = readRepoFile('scripts', 'setup-supabase-auth-hardening.mjs');

    expect(script).toContain('password_hibp_enabled: true');
    expect(script).toContain('mfa_totp_enroll_enabled: true');
    expect(script).toContain('mfa_totp_verify_enabled: true');
    expect(script).toContain('mfa_phone_enroll_enabled: false');
    expect(script).toContain('mfa_phone_verify_enabled: false');
    expect(script).toContain("managementRequest('PATCH', desiredConfig)");
    expect(script).toContain("managementRequest('GET')");
    expect(script).not.toContain('console.log(accessToken');
  });

  it('enforces AAL2 in RLS only after a user has enrolled a verified factor', () => {
    const migration = readRepoFile(
      'supabase',
      'migrations',
      '20260712012000_enforce_opt_in_totp_mfa.sql',
    );

    expect(migration).toContain('from auth.mfa_factors factor');
    expect(migration).toContain("factor.status = 'verified'");
    expect(migration).toContain("auth.jwt() ->> 'aal'");
    expect(migration).toContain("= 'aal2'");
    expect(migration).toContain('as restrictive for all to authenticated');
  });
});
