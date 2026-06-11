import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(process.cwd());
const officialLogoPath = '/brand/vishvakarma-official-logo.svg';
const pwaIconPath = '/icons/icon.svg';

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

  it('derives self-contained PWA icon SVGs from the official logo artwork', () => {
    for (const iconPath of ['public/icons/icon.svg', 'public/icons/apple-touch-icon.svg']) {
      const icon = read(iconPath);
      expect(icon).toContain('data:image/webp;base64');
      expect(icon).not.toContain('href="/brand/');
    }

    for (const pngPath of [
      'public/brand/vishvakarma-apple-touch-icon.png',
      'public/icons/icon-192.png',
      'public/icons/icon-512.png',
      'public/icons/favicon-32.png',
    ]) {
      expect(existsSync(resolve(repoRoot, pngPath))).toBe(true);
    }
  });

  it('uses derived icon assets for browser and PWA metadata', () => {
    const index = read('index.html');
    const manifest = read('public/manifest.webmanifest');

    expect(index).toContain(`href="${pwaIconPath}"`);
    expect(index).toContain('/icons/icon-192.png');
    expect(index).toContain('/icons/favicon-32.png');
    expect(manifest).toContain('"/icons/icon-192.png"');
    expect(manifest).toContain('"/icons/icon-512.png"');
    expect(manifest).toContain(`"src": "${pwaIconPath}"`);
    expect(index).toContain('/brand/vishvakarma-apple-touch-icon.png');
    expect(index).not.toContain(`href="${officialLogoPath}"`);
    expect(manifest).not.toContain(`"src": "${officialLogoPath}"`);
  });
});
