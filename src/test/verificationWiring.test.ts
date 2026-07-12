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
    const pipeline = JSON.parse(read('scripts/lib/pipeline-manifest.json')) as {
      tiers: Record<string, { steps: string[] }>;
    };

    expect(pkg.scripts.pipeline).toBe('node scripts/run-pipeline.mjs');
    expect(pkg.scripts.verify).toBe('node scripts/run-pipeline.mjs --tier=verify');
    expect(pkg.scripts['verify:ci']).toBe('node scripts/run-pipeline.mjs --tier=verify:ci');
    expect(pkg.scripts.ci).toBe('node scripts/run-pipeline.mjs --tier=ci');
    expect(pkg.scripts['launch:evidence']).toBe('node scripts/quality/check-launch-evidence.mjs');
    expect(pkg.scripts['launch:evidence:strict']).toBe('node scripts/quality/check-launch-evidence.mjs --strict');
    expect(pkg.scripts['release:gates']).toBe('node scripts/verify-all.js');
    expect(pkg.scripts['production:functional-proof']).toBe(
      'node scripts/production/generate-functional-proof.mjs',
    );
    expect(pkg.scripts['perf:gates']).toContain('check-bundle-budget.mjs');
    expect(pkg.scripts['perf:gates']).toContain('check-pwa-precache.mjs');
    expect(pkg.scripts['stability:gates']).toContain('check-monitoring.mjs');

    const verifySteps = pipeline.tiers.verify.steps;
    expect(verifySteps).toContain('pnpm run lint');
    expect(verifySteps).toContain('pnpm run launch:evidence');
    expect(verifySteps).toContain('pnpm run test');
    expect(verifySteps).toContain('pnpm run build');
    expect(verifySteps).toContain('pnpm run perf:gates');

    const verifyCiSteps = pipeline.tiers['verify:ci'].steps;
    expect(verifyCiSteps).toContain('pnpm run test:routes');
  });

  it('keeps GitHub verification workflow enforcing security, evidence, tests, route smoke, and build', () => {
    const workflow = read('.github/workflows/verify.yml');

    expect(workflow).toContain('pnpm install --frozen-lockfile');
    expect(workflow).toContain('pnpm run lint');
    expect(workflow).toContain('node scripts/quality/check-vercel-security.mjs');
    expect(workflow).toContain('pnpm run flawless:gates');
    expect(workflow).toContain('pnpm run stability:gates');
    expect(workflow).toContain('pnpm run launch:evidence');
    expect(workflow).toContain('pnpm run test:coverage');
    expect(workflow).toContain('pnpm run test:routes');
    expect(workflow).toContain('pnpm run build');
    expect(workflow).toContain('pnpm run perf:gates');
    expect(workflow).toContain('pnpm run record:measure');
    expect(workflow).toContain('pnpm run test:e2e');
    expect(workflow).toMatch(/actions\/upload-artifact@[\da-f]{40} # v4\.6\.2/);
    expect(workflow).toContain('name: vishvakarma-os-dist');
  });
});
