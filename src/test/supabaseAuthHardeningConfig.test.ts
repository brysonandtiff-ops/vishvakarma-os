import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (...parts: string[]) =>
  readFileSync(path.join(process.cwd(), ...parts), 'utf8');

describe('Supabase Auth hardening configuration', () => {
  it('enables confirmed email accounts and disables retired providers', () => {
    const config = read('supabase', 'config.toml');
    expect(config).toContain('[auth.email]\nenable_signup = true');
    expect(config).toContain('enable_confirmations = true');
    expect(config).toContain('reset-password');
    expect(config).toContain('[auth.sms]\nenable_signup = false');
    expect(config).toContain('[auth.mfa.totp]\nenroll_enabled = true\nverify_enabled = true');
    expect(config).toContain('[auth.external.google]\nenabled = false');
  });

  it('keeps hosted signup, confirmation, recovery, and password security enabled', () => {
    const script = read('scripts', 'setup-supabase-auth-hardening.mjs');
    for (const phrase of [
      'external_email_enabled: true',
      'disable_signup: false',
      'mailer_autoconfirm: false',
      'external_google_enabled: false',
      'password_hibp_enabled: true',
      'mailer_subjects_confirmation',
      'mailer_subjects_recovery',
      'mailer_notifications_password_changed_enabled: true',
      "managementRequest('PATCH', desiredConfig)",
    ]) {
      expect(script).toContain(phrase);
    }
  });

  it('enforces AAL2 only after a verified factor is enrolled', () => {
    const migration = read(
      'supabase',
      'migrations',
      '20260712012000_enforce_opt_in_totp_mfa.sql',
    );
    expect(migration).toContain('from auth.mfa_factors factor');
    expect(migration).toContain("factor.status = 'verified'");
    expect(migration).toContain("auth.jwt() ->> 'aal'");
    expect(migration).toContain("= 'aal2'");
  });
});
