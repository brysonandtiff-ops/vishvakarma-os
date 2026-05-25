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
    expect(authPage).toContain('मन्त्र matrix · secure architecture gate');
  });

  it('keeps official logo treatment and auth form intact', () => {
    const authPage = read('src/pages/AuthPage.tsx');

    expect(authPage).toContain('OFFICIAL_LOGO_SRC');
    expect(authPage).toContain('vish-logo-tile-animated');
    expect(authPage).toContain('vish-access-logo');
    expect(authPage).toContain('Request secure access');
    expect(authPage).toContain('Send secure access link');
    expect(authPage).toContain('requestAccessLink(email)');
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
