import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(process.cwd());
const officialLogoPath = '/brand/vishvakarma-official-logo.svg';

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Vishvakarma.OS official logo brand surfaces', () => {
  it('keeps the official logo asset present and named as the single source of truth', () => {
    const assetPath = resolve(repoRoot, 'public/brand/vishvakarma-official-logo.svg');
    expect(existsSync(assetPath)).toBe(true);

    const asset = read('public/brand/vishvakarma-official-logo.svg');
    expect(asset).toContain('Vishvakarma.OS official swan V logo');
    expect(asset).toContain('data:image/webp;base64');
  });

  it('points the shared brand constants to the official logo asset', () => {
    const source = read('src/brand/officialLogo.ts');

    expect(source).toContain(`OFFICIAL_LOGO_SRC = '${officialLogoPath}'`);
    expect(source).toContain(`OFFICIAL_LOGO_FAVICON_SRC = '${officialLogoPath}'`);
    expect(source).not.toContain('/logo.webp');
  });

  it('uses the official logo on authenticated and unauthenticated product surfaces', () => {
    const authPage = read('src/pages/AuthPage.tsx');
    const appLayout = read('src/components/layouts/AppLayout.tsx');

    expect(authPage).toContain('OFFICIAL_LOGO_SRC');
    expect(appLayout).toContain('OFFICIAL_LOGO_SRC');
    expect(authPage).toContain('official user-supplied swan V logo');
    expect(appLayout).toContain('official user-supplied logo');
  });

  it('uses the official logo for browser and PWA metadata', () => {
    const index = read('index.html');
    const manifest = read('public/manifest.webmanifest');

    expect(index).toContain(`href="${officialLogoPath}"`);
    expect(manifest).toContain(`"src": "${officialLogoPath}"`);
    expect(index).not.toContain('/icons/icon.svg');
    expect(index).not.toContain('/icons/apple-touch-icon.svg');
    expect(manifest).not.toContain('/icons/icon.svg');
    expect(manifest).not.toContain('/icons/apple-touch-icon.svg');
  });
});
