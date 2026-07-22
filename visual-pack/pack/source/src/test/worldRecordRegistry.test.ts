import { describe, expect, it } from 'vitest';
import gateManifest from '@/governance/gates/gate-manifest.json';
import {
  RELEASE_GATE_COUNT,
  WORLD_RECORD_METRIC_GATE_COUNT,
  getReleaseGatesForUi,
} from '@/governance/gates/releaseGateManifest';
import {
  WORLD_RECORD_HONESTY_DISCLAIMER,
  buildWorldRecordsFromMeasurement,
  getWorldRecordStatusLabel,
  isGuinnessVerified,
} from '@/governance/records/worldRecordRegistry';

describe('worldRecordRegistry', () => {
  it('uses honest status labels that are not Guinness Verified by default', () => {
    expect(getWorldRecordStatusLabel('self_verified')).toBe('Self-Verified Candidate');
    expect(getWorldRecordStatusLabel('proposed')).toBe('Proposed — Not Yet Measured');
    expect(isGuinnessVerified('self_verified', true)).toBe(false);
    expect(isGuinnessVerified('guinness_verified', false)).toBe(false);
    expect(isGuinnessVerified('guinness_verified', true)).toBe(true);
  });

  it('includes honesty disclaimer on primary record without measurement', () => {
    const records = buildWorldRecordsFromMeasurement(null, false);
    expect(records[0]?.limitations.some((line) => line.includes(WORLD_RECORD_HONESTY_DISCLAIMER))).toBe(true);
    expect(records[0]?.status).toBe('proposed');
  });

  it('builds primary record from measurement artifact shape', () => {
    const records = buildWorldRecordsFromMeasurement(
      {
        product: 'Vishvakarma.OS',
        claimTitle: 'Test claim',
        metricGateCount: 12,
        gateCount: 13,
        gateNames: ['Gate 1'],
        testFileCount: 30,
        commit: 'abc123',
        timestamp: '2026-05-30T00:00:00.000Z',
        reproduceCommand: 'pnpm run record:measure',
        evidenceHash: 'deadbeef',
        status: 'self_verified',
        honestyNote: WORLD_RECORD_HONESTY_DISCLAIMER,
      },
      false,
    );

    expect(records[0]?.metricValue).toContain('12 gates');
    expect(records[0]?.evidenceHash).toBe('deadbeef');
    expect(records[0]?.status).toBe('self_verified');
  });

  it('aligns gate manifest with release UI and world record metric', () => {
    expect(gateManifest.gates.length).toBe(RELEASE_GATE_COUNT);
    expect(WORLD_RECORD_METRIC_GATE_COUNT).toBe(12);
    expect(getReleaseGatesForUi().length).toBe(RELEASE_GATE_COUNT);
  });
});
