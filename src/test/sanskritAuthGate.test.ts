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
    expect(main).toContain('./styles/vish-auth-gate.css');
  });

  it('keeps the canvas Sanskrit rain and mandala layers on the auth page', () => {
    const authPage = read('src/pages/AuthPage.tsx');
    const rainBackground = read('src/components/common/SanskritRainBackground.tsx');

    expect(authPage).toContain('vish-auth-gate');
    expect(authPage).toContain('SanskritRainBackground');
    expect(authPage).toContain('preset="auth"');
    expect(rainBackground).toContain('SANSKRIT_MATRIX_COLUMNS');
    expect(rainBackground).toContain('ॐ श्री विश्वकर्मणे नमः');
    expect(rainBackground).toContain('मन्त्र यन्त्र वास्तु रचना');
    expect(rainBackground).toContain('BOOT_MANTRAS');
    expect(rainBackground).toContain('prefers-reduced-motion');
    expect(rainBackground).toContain('MantraStream');
    expect(rainBackground).toContain('EmberParticle');
    expect(rainBackground).toContain('visibilitychange');
    expect(rainBackground).toContain('fadeTrail');
    expect(authPage).toContain('vish-auth-aurora');
    expect(authPage).toContain('vish-mandala-aura');
    expect(authPage).toContain('vish-mandala-ring-outer');
    expect(authPage).toContain('vish-auth-card-mockup');
  });

  it('shows only the verified auth winner from capabilities manifest', () => {
    const authPage = read('src/pages/AuthPage.tsx');
    const capabilities = read('src/backend/authCapabilities.ts');
    const manifest = read('public/auth-capabilities.json');

    expect(authPage).toContain('useAuthCapabilities');
    expect(authPage).toContain('showEmailSignIn');
    expect(authPage).toContain('showGoogleSignIn');
    expect(authPage).toContain('Continue with Google');
    expect(authPage).toContain('vish-gold-button--with-icon');
    expect(authPage).toContain('Send secure access link');
    expect(authPage).not.toContain('Continue with Apple');
    expect(authPage).not.toContain('signInWithApple');
    expect(capabilities).toContain('fetchAuthCapabilitiesManifest');
    expect(manifest).toContain('"winner"');
    expect(manifest).toContain('redirect sign-in on production');
    expect(manifest).not.toContain('popup sign-in');
    expect(authPage).not.toContain('type="password"');
  });

  it('keeps trust pillars and workspace branding on the auth page', () => {
    const authPage = read('src/pages/AuthPage.tsx');

    expect(authPage).toContain('OFFICIAL_LOGO_SRC');
    expect(authPage).toContain('vish-auth-logo-hero');
    expect(authPage).toContain('vish-auth-logo-wrap');
    expect(authPage).toContain('vish-auth-logo-img');
    expect(authPage).toContain('vish-auth-wordmark-divider');
    expect(authPage).toContain('VISHVAKARMA.OS');
    expect(authPage).toContain('iPad-Native Architecture Suite');
    expect(authPage).toContain('auth-trust-pillars');
    expect(authPage).toContain('WORLD_RECORD_METRIC_GATE_COUNT}-gate release evidence system');
  });

  it('handles OAuth redirect completion in AuthContext', () => {
    const authContext = read('src/contexts/AuthContext.tsx');

    expect(authContext).toContain('getRedirectResult');
    expect(authContext).toContain('signInWithGoogle');
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
    expect(appLayout).toContain('Workspace account');
    expect(appLayout).toContain('Architecture workstation');
    expect(styles).toContain('.vish-workspace-sidebar');
    expect(styles).toContain('.vish-shell-nav-active');
    expect(styles).toContain('.vish-shell-account');
  });

  it('keeps animation CSS premium, responsive, and reduced-motion safe', () => {
    const styles = read('src/styles/vish-auth-gate.css');
    const routeGuard = read('src/components/common/RouteGuard.tsx');

    expect(styles).toContain('.vish-sanskrit-rain-canvas');
    expect(styles).toContain('.vish-mandala-ring');
    expect(styles).toContain('@keyframes vish-mandala-drift');
    expect(styles).toContain('.vish-auth-access-card');
    expect(styles).toContain('.vish-auth-feature-card:hover');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toContain('animation: none !important');
    expect(routeGuard).toContain('SanskritRainBackground');
    expect(routeGuard).toContain('preset="boot"');
    expect(routeGuard).toContain('vish-boot-aurora');
    expect(styles).toContain('.vish-auth-logo-hero');
    expect(styles).toContain('.vish-auth-logo-wrap');
    expect(styles).toContain('@keyframes vish-auth-logo-breathe');
    expect(styles).toContain('.vish-auth-aurora');
    expect(styles).toContain('@keyframes vish-auth-aurora-drift');
  });
});
