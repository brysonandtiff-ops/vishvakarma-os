import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readRepoFile(...parts: string[]) {
  return readFileSync(path.join(repoRoot, ...parts), 'utf8');
}

describe('Supabase-only authentication surface', () => {
  it('shows Supabase sign-in, account creation, recovery, and proof badge', () => {
    const page = readRepoFile('src', 'pages', 'AuthPage.tsx');
    const card = readRepoFile('src', 'components', 'auth', 'AuthLoginCard.tsx');
    const reset = readRepoFile('src', 'pages', 'ResetPasswordPage.tsx');
    const lifecycle = readRepoFile(
      'src', 'backend', 'supabase', 'supabaseAccountLifecycle.ts',
    );

    expect(page).toContain('signInWithPassword');
    expect(page).toContain('handleSupabaseSignIn');
    expect(page).toContain('handleCreateAccount');
    expect(page).toContain('handleForgotPassword');
    expect(page).not.toContain('signInWithGoogle');
    expect(page).not.toContain('requestAccessLink');

    expect(card).toContain('Supabase Auth • Connected');
    expect(card).toContain('data-testid="supabase-auth-badge"');
    expect(card).toContain('data-testid="supabase-email-input"');
    expect(card).toContain('data-testid="supabase-password-input"');
    expect(card).toContain('data-testid="supabase-password-button"');
    expect(card).toContain('data-testid="auth-mode-create-account"');
    expect(card).toContain('data-testid="supabase-confirm-password-input"');
    expect(card).toContain('data-testid="supabase-create-account-button"');
    expect(card).toContain('data-testid="supabase-forgot-password-button"');
    expect(card).not.toContain('Continue with Google');
    expect(card).not.toContain('google-sso-button');
    expect(card).not.toContain('email-magic-link-button');

    expect(reset).toContain('data-testid="recovery-email-input"');
    expect(reset).toContain('data-testid="recovery-send-email-button"');
    expect(reset).toContain('data-testid="recovery-new-password-input"');
    expect(reset).toContain('data-testid="recovery-update-password-button"');
    expect(lifecycle).toContain('client.auth.signUp');
    expect(lifecycle).toContain('client.auth.resetPasswordForEmail');
    expect(lifecycle).toContain('client.auth.updateUser');
  });

  it('uses the same Supabase password path in Cloudflare release proof automation', () => {
    const bootstrap = readRepoFile(
      'scripts', 'deployment', 'bootstrap-cloudflare-auth-session.mjs',
    );
    const checkoutProof = readRepoFile(
      'scripts', 'deployment', 'verify-cloudflare-interactive-auth-checkout.mjs',
    );
    const releaseRunner = readRepoFile('RUN_VISH_CLOUDFLARE.ps1');
    const iscRunner = readRepoFile('RUN_VISH_ISC_ALL_IN_ONE.ps1');

    for (const source of [bootstrap, checkoutProof, releaseRunner, iscRunner]) {
      expect(source).toContain('Supabase email/password');
      expect(source).not.toContain('Continue with Google');
      expect(source).not.toContain('Google sign-in');
      expect(source).not.toContain('Google OAuth');
    }

    expect(bootstrap).toContain("getByTestId('supabase-email-input')");
    expect(checkoutProof).toContain("getByTestId('supabase-email-input')");
    expect(checkoutProof).toContain("authMethod: 'supabase-email-password'");
    expect(iscRunner).toContain('Authentication = "supabase-email-password"');
  });
});
