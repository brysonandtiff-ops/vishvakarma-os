import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Sanskrit auth gate design', () => {
  it('loads auth gate stylesheet through app startup', () => {
    const main = read('src/main.tsx');
    expect(main).toContain('./styles/vish-sacred-layers.css');
    expect(main).toContain('./styles/vish-auth-gate.css');
  });

  it('keeps the canvas Sanskrit rain and mandala layers on the auth page', () => {
    const authLayout = read('src/components/layouts/AuthLayout.tsx');
    const authPage = read('src/pages/AuthPage.tsx');
    const rainBackground = read('src/components/common/SanskritRainBackground.tsx');

    expect(authLayout).toContain('vish-auth-gate');
    expect(authLayout).toContain('SanskritRainBackground');
    expect(authLayout).toContain("preset={isBoot ? 'boot' : 'auth'}");
    expect(rainBackground).toContain('SANSKRIT_MATRIX_COLUMNS');
    expect(rainBackground).toContain('ॐ श्री विश्वकर्मणे नमः');
    expect(rainBackground).toContain('मन्त्र यन्त्र वास्तु रचना');
    expect(rainBackground).toContain('BOOT_MANTRAS');
    expect(rainBackground).toContain('prefers-reduced-motion');
    expect(rainBackground).toContain('MantraStream');
    expect(rainBackground).toContain('EmberParticle');
    expect(rainBackground).toContain('visibilitychange');
    expect(rainBackground).toContain('fadeTrail');
    expect(authLayout).toContain('vish-auth-aurora');
    expect(authLayout).toContain('vish-mandala-aura');
    expect(authLayout).toContain('vish-mandala-ring-outer');
    expect(authPage).toContain('vish-auth-card-mockup');
  });

  it('shows only the verified auth winner from capabilities manifest', () => {
    const authPage = read('src/pages/AuthPage.tsx');
    const googleButton = read('src/components/auth/AuthGoogleButton.tsx');
    const capabilities = read('src/backend/authCapabilities.ts');
    const manifest = read('public/auth-capabilities.json');

    expect(authPage).toContain('useAuthCapabilities');
    expect(authPage).toContain('showEmailSignIn');
    expect(authPage).toContain('showGoogleSignIn');
    expect(authPage).toContain('AuthGoogleButton');
    expect(authPage).toContain('variant="gold"');
    expect(googleButton).toContain('Continue with Google');
    expect(authPage).toContain('Send secure access link');
    expect(authPage).not.toContain('Continue with Apple');
    expect(authPage).not.toContain('signInWithApple');
    expect(capabilities).toContain('fetchAuthCapabilitiesManifest');
    expect(manifest).toContain('"winner"');
    expect(manifest).toMatch(/redirect sign-in|Supabase Google OAuth|Supabase Google provider|Google OAuth is the production|Supabase OAuth|supabase\.co\/auth|Config-only pass/);
    expect(manifest).not.toContain('popup sign-in');
    expect(authPage).not.toContain('type="password"');
  });

  it('keeps trust pillars and workspace branding on the auth page', () => {
    const authPage = read('src/pages/AuthPage.tsx');
    const authHeader = read('src/components/auth/AuthSignInHeader.tsx');
    const trustPillar = read('src/components/auth/AuthTrustPillar.tsx');

    expect(authPage).toContain('AuthSignInHeader');
    expect(authHeader).toContain('OFFICIAL_LOGO_SRC');
    expect(authHeader).toContain('vish-auth-logo-hero');
    expect(authHeader).toContain('vish-auth-logo-wrap');
    expect(authHeader).toContain('vish-auth-logo-img');
    expect(authHeader).toContain('vish-auth-wordmark-divider');
    expect(authHeader).toContain('VISHVAKARMA.OS');
    expect(authHeader).toContain('vish-devanagari-hero');
    expect(authHeader).toContain('iPad-First Architecture Studio');
    expect(authPage).toContain('FoundersAcknowledgment');
    expect(authPage).toContain('variant="auth"');
    expect(read('src/brand/founders.ts')).toContain('TYRASIC CREATIONS');
    expect(authPage).toContain('AuthTrustPillar');
    expect(authPage).toContain('auth-trust-pillars');
    expect(authPage).toContain('auth-trust-pillar-gates');
    expect(authPage).toContain('auth-trust-pillar-records');
    expect(authPage).toContain('Release evidence pack');
    expect(authPage).toContain('WORLD_RECORD_HONESTY_DISCLAIMER');
    expect(authPage).toContain('destination="/releases"');
    expect(authPage).toContain('destination="/world-records"');
    expect(authPage).toContain('items-stretch');
    expect(authPage).toContain('Sign in to open Releases and inspect gate snapshots.');
    expect(authPage).toContain('Sign in to view the Self-Verified Candidate registry at /world-records.');
    expect(authHeader).toContain('vish-gold-pill');
    expect(authHeader).toContain('vish-gold-pill--live');
    expect(authHeader).toContain('auth-supabase-badge');
    expect(authHeader).toContain('vish-auth-supabase-pill');
    expect(authHeader).toContain('Supabase Auth');
    expect(authPage).toContain('AuthStatusBanner');
    expect(authPage).toContain('auth-password-reset-notice');
    expect(authPage).toContain('variant="gates"');
    expect(authPage).toContain('getSignInHelperLine');
    expect(trustPillar).toContain('vish-auth-feature-card');
    expect(trustPillar).toContain('vish-auth-feature-card--');
    expect(trustPillar).toContain('vish-auth-feature-card__footer');
    expect(trustPillar).toContain('vish-auth-feature-card__metric');
    expect(trustPillar).toContain('aria-label');
    expect(trustPillar).toContain('ChevronRight');
    expect(trustPillar).toContain('vish-gold-pill');
  });

  it('handles OAuth redirect completion in AuthContext', () => {
    const authContext = read('src/contexts/AuthContext.tsx');
    const supabaseProvider = read('src/contexts/SupabaseAuthProvider.tsx');

    expect(authContext).toContain('SupabaseAuthProvider');
    expect(supabaseProvider).toContain('resolveSupabaseOAuthRedirectSession');
    expect(supabaseProvider).toContain('markFreshSignIn');
    expect(supabaseProvider).toContain('POST_AUTH_DESTINATION');
    expect(supabaseProvider).toContain('signInWithGoogle');
  });

  it('keeps Supabase OAuth callback handling separate from email magic links', () => {
    const supabaseAuthGateway = read('src/backend/supabase/supabaseAuthGateway.ts');
    const supabaseAuthProvider = read('src/contexts/SupabaseAuthProvider.tsx');

    expect(supabaseAuthGateway).toContain('isSupabaseOAuthCallback');
    expect(supabaseAuthGateway).toContain('isSupabaseEmailLinkCallback');
    expect(supabaseAuthProvider).toContain('isSupabaseOAuthCallback');
    expect(supabaseAuthProvider).toContain('resolveSupabaseOAuthRedirectSession');
    expect(supabaseAuthProvider).toContain('shouldHandleOAuth');
    expect(supabaseAuthProvider).toContain('shouldHandleEmailLink');
    expect(supabaseAuthProvider).toContain('INITIAL_SESSION');
  });

  it('surfaces founders acknowledgment on marketing footer', () => {
    const marketingFooter = read('src/components/marketing/MarketingFooter.tsx');
    const marketingStyles = read('src/styles/vish-marketing.css');

    expect(marketingFooter).toContain('FoundersAcknowledgment');
    expect(marketingFooter).toContain('variant="footer"');
    expect(marketingStyles).toContain('.vish-marketing-founders');
  });

  it('keeps the premium workspace shell treatment after login', () => {
    const appLayout = read('src/components/layouts/AppLayout.tsx');
    const styles = read('src/styles/vish-workspace-shell.css');

    expect(appLayout).toContain("@/styles/vish-workspace-shell.css");
    expect(appLayout).toContain('vish-workspace-shell');
    expect(appLayout).toContain('vish-workspace-sidebar');
    expect(appLayout).toContain('vish-shell-brand');
    expect(appLayout).toContain('vish-shell-logo');
    expect(appLayout).toContain('vish-shell-nav-active');
    expect(appLayout).toContain('FoundersAcknowledgment');
    expect(appLayout).toContain('accountInitials');
    expect(appLayout).toContain('variant="workstation"');
    expect(appLayout).toContain('{plan}');
    expect(appLayout).toContain('Architecture workstation');
    expect(styles).toContain('.vish-workspace-sidebar');
    expect(styles).toContain('.vish-shell-nav-active');
    expect(styles).toContain('.vish-shell-account');
  });

  it('keeps animation CSS premium, responsive, and reduced-motion safe', () => {
    const styles = read('src/styles/vish-auth-gate.css');
    const layers = read('src/styles/vish-sacred-layers.css');
    const authLayout = read('src/components/layouts/AuthLayout.tsx');
    const routeGuard = read('src/components/common/RouteGuard.tsx');

    expect(styles).toContain('.vish-sanskrit-rain-canvas');
    expect(layers).toContain('.vish-mandala-ring');
    expect(layers).toContain('@keyframes vish-mandala-drift');
    expect(styles).toContain('.vish-auth-access-card');
    expect(styles).toContain('.vish-auth-feature-card:hover');
    expect(styles).toContain('.vish-auth-feature-card--gates');
    expect(styles).toContain('.vish-auth-status');
    expect(styles).toContain('.vish-auth-feature-card__title');
    expect(styles).toContain('.vish-auth-feature-card__footer');
    expect(styles).toContain('.vish-auth-feature-card__metric');
    expect(styles).toContain('.vish-auth-feature-card:focus-visible');
    expect(styles).toContain('.vish-auth-founders-line');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toContain('animation: none !important');
    expect(routeGuard).toContain('AuthLayout');
    expect(routeGuard).toContain('variant="boot"');
    expect(authLayout).toContain('vish-boot-aurora');
    expect(routeGuard).toContain('vish-fade-rise');
    expect(styles).toContain('.vish-auth-logo-hero');
    expect(styles).toContain('.vish-auth-logo-wrap');
    expect(styles).toContain('.vish-auth-google-button');
    expect(styles).toContain('@keyframes vish-auth-logo-breathe');
    expect(layers).toContain('.vish-auth-aurora');
    expect(layers).toContain('@keyframes vish-auth-aurora-drift');
  });
});
