import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type VercelConfig = {
  installCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
};

describe('Vercel build gate', () => {
  it('runs frozen install, focused quality checks, build, then performance budgets', () => {
    const config = JSON.parse(
      readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'),
    ) as VercelConfig;
    const buildCommand = config.buildCommand ?? '';

    expect(config.installCommand).toContain('pnpm install --frozen-lockfile');
    expect(buildCommand).toContain('pnpm run lint');
    expect(buildCommand).toContain('src/test/releaseGateHardening.test.ts');
    expect(buildCommand).toContain('src/test/vercelBuildGate.test.ts');
    expect(buildCommand).toContain('src/backend/supabase/mappers.test.ts');
    expect(buildCommand).toContain('pnpm run build');
    expect(buildCommand).toContain('pnpm run perf:gates');

    expect(buildCommand.indexOf('pnpm run lint')).toBeLessThan(
      buildCommand.indexOf('pnpm exec vitest run'),
    );
    expect(buildCommand.indexOf('pnpm exec vitest run')).toBeLessThan(
      buildCommand.indexOf('pnpm run build'),
    );
    expect(buildCommand.indexOf('pnpm run build')).toBeLessThan(
      buildCommand.indexOf('pnpm run perf:gates'),
    );
    expect(config.outputDirectory).toBe('dist');
  });
});
