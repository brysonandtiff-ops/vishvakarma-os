import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readRepoFile(...parts: string[]) {
  return readFileSync(path.join(repoRoot, ...parts), 'utf8');
}

describe('blocking startup screen removal', () => {
  it('does not ship startup, impatience, or secure-session wait overlays', () => {
    const html = readRepoFile('index.html');
    const main = readRepoFile('src', 'main.tsx');
    const routeGuard = readRepoFile('src', 'components', 'common', 'RouteGuard.tsx');
    const authLayout = readRepoFile('src', 'components', 'layouts', 'AuthLayout.tsx');

    expect(html).not.toContain('boot-splash');
    expect(html).not.toContain('apple-touch-startup-image');
    expect(html).not.toContain('Loading Vishvakarma.OS');
    expect(main).not.toContain('dismissBootSplash');
    expect(routeGuard).not.toContain('SessionBootScreen');
    expect(routeGuard).not.toContain('vish-boot-');
    expect(authLayout).not.toContain("'boot'");
    expect(authLayout).not.toContain('vish-boot-');
  });
});
