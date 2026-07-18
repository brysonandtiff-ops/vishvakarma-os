import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('email magic-link fallback', () => {
  it('is wired into the auth page and card', () => {
    const page = read('src/pages/AuthPage.tsx');
    const card = read('src/components/auth/AuthLoginCard.tsx');
    expect(page).toContain('requestAccessLink');
    expect(page).toContain('handleEmailLinkSignIn');
    expect(card).toContain('email-magic-link-input');
    expect(card).toContain('email-magic-link-button');
  });

  it('uses existing-account-only passwordless auth', () => {
    const gateway = read('src/backend/supabase/supabaseAuthGateway.ts');
    expect(gateway).toContain("SUPPORTED_AUTH_PROVIDERS = ['google', 'email']");
    expect(gateway).toContain('shouldCreateUser: false');
    expect(gateway).toContain('signInWithOtp');
    expect(gateway).toContain('verifyOtp');
  });

  it('loads accessible dedicated styling', () => {
    expect(read('src/main.tsx')).toContain('vish-auth-email-fallback.css');
    const styles = read('src/styles/vish-auth-email-fallback.css');
    expect(styles).toContain('.vish-login-page__email-input');
    expect(styles).toContain('min-height: 48px');
  });
});
