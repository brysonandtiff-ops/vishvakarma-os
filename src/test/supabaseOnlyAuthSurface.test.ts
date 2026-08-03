import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readRepoFile(...parts: string[]) {
  return readFileSync(path.join(repoRoot, ...parts), 'utf8');
}

describe('Supabase-only authentication surface', () => {
  it('shows only the approved Supabase email/password login and proof badge', () => {
    const page = readRepoFile('src', 'pages', 'AuthPage.tsx');
    const card = readRepoFile('src', 'components', 'auth', 'AuthLoginCard.tsx');

    expect(page).toContain('signInWithPassword');
    expect(page).toContain('handleSupabaseSignIn');
    expect(page).not.toContain('signInWithGoogle');
    expect(page).not.toContain('requestAccessLink');
    expect(page).not.toContain('handleGoogleSignIn');
    expect(page).not.toContain('handleEmailLinkSignIn');

    expect(card).toContain('Supabase Auth • Connected');
    expect(card).toContain('data-testid="supabase-auth-badge"');
    expect(card).toContain('data-testid="supabase-email-input"');
    expect(card).toContain('data-testid="supabase-password-input"');
    expect(card).toContain('data-testid="supabase-password-button"');
    expect(card).toContain('Sign in with Supabase');
    expect(card).not.toContain('Continue with Google');
    expect(card).not.toContain('google-sso-button');
    expect(card).not.toContain('email-magic-link-button');
    expect(card).not.toContain('Email me a sign-in link');
  });

  it('uses the same Supabase password path in Cloudflare release proof automation', () => {
    const bootstrap = readRepoFile(
      'scripts',
      'deployment',
      'bootstrap-cloudflare-auth-session.mjs',
    );
    const checkoutProof = readRepoFile(
      'scripts',
      'deployment',
      'verify-cloudflare-interactive-auth-checkout.mjs',
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
