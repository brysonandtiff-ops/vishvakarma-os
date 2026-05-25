import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('verification command wiring', () => {
  it('keeps package verification commands wired to evidence, tests, and build', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };

    expect(pkg.scripts['launch:evidence']).toBe('node scripts/quality/check-launch-evidence.mjs');
    expect(pkg.scripts['launch:evidence:strict']).toBe('node scripts/quality/check-launch-evidence.mjs --strict');
    expect(pkg.scripts['release:gates']).toBe('node scripts/verify-all.js');
    expect(pkg.scripts.verify).toContain('pnpm run lint');
    expect(pkg.scripts.verify).toContain('pnpm run launch:evidence');
    expect(pkg.scripts.verify).toContain('pnpm run test');
    expect(pkg.scripts.verify).toContain('pnpm run build');
    expect(pkg.scripts['verify:ci']).toContain('pnpm run verify');
    expect(pkg.scripts['verify:ci']).toContain('pnpm run test:routes');
  });

  it('keeps GitHub verification workflow enforcing security, evidence, tests, route smoke, and build', () => {
    const workflow = read('.github/workflows/verify.yml');

    expect(workflow).toContain('pnpm install --frozen-lockfile');
    expect(workflow).toContain('pnpm run lint');
    expect(workflow).toContain('node scripts/quality/check-vercel-security.mjs');
    expect(workflow).toContain('pnpm run launch:evidence');
    expect(workflow).toContain('pnpm run test');
    expect(workflow).toContain('pnpm run test:routes');
    expect(workflow).toContain('pnpm run build');
    expect(workflow).toContain('pnpm run test:e2e');
    expect(workflow).toContain('actions/upload-artifact@v4');
  });
});
