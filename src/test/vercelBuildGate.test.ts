import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type VercelConfig = {
  installCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
};

describe('Vercel build gate', () => {
  it('uses a frozen install and enforces performance budgets after build', () => {
    const config = JSON.parse(
      readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'),
    ) as VercelConfig;

    expect(config.installCommand).toContain('pnpm install --frozen-lockfile');
    expect(config.buildCommand).toContain('pnpm run build');
    expect(config.buildCommand).toContain('pnpm run perf:gates');
    expect(config.buildCommand?.indexOf('pnpm run build')).toBeLessThan(
      config.buildCommand?.indexOf('pnpm run perf:gates') ?? -1,
    );
    expect(config.outputDirectory).toBe('dist');
  });
});
