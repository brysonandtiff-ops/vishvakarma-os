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

    expect(divineThemeIndex).toBeGreaterThan(-1);
    expect(divineThemeIndex).toBeGreaterThan(solarThemeIndex);
  });

  it('preserves the owner supplied swan SVG logo source of truth', () => {
    const officialLogo = read('src/brand/officialLogo.ts');
    const theme = read('src/styles/vish-divine-architect-theme.css');

    expect(officialLogo).toContain("/brand/vishvakarma-official-logo.svg");
    expect(officialLogo).toContain('gold swan / V mark');
    expect(theme).toContain('Logo safety');
    expect(theme).not.toContain('OFFICIAL_LOGO_SRC');
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
});
