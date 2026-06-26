import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Divine Architect visual theme', () => {
  it('loads the global theme after existing polish layers', () => {
    const main = read('src/main.tsx');
    const solarThemeIndex = main.indexOf('./styles/vish-theme-solar-mandala.css');
    const divineThemeIndex = main.indexOf('./styles/vish-divine-architect-theme.css');
    const authReferenceIndex = main.indexOf('./styles/vish-auth-reference-screen.css');

    expect(divineThemeIndex).toBeGreaterThan(-1);
    expect(divineThemeIndex).toBeGreaterThan(solarThemeIndex);
    expect(authReferenceIndex).toBeGreaterThan(divineThemeIndex);
  });

  it('preserves the owner supplied swan SVG logo source of truth', () => {
    const officialLogo = read('src/brand/officialLogo.ts');
    const authLoginCard = read('src/components/auth/AuthLoginCard.tsx');
    const theme = read('src/styles/vish-divine-architect-theme.css');
    const authReference = read('src/styles/vish-auth-reference-screen.css');

    expect(officialLogo).toContain('/brand/vishvakarma-official-logo.svg');
    expect(officialLogo).toContain('gold swan / V mark');
    expect(authLoginCard).toContain('src={OFFICIAL_LOGO_SRC}');
    expect(authLoginCard).toContain('Vishvakarma.OS swan logo');
    expect(theme).toContain('Logo safety');
    expect(authReference).toContain("img[src*='vishvakarma-official-logo.svg']");
    expect(theme).not.toContain('OFFICIAL_LOGO_SRC =');
    expect(authReference).not.toContain('background-image: url');
  });

  it('applies the supplied midnight blue, gold, blueprint, and tool highlight direction', () => {
    const theme = read('src/styles/vish-divine-architect-theme.css');

    expect(theme).toContain('--vish-divine-midnight');
    expect(theme).toContain('--vish-divine-gold');
    expect(theme).toContain('--vish-divine-blue-soft');
    expect(theme).toContain('vish-blueprint-drift');
    expect(theme).toContain('.vish-login-page__auth-card');
    expect(theme).toContain('.architect-tool-button.active');
    expect(theme).toContain('vish-tool-active-pulse');
    expect(theme).toContain('prefers-reduced-motion: reduce');
  });

  it('matches the supplied auth reference details around the current auth page classes', () => {
    const authReference = read('src/styles/vish-auth-reference-screen.css');

    expect(authReference).toContain('.vish-auth-mockup-page__grid::before');
    expect(authReference).toContain('INSPIRED BY DIVINITY');
    expect(authReference).toContain('BUILT FOR HUMANITY');
    expect(authReference).toContain('.vish-auth-mockup-side::before');
    expect(authReference).toContain('☼');
    expect(authReference).toContain('.vish-auth-mockup-side::after');
    expect(authReference).toContain('clip-path: polygon');
    expect(authReference).toContain('.vish-auth-mockup-card::after');
    expect(authReference).toContain('vam-reference-card-glint');
    expect(authReference).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
