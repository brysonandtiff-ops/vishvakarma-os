import { getBedrooms } from '@/rules/shared/roomContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const smokeAlarmZoneRule: ComplianceRule = {
  id: 'fire-smoke-alarm-zone',
  description: 'Smoke alarm zoning per bedroom (stub)',
  category: 'fire',
  validate(project: Project): ComplianceResult {
    const bedrooms = getBedrooms(project.manifest);
    const findings: ComplianceFinding[] = [];

    for (const room of bedrooms) {
      if (!room.name.trim()) {
        findings.push({
          ruleId: 'fire-smoke-alarm-zone',
          category: 'fire',
          status: 'warning',
          message: 'Unlabelled bedroom — assign room name for smoke alarm zone mapping.',
          roomId: room.id,
        });
      }
    }

    return {
      ruleId: 'fire-smoke-alarm-zone',
      category: 'fire',
      status: statusFromFindings(findings),
      description: 'Smoke alarm zoning per bedroom (stub)',
      findings,
    };
  },
};
