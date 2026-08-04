import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Sanskrit auth gate design', () => {
  it('loads core, auth, and editor polish through their intended style boundaries', () => {
    const main = read('src/main.tsx');
    const authStyles = read('src/styles/entries/auth.ts');
    const editorStyles = read('src/styles/entries/editor.ts');

    expect(main).toContain('./styles/vish-sacred-layers.css');
    expect(main).toContain('./styles/vish-device-unity.css');
    expect(main).toContain('./styles/vish-auth-email-fallback.css');
    expect(authStyles).toContain("import '../vish-auth-gate.css'");
    expect(authStyles).toContain("import '../vish-login-page.css'");
    expect(editorStyles).toContain("import '../vish-ipad-desktop-polish.css'");
    expect(editorStyles).toContain("import '../vish-editor-3d-polish.css'");
  });

  it('keeps the sacred auth page shell and hero artwork', () => {
    const authLayout = read('src/components/layouts/AuthLayout.tsx');
    const authPage = read('src/pages/AuthPage.tsx');
    const hero = read('src/components/auth/AuthLoginHero.tsx');
    const rainBackground = read('src/components/common/SanskritRainBackground.tsx');

    expect(authLayout).toContain("location.pathname === '/auth'");
    expect(rainBackground).toContain('SANSKRIT_MATRIX_COLUMNS');
    expect(rainBackground).toContain('prefers-reduced-motion');
    expect(rainBackground).toContain('MantraStream');
    expect(rainBackground).toContain('EmberParticle');
    expect(authPage).toContain('vish-login-page');
    expect(authPage).toContain('AuthLoginHero');
    expect(hero).toContain('vish-login-page__deity-visual');
  });

  it('exposes only approved Supabase email and password authentication', () => {
    const authPage = read('src/pages/AuthPage.tsx');
    const loginCard = read('src/components/auth/AuthLoginCard.tsx');
    const authGateway = read('src/backend/supabase/supabaseAuthGateway.ts');

    expect(authPage).toContain('signInWithPassword');
    expect(authPage).toContain('handleSupabaseSignIn');
    expect(authPage).not.toContain('signInWithGoogle');
    expect(authPage).not.toContain('requestAccessLink');
    expect(authPage).not.toContain('handleEmailLinkSignIn');
    expect(authPage).not.toContain('signInWithApple');
    expect(authPage).not.toContain('onLocalWorkspace');

    expect(loginCard).toContain('data-testid="supabase-auth-badge"');
    expect(loginCard).toContain('Supabase Auth • Connected');
    expect(loginCard).toContain('data-testid="supabase-email-input"');
    expect(loginCard).toContain('data-testid="supabase-password-input"');
    expect(loginCard).toContain('data-testid="supabase-password-button"');
    expect(loginCard).toContain('Sign in with Supabase');
    expect(loginCard).toContain('type="email"');
    expect(loginCard).toContain('type="password"');
    expect(loginCard).not.toContain('google-sso-button');
    expect(loginCard).not.toContain('Continue with Google SSO');
    expect(loginCard).not.toContain('email-magic-link-input');
    expect(loginCard).not.toContain('email-magic-link-button');
    expect(loginCard).not.toContain('Email me a sign-in link');
    expect(loginCard).not.toContain('Enter local workspace');

    expect(authGateway).toContain('client.auth.signInWithPassword');
    expect(authGateway).toContain('client.auth.resetPasswordForEmail');
    expect(authGateway).not.toContain('Password sign-in is disabled');
  });

  it('keeps trust pillars and founders branding on auth and marketing surfaces', () => {
    const authPage = read('src/pages/AuthPage.tsx');
    const loginCard = read('src/components/auth/AuthLoginCard.tsx');
    const loginStyles = read('src/styles/vish-login-page.css');
    const marketingFooter = read('src/components/marketing/MarketingFooter.tsx');
    const marketingStyles = read('src/styles/vish-marketing.css');

    expect(loginCard).toContain('OFFICIAL_LOGO_SRC');
    expect(loginCard).toContain('Vishvakarma<span>.OS</span>');
    expect(authPage).toContain('FoundersAcknowledgment');
    expect(authPage).toContain('variant="auth"');
    expect(authPage).toContain('auth-trust-pillars');
    expect(authPage).toContain('auth-trust-pillar-gates');
    expect(authPage).toContain('auth-trust-pillar-records');
    expect(authPage).toContain('Sign in to inspect release gate snapshots.');
    expect(authPage).toContain('Sign in to view the Self-Verified Candidate registry.');
    expect(loginStyles).toContain('.vish-login-page__auth-card');
    expect(loginStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(marketingFooter).toContain('FoundersAcknowledgment');
    expect(marketingFooter).toContain('variant="footer"');
    expect(marketingStyles).toContain('.vish-marketing-founders');
  });

  it('keeps Supabase session hydration and password authentication stable', () => {
    const authContext = read('src/contexts/AuthContext.tsx');
    const supabaseProvider = read('src/contexts/SupabaseAuthProvider.tsx');
    const supabaseAuthGateway = read('src/backend/supabase/supabaseAuthGateway.ts');

    expect(authContext).toContain('SupabaseAuthProvider');
    expect(supabaseProvider).toContain('hydrateSupabaseAuthSession');
    expect(supabaseProvider).toContain('markFreshSignIn');
    expect(supabaseProvider).toContain('POST_AUTH_DESTINATION');
    expect(supabaseProvider).toContain('signInWithPasswordSupabase');
    expect(supabaseProvider).toContain('signInWithPassword');
    expect(supabaseAuthGateway).toContain('client.auth.getSession');
    expect(supabaseAuthGateway).toContain('client.auth.signInWithPassword');
  });

  it('keeps the premium workspace shell treatment after login', () => {
    const appLayout = read('src/components/layouts/AppLayout.tsx');
    const styles = read('src/styles/vish-workspace-shell.css');

    expect(appLayout).toContain("@/styles/vish-workspace-shell.css");
    expect(appLayout).toContain('vish-workspace-shell');
    expect(appLayout).toContain('vish-workspace-sidebar');
    expect(appLayout).toContain('vish-shell-brand');
    expect(appLayout).toContain('vish-shell-nav-active');
    expect(appLayout).toContain('FoundersAcknowledgment');
    expect(appLayout).toContain('variant="workstation"');
    expect(styles).toContain('.vish-workspace-sidebar');
    expect(styles).toContain('.vish-shell-nav-active');
    expect(styles).toContain('.vish-shell-account');
  });
});
