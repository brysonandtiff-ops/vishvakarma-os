import { describe, expect, it } from 'vitest';
import { getComplianceRulesForJurisdiction } from '@/rules/registry';
import {
  AU_NCC_VOL2_H1_RULE_PACK,
  getCitationForRule,
  validateRulePackIntegrity,
} from '@/modules/compliance/rulePacks';
import { runComplianceAuditFromManifest } from '@/modules/compliance/complianceModule';

describe('AU NCC Vol 2 H1 rule pack', () => {
  it('covers every active AU compliance rule', () => {
    const gaps = validateRulePackIntegrity('au');
    expect(gaps).toEqual([]);
  });

  it('does not require pack entries for India-only NBC rules', () => {
    const auRules = getComplianceRulesForJurisdiction('au');
    const packRuleIds = new Set(AU_NCC_VOL2_H1_RULE_PACK.entries.map((e) => e.ruleId));
    for (const rule of auRules) {
      expect(packRuleIds.has(rule.id)).toBe(true);
    }
  });

  it('provides citations for NCC bedroom size rule', () => {
    const citation = getCitationForRule('ncc-bedroom-size');
    expect(citation?.code).toContain('NCC');
    expect(citation?.summary).toContain('6.5');
  });

  it('attaches citations and disclaimer to audit findings', () => {
    const report = runComplianceAuditFromManifest(
      {
        version: '1',
        name: 'Citation Test',
        jurisdiction: 'au',
        walls: [],
        openings: [],
        materials: [],
        floorMaterial: 'default',
        lighting: { sunAzimuth: 0, sunElevation: 45, timeOfDay: 12, intensity: 1 },
        gridSize: 20,
        snapToGrid: true,
        metadata: { created: '', modified: '' },
      },
      { name: 'Citation Test' },
    );

    expect(report.disclaimer).toContain('decision-support');
    const bedroomRule = report.results.find((r) => r.ruleId === 'ncc-bedroom-size');
    expect(bedroomRule?.findings.some((f) => f.citation?.code.includes('NCC'))).toBe(true);
  });
});
