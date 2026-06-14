import { PX_PER_METER } from '@/domain/constants';
import { NBC_IN_THRESHOLDS } from '@/modules/compliance/constants';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const nbcHabitableRoomHeightRule: ComplianceRule = {
  id: 'nbc-habitable-height',
  description: 'Minimum habitable room wall height (NBC India stub)',
  category: 'nbc',
  validate(project: Project): ComplianceResult {
    const findings: ComplianceFinding[] = [];
    for (const wall of project.manifest.walls) {
      const heightM = wall.height / PX_PER_METER;
      if (heightM > 0 && heightM < NBC_IN_THRESHOLDS.minWallHeightM) {
        findings.push({
          ruleId: 'nbc-habitable-height',
          category: 'nbc',
          status: 'fail',
          message: `Wall ${wall.id}: height ${heightM.toFixed(1)} m below NBC minimum ${NBC_IN_THRESHOLDS.minWallHeightM} m.`,
          field: 'height',
        });
      }
    }

    return {
      ruleId: 'nbc-habitable-height',
      category: 'nbc',
      status: statusFromFindings(findings),
      description: 'Minimum habitable room wall height (NBC India stub)',
      findings,
    };
  },
};
