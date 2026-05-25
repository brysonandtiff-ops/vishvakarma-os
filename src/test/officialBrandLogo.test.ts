import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OFFICIAL_LOGO_FAVICON_SRC, OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';

const repoRoot = resolve(process.cwd());
const officialLogoPath = '/brand/vishvakarma-official-logo.svg';

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('official Vishvakarma.OS brand logo', () => {
  it('uses one official logo source for app and favicon constants', () => {
    expect(OFFICIAL_LOGO_SRC).toBe(officialLogoPath);
    expect(OFFICIAL_LOGO_FAVICON_SRC).toBe(officialLogoPath);
  });

  it('ships the official user-supplied swan V logo asset', () => {
    const logo = read('public/brand/vishvakarma-official-logo.svg');

    expect(logo).toContain('Vishvakarma.OS official swan V logo');
    expect(logo).toContain('data:image/webp;base64,');
    expect(logo).toContain('<image');
  });

  it('wires browser, legacy icon, and PWA metadata to the official logo', () => {
    const html = read('index.html');
    const manifest = read('public/manifest.webmanifest');
    const legacyIcon = read('public/icons/icon.svg');
    const legacyAppleIcon = read('public/icons/apple-touch-icon.svg');

    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/brand/vishvakarma-official-logo.svg" />');
    expect(html).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/brand/vishvakarma-official-logo.svg" />');
    expect(manifest).toContain('"src": "/brand/vishvakarma-official-logo.svg"');
    expect(legacyIcon).toContain('/brand/vishvakarma-official-logo.svg');
    expect(legacyAppleIcon).toContain('/brand/vishvakarma-official-logo.svg');
  });

  it('renders the official logo on the protected auth gate and app shell', () => {
    const authPage = read('src/pages/AuthPage.tsx');
    const appLayout = read('src/components/layouts/AppLayout.tsx');

    expect(authPage).toContain('OFFICIAL_LOGO_SRC');
    expect(authPage).toContain('Vishvakarma.OS official user-supplied swan V logo');
    expect(appLayout).toContain('OFFICIAL_LOGO_SRC');
    expect(appLayout).toContain('Vishvakarma.OS official user-supplied logo');
  });
});
