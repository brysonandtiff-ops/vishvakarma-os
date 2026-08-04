import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Sanskrit auth gate design', () => {
  it('loads core, auth, and editor polish through intended style boundaries', () => {
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
    const rain = read('src/components/common/SanskritRainBackground.tsx');
    expect(authLayout).toContain("location.pathname === '/auth'");
    expect(rain).toContain('SANSKRIT_MATRIX_COLUMNS');
    expect(rain).toContain('prefers-reduced-motion');
    expect(authPage).toContain('vish-login-page');
    expect(authPage).toContain('AuthLoginHero');
    expect(hero).toContain('vish-login-page__deity-visual');
  });

  it('exposes the complete Supabase email account lifecycle only', () => {
    const authPage = read('src/pages/AuthPage.tsx');
    const card = read('src/components/auth/AuthLoginCard.tsx');
    const reset = read('src/pages/ResetPasswordPage.tsx');
    const lifecycle = read('src/backend/supabase/supabaseAccountLifecycle.ts');

    expect(authPage).toContain('handleSupabaseSignIn');
    expect(authPage).toContain('handleCreateAccount');
    expect(authPage).toContain('handleForgotPassword');
    expect(authPage).not.toContain('signInWithGoogle');
    expect(authPage).not.toContain('requestAccessLink');
    expect(card).toContain('Supabase Auth • Connected');
    expect(card).toContain('supabase-email-input');
    expect(card).toContain('supabase-password-input');
    expect(card).toContain('supabase-create-account-button');
    expect(card).toContain('supabase-forgot-password-button');
    expect(card).not.toContain('google-sso-button');
    expect(card).not.toContain('email-magic-link-button');
    expect(reset).toContain('Supabase Recovery • Connected');
    expect(reset).toContain('recovery-update-password-button');
    expect(lifecycle).toContain('client.auth.signUp');
    expect(lifecycle).toContain('client.auth.resetPasswordForEmail');
    expect(lifecycle).toContain('client.auth.updateUser');
  });

  it('keeps trust pillars and founders branding', () => {
    const authPage = read('src/pages/AuthPage.tsx');
    const card = read('src/components/auth/AuthLoginCard.tsx');
    const loginStyles = read('src/styles/vish-login-page.css');
    const marketingFooter = read('src/components/marketing/MarketingFooter.tsx');
    expect(card).toContain('OFFICIAL_LOGO_SRC');
    expect(card).toContain('Vishvakarma<span>.OS</span>');
    expect(authPage).toContain('FoundersAcknowledgment');
    expect(authPage).toContain('auth-trust-pillars');
    expect(loginStyles).toContain('.vish-login-page__auth-card');
    expect(loginStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(marketingFooter).toContain('FoundersAcknowledgment');
  });

  it('keeps Supabase session hydration and password authentication stable', () => {
    const authContext = read('src/contexts/AuthContext.tsx');
    const provider = read('src/contexts/SupabaseAuthProvider.tsx');
    const gateway = read('src/backend/supabase/supabaseAuthGateway.ts');
    expect(authContext).toContain('SupabaseAuthProvider');
    expect(provider).toContain('hydrateSupabaseAuthSession');
    expect(provider).toContain('markFreshSignIn');
    expect(provider).toContain('signInWithPasswordSupabase');
    expect(gateway).toContain('client.auth.getSession');
    expect(gateway).toContain('client.auth.signInWithPassword');
  });

  it('keeps the premium workspace shell treatment after login', () => {
    const appLayout = read('src/components/layouts/AppLayout.tsx');
    const styles = read('src/styles/vish-workspace-shell.css');
    expect(appLayout).toContain("@/styles/vish-workspace-shell.css");
    expect(appLayout).toContain('vish-workspace-shell');
    expect(appLayout).toContain('vish-workspace-sidebar');
    expect(appLayout).toContain('FoundersAcknowledgment');
    expect(styles).toContain('.vish-shell-account');
  });
});
