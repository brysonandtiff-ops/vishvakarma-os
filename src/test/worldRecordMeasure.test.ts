import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import gateManifest from '@/governance/gates/gate-manifest.json';

describe('world record measurement artifact', () => {
  const docsPath = join(process.cwd(), 'docs', 'world-record', 'latest-measurement.json');
  const publicPath = join(process.cwd(), 'public', 'world-record', 'latest-measurement.json');

  it('gate manifest defines 18 gates with metric count 12', () => {
    expect(gateManifest.gates).toHaveLength(18);
    const metricGates = gateManifest.gates.filter((gate) => gate.number <= 12);
    expect(metricGates).toHaveLength(12);
  });

  it('latest-measurement.json exists and matches schema when generated', () => {
    if (!existsSync(docsPath)) {
      expect(existsSync(join(process.cwd(), 'scripts', 'world-record', 'measure-record.mjs'))).toBe(true);
      return;
    }

    const measurement = JSON.parse(readFileSync(docsPath, 'utf8')) as {
      metricGateCount: number;
      gateCount: number;
      gateNames: string[];
      evidenceHash: string;
      reproduceCommand: string;
    };

    expect(measurement.metricGateCount).toBe(12);
    expect(measurement.gateCount).toBe(18);
    expect(measurement.gateNames).toHaveLength(18);
    expect(measurement.evidenceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(measurement.reproduceCommand).toBe('pnpm run record:measure');

    if (existsSync(publicPath)) {
      const publicCopy = readFileSync(publicPath, 'utf8');
      expect(publicCopy).toBe(readFileSync(docsPath, 'utf8'));
    }
  });
});
