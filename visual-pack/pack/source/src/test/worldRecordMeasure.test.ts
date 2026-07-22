import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import gateManifest from '@/governance/gates/gate-manifest.json';
import { RELEASE_GATE_COUNT, WORLD_RECORD_METRIC_GATE_COUNT } from '@/governance/gates/releaseGateManifest';

describe('world record measurement artifact', () => {
  const docsPath = join(process.cwd(), 'docs', 'world-record', 'latest-measurement.json');
  const publicPath = join(process.cwd(), 'public', 'world-record', 'latest-measurement.json');

  it('gate manifest defines release gates with metric count 12', () => {
    expect(gateManifest.gates).toHaveLength(RELEASE_GATE_COUNT);
    const metricGates = gateManifest.gates.filter((gate) => gate.number <= WORLD_RECORD_METRIC_GATE_COUNT);
    expect(metricGates).toHaveLength(WORLD_RECORD_METRIC_GATE_COUNT);
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

    expect(measurement.metricGateCount).toBe(WORLD_RECORD_METRIC_GATE_COUNT);
    expect(measurement.gateCount).toBe(RELEASE_GATE_COUNT);
    expect(measurement.gateNames).toHaveLength(RELEASE_GATE_COUNT);
    expect(measurement.evidenceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(measurement.reproduceCommand).toBe('pnpm run record:measure');

    if (existsSync(publicPath)) {
      const publicCopy = readFileSync(publicPath, 'utf8');
      expect(publicCopy).toBe(readFileSync(docsPath, 'utf8'));
    }
  });
});
