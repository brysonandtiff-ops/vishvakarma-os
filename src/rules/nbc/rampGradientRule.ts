import { NBC_IN_THRESHOLDS } from '@/modules/compliance/constants';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

/** Stub: ramp gradient advisory when circulation rooms are labelled. */
export const nbcRampGradientRule: ComplianceRule = {
  id: 'access-ramp-gradient',
  description: 'Ramp gradient limit (NBC / access stub)',
  category: 'accessibility',
  validate(project: Project): ComplianceResult {
    const rooms = project.manifest.rooms ?? [];
    const circulation = rooms.filter((r) => r.roomType === 'Entry' || r.name.toLowerCase().includes('ramp'));
    const findings: ComplianceFinding[] = [];

    if (circulation.length === 0) {
      findings.push({
        ruleId: 'access-ramp-gradient',
        category: 'accessibility',
        status: 'warning',
        message: `Label entry or ramp rooms to audit gradient ≤ ${NBC_IN_THRESHOLDS.maxRampGradientPercent}%.`,
      });
    } else {
      for (const room of circulation) {
        findings.push({
          ruleId: 'access-ramp-gradient',
          category: 'accessibility',
          status: 'pass',
          message: `${room.name}: assumed ramp gradient within ${NBC_IN_THRESHOLDS.maxRampGradientPercent}% (symbolic).`,
          roomId: room.id,
        });
      }
    }

    return {
      ruleId: 'access-ramp-gradient',
      category: 'accessibility',
      status: statusFromFindings(findings),
      description: 'Ramp gradient limit (NBC / access stub)',
      findings,
    };
  },
};
