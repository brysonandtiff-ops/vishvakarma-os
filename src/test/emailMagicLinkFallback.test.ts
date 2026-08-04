import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Supabase email account surface', () => {
  it('wires sign-in, create-account, and recovery controls', () => {
    const page = read('src/pages/AuthPage.tsx');
    const card = read('src/components/auth/AuthLoginCard.tsx');
    const reset = read('src/pages/ResetPasswordPage.tsx');

    expect(page).toContain('signInWithPassword');
    expect(page).toContain('handleSupabaseSignIn');
    expect(page).toContain('handleCreateAccount');
    expect(page).toContain('handleForgotPassword');
    expect(card).toContain('data-testid="supabase-email-input"');
    expect(card).toContain('data-testid="supabase-password-input"');
    expect(card).toContain('supabase-password-button');
    expect(card).toContain('supabase-create-account-button');
    expect(card).toContain('data-testid="supabase-forgot-password-button"');
    expect(card).toContain('Sign in with Supabase');
    expect(card).toContain('Create Supabase account');
    expect(reset).toContain('data-testid="recovery-send-email-button"');
    expect(reset).toContain('data-testid="recovery-update-password-button"');
  });

  it('does not expose retired Google or email magic-link controls', () => {
    const page = read('src/pages/AuthPage.tsx');
    const card = read('src/components/auth/AuthLoginCard.tsx');
    expect(page).not.toContain('requestAccessLink');
    expect(page).not.toContain('handleEmailLinkSignIn');
    expect(page).not.toContain('signInWithGoogle');
    expect(card).not.toContain('email-magic-link-input');
    expect(card).not.toContain('email-magic-link-button');
    expect(card).not.toContain('google-sso-button');
    expect(card).not.toContain('Continue with Google');
  });

  it('keeps password fields accessible and touch friendly', () => {
    const card = read('src/components/auth/AuthLoginCard.tsx');
    const styles = read('src/styles/vish-auth-email-fallback.css');
    expect(card).toContain('autoComplete="email"');
    expect(card).toContain("'current-password'");
    expect(card).toContain('className="vish-login-page__primary touch-target"');
    expect(styles).toContain('.vish-login-page__email-input');
    expect(styles).toContain('min-height: 48px');
  });
});
