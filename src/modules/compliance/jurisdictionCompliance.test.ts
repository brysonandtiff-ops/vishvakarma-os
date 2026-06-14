import { describe, it, expect } from 'vitest';
import { getComplianceRulesForJurisdiction } from '@/rules/registry';
import { runComplianceAuditFromManifest } from '@/modules/compliance/complianceModule';

describe('jurisdiction compliance routing', () => {
  it('uses NCC rules for Australia jurisdiction', () => {
    const rules = getComplianceRulesForJurisdiction('au');
    expect(rules.some((r) => r.id.startsWith('ncc-'))).toBe(true);
    expect(rules.some((r) => r.id.startsWith('nbc-'))).toBe(false);
  });

  it('uses NBC rules for India jurisdiction', () => {
    const rules = getComplianceRulesForJurisdiction('in');
    expect(rules.some((r) => r.id.startsWith('nbc-'))).toBe(true);
    expect(rules.some((r) => r.id.startsWith('ncc-'))).toBe(false);
  });

  it('runs NBC audit when manifest jurisdiction is in', () => {
    const report = runComplianceAuditFromManifest(
      {
        version: '1',
        name: 'India Home',
        jurisdiction: 'in',
        walls: [],
        openings: [],
        materials: [],
        floorMaterial: 'default',
        lighting: { sunAzimuth: 0, sunElevation: 45, timeOfDay: 12, intensity: 1 },
        gridSize: 20,
        snapToGrid: true,
        metadata: { created: '', modified: '' },
      },
      { name: 'India Home' },
    );
    expect(report.results.some((r) => r.category === 'nbc')).toBe(true);
  });
});
