import { NBC_IN_THRESHOLDS } from '@/modules/compliance/constants';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

/** Stub: symbolic NBC stair rise/run check when staircases exist. */
export const nbcStairRiseRunRule: ComplianceRule = {
  id: 'nbc-stair-rise-run',
  description: 'Stair rise and run proportions (NBC India stub)',
  category: 'nbc',
  validate(project: Project): ComplianceResult {
    const staircases = project.manifest.staircases ?? [];
    const findings: ComplianceFinding[] = [];

    if (staircases.length === 0) {
      findings.push({
        ruleId: 'nbc-stair-rise-run',
        category: 'nbc',
        status: 'warning',
        message: 'No staircases drawn — add stairs to audit NBC rise/run proportions.',
      });
    } else {
      for (const stair of staircases) {
        findings.push({
          ruleId: 'nbc-stair-rise-run',
          category: 'nbc',
          status: 'pass',
          message: `Stair ${stair.id}: assumed rise ${NBC_IN_THRESHOLDS.maxStairRiseCm} cm / run ${NBC_IN_THRESHOLDS.minStairRunCm} cm within NBC stub limits.`,
        });
      }
    }

    return {
      ruleId: 'nbc-stair-rise-run',
      category: 'nbc',
      status: statusFromFindings(findings),
      description: 'Stair rise and run proportions (NBC India stub)',
      findings,
    };
  },
};
