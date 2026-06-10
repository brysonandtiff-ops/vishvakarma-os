import { NCC_AU_THRESHOLDS } from '@/modules/compliance/constants';
import { doorWidthM } from '@/rules/shared/openingContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const doorWidthRule: ComplianceRule = {
  id: 'access-door-width',
  description: 'Minimum clear door width for accessibility (NCC AU stub)',
  category: 'accessibility',
  validate(project: Project): ComplianceResult {
    const findings: ComplianceFinding[] = [];
    const doors = project.manifest.openings.filter((o) => o.type === 'door');

    for (const door of doors) {
      const widthM = doorWidthM(door);
      if (widthM < NCC_AU_THRESHOLDS.minDoorWidthM) {
        findings.push({
          ruleId: 'access-door-width',
          category: 'accessibility',
          status: 'fail',
          message: `Door ${door.id}: width ${widthM.toFixed(2)} m below minimum ${NCC_AU_THRESHOLDS.minDoorWidthM} m.`,
          field: 'width',
        });
      }
    }

    return {
      ruleId: 'access-door-width',
      category: 'accessibility',
      status: statusFromFindings(findings),
      description: 'Minimum clear door width for accessibility (NCC AU stub)',
      findings,
    };
  },
};
