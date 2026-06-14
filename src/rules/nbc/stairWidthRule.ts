import { NBC_IN_THRESHOLDS } from '@/modules/compliance/constants';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

/** Stub: assumes default stair width when staircases are present. */
export const nbcStairWidthRule: ComplianceRule = {
  id: 'nbc-stair-width',
  description: 'Minimum stair width (NBC India stub)',
  category: 'nbc',
  validate(project: Project): ComplianceResult {
    const staircases = project.manifest.staircases ?? [];
    const findings: ComplianceFinding[] = [];

    if (staircases.length === 0) {
      findings.push({
        ruleId: 'nbc-stair-width',
        category: 'nbc',
        status: 'warning',
        message: 'No staircases drawn — add stairs to audit NBC stair width.',
      });
    } else {
      for (const stair of staircases) {
        findings.push({
          ruleId: 'nbc-stair-width',
          category: 'nbc',
          status: 'pass',
          message: `Stair ${stair.id}: assumed width meets NBC minimum ${NBC_IN_THRESHOLDS.minStairWidthM} m (symbolic check).`,
        });
      }
    }

    return {
      ruleId: 'nbc-stair-width',
      category: 'nbc',
      status: statusFromFindings(findings),
      description: 'Minimum stair width (NBC India stub)',
      findings,
    };
  },
};
