import { PX_PER_METER } from '@/domain/constants';
import { NCC_AU_THRESHOLDS } from '@/modules/compliance/constants';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const habitableRoomHeightRule: ComplianceRule = {
  id: 'ncc-habitable-height',
  description: 'Minimum habitable room wall height (NCC AU stub)',
  category: 'ncc',
  validate(project: Project): ComplianceResult {
    const findings: ComplianceFinding[] = [];
    for (const wall of project.manifest.walls) {
      const heightM = wall.height / PX_PER_METER;
      if (heightM > 0 && heightM < NCC_AU_THRESHOLDS.minWallHeightM) {
        findings.push({
          ruleId: 'ncc-habitable-height',
          category: 'ncc',
          status: 'fail',
          message: `Wall ${wall.id}: height ${heightM.toFixed(1)} m below minimum ${NCC_AU_THRESHOLDS.minWallHeightM} m.`,
          field: 'height',
        });
      }
    }

    return {
      ruleId: 'ncc-habitable-height',
      category: 'ncc',
      status: statusFromFindings(findings),
      description: 'Minimum habitable room wall height (NCC AU stub)',
      findings,
    };
  },
};
