import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Sanskrit auth gate design', () => {
  it('keeps the animated Sanskrit matrix and mandala layers on the auth page', () => {
    const authPage = read('src/pages/AuthPage.tsx');

    expect(authPage).toContain("@/styles/vish-auth-gate.css");
    expect(authPage).toContain('SANSKRIT_MATRIX_COLUMNS');
    expect(authPage).toContain('ॐ श्री विश्वकर्मणे नमः');
    expect(authPage).toContain('मन्त्र यन्त्र वास्तु रचना');
    expect(authPage).toContain('vish-sanskrit-matrix');
    expect(authPage).toContain('vish-sanskrit-column');
    expect(authPage).toContain('vish-mandala-aura');
    expect(authPage).toContain('vish-mandala-ring-outer');
    expect(authPage).toContain('vish-auth-card-mockup');
  });

  it('keeps mockup auth card copy and magic-link flow intact', () => {
    const authPage = read('src/pages/AuthPage.tsx');

    expect(authPage).toContain('OFFICIAL_LOGO_SRC');
    expect(authPage).toContain('vish-logo-tile-animated');
    expect(authPage).toContain('vish-access-logo');
    expect(authPage).toContain('VISHVAKARMA.OS');
    expect(authPage).toContain('iPad-Native Architecture Suite');
    expect(authPage).toContain('requestAccessLink(email)');
    expect(authPage).toContain('Send secure access link');
    expect(authPage).toContain('Continue with Google');
    expect(authPage).toContain('auth-trust-pillars');
    expect(authPage).toContain('WORLD_RECORD_METRIC_GATE_COUNT}-gate release evidence system');
    expect(authPage).not.toContain('type="password"');
  });

  it('enables OAuth providers when backend is configured', () => {
    const authPage = read('src/pages/AuthPage.tsx');

    expect(authPage).toContain('Continue with Google');
    expect(authPage).toContain('Continue with Apple');
    expect(authPage).toContain('signInWithGoogle');
    expect(authPage).toContain('signInWithApple');
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
    expect(appLayout).toContain('Protected workspace');
    expect(appLayout).toContain('विश्वकर्मा · Divine Architecture');
    expect(styles).toContain('.vish-workspace-sidebar');
    expect(styles).toContain('.vish-shell-nav-active');
    expect(styles).toContain('.vish-shell-account');
  });

  it('keeps animation CSS premium, responsive, and reduced-motion safe', () => {
    const styles = read('src/styles/vish-auth-gate.css');

    expect(styles).toContain('.vish-sanskrit-matrix');
    expect(styles).toContain('@keyframes vish-sanskrit-rain');
    expect(styles).toContain('.vish-mandala-ring');
    expect(styles).toContain('@keyframes vish-mandala-drift');
    expect(styles).toContain('.vish-auth-access-card');
    expect(styles).toContain('.vish-auth-feature-card:hover');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toContain('animation: none !important');
  });
});
