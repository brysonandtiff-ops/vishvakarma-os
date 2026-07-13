import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
    expect(pkg.scripts['perf:gates']).toBe('node scripts/performance/check-bundle-budget.mjs');
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

  it('enforces local-only verification with no executable GitHub workflows', () => {
    const workflowDirectory = resolve(repoRoot, '.github/workflows');
    const entries = existsSync(workflowDirectory) ? readdirSync(workflowDirectory) : [];
    const executableWorkflows = entries.filter((entry) => /\.ya?ml$/i.test(entry));

    expect(executableWorkflows).toEqual([]);
    const policy = read('.github/workflows/README.md');
    expect(policy).toContain('GitHub Actions is intentionally not used');
    expect(policy).toContain('Run `pnpm run lint`');
    expect(policy).toContain('never from GitHub Actions');
  });
});
