import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

type PipelineManifest = {
  tiers: Record<string, { extends?: string; steps?: string[] }>;
};

/** Mirrors scripts/lib/resolve-tier-steps.mjs mergeExtends behavior for tier tests. */
function resolveTierSteps(
  tiers: PipelineManifest['tiers'],
  tierName: string,
  visited = new Set<string>(),
): string[] {
  if (visited.has(tierName)) {
    throw new Error(`Circular pipeline tier extends: ${tierName}`);
  }
  visited.add(tierName);

  const tier = tiers[tierName];
  if (!tier) {
    throw new Error(`Unknown pipeline tier: ${tierName}`);
  }

  let steps: string[] = tier.extends ? resolveTierSteps(tiers, tier.extends, visited) : [];
  if (tier.steps?.length) {
    steps = [...steps, ...tier.steps];
  }
  return steps;
}

describe('RepairBot pipeline tiers', () => {
  const pipeline = JSON.parse(read('scripts/lib/pipeline-manifest.json')) as PipelineManifest;
  const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };

  it('wires repairbot:world npm script', () => {
    expect(pkg.scripts['repairbot:world']).toBe(
      'node scripts/repairbot/repairbot.mjs --tier=repairbot:world',
    );
  });

  it('resolves repairbot:full with env-scan as first step', () => {
    const steps = resolveTierSteps(pipeline.tiers, 'repairbot:full');
    expect(steps[0]).toBe('node scripts/repairbot/lib/env-scan.mjs');
    expect(steps).toContain('pnpm run lint');
    expect(steps).toContain('pnpm run build');
    expect(steps).toContain('pnpm run perf:gates');
  });

  it('resolves repairbot:world with CI delta, record:measure, and release:gates', () => {
    const fullSteps = resolveTierSteps(pipeline.tiers, 'repairbot:full');
    const worldSteps = resolveTierSteps(pipeline.tiers, 'repairbot:world');

    expect(worldSteps.length).toBeGreaterThan(fullSteps.length);
    expect(worldSteps).toContain('pnpm run test:routes');
    expect(worldSteps).toContain('pnpm run record:measure');
    expect(worldSteps).toContain('pnpm run release:gates');
    expect(worldSteps).toContain('node scripts/repairbot/ci-github-health.mjs');
  });
});

describe('RepairBot world-record repairs manifest', () => {
  it('maps world-record env-scan codes to record:measure repair', () => {
    const repairs = JSON.parse(read('scripts/repairbot/repairs.json')) as {
      repairs: Array<{ id: string; codes: string[]; command: string }>;
      patterns: Array<{ code: string; match: string; needsAgent?: boolean }>;
    };

    const worldRecordRepair = repairs.repairs.find((repair) => repair.id === 'world-record-measure');
    expect(worldRecordRepair).toBeDefined();
    expect(worldRecordRepair?.command).toBe('pnpm run record:measure');
    expect(worldRecordRepair?.codes).toEqual(
      expect.arrayContaining([
        'WORLD_RECORD_DOCS_MISSING',
        'WORLD_RECORD_PUBLIC_MISSING',
        'WORLD_RECORD_ARTIFACT_STALE',
      ]),
    );

    const gatePattern = repairs.patterns.find((pattern) => pattern.code === 'WORLD_RECORD_GATE_FAIL');
    expect(gatePattern?.needsAgent).toBe(true);
    expect(gatePattern?.match).toBe('Gate 13: World record evidence');
  });
});
