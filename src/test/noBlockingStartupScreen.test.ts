import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readRepoFile(...parts: string[]) {
  return readFileSync(path.join(repoRoot, ...parts), 'utf8');
}

describe('non-blocking startup experience', () => {
  it('ships only a pointer-transparent splash that removes itself after load', () => {
    const html = readRepoFile('index.html');
    const main = readRepoFile('src', 'main.tsx');
    const routeGuard = readRepoFile('src', 'components', 'common', 'RouteGuard.tsx');
    const authLayout = readRepoFile('src', 'components', 'layouts', 'AuthLayout.tsx');

    expect(html).toContain('id="boot-splash"');
    expect(html).toContain('pointer-events:none');
    expect(html).toContain('rel="apple-touch-startup-image"');
    expect(html).not.toContain('Loading Vishvakarma.OS');
    expect(main).not.toContain('dismissBootSplash');
    expect(routeGuard).not.toContain('SessionBootScreen');
    expect(routeGuard).not.toContain('vish-boot-');
    expect(authLayout).not.toContain("'boot'");
    expect(authLayout).not.toContain('vish-boot-');
  });
});
