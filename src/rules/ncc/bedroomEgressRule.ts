import { getBedrooms } from '@/rules/shared/roomContext';
import { hasDoorOnWalls, hasWindowOnWalls } from '@/rules/shared/openingContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const bedroomEgressRule: ComplianceRule = {
  id: 'ncc-bedroom-egress',
  description: 'Bedroom egress door or window (NCC AU stub)',
  category: 'ncc',
  validate(project: Project): ComplianceResult {
    const bedrooms = getBedrooms(project.manifest);
    const findings: ComplianceFinding[] = [];

    for (const room of bedrooms) {
      if (room.wallIds.length === 0) continue;
      const hasDoor = hasDoorOnWalls(project.manifest, room.wallIds);
      const hasWindow = hasWindowOnWalls(project.manifest, room.wallIds);

      if (!hasDoor && !hasWindow) {
        findings.push({
          ruleId: 'ncc-bedroom-egress',
          category: 'ncc',
          status: 'fail',
          message: `${room.name}: no door or window on room walls — egress required.`,
          roomId: room.id,
        });
      } else if (!hasDoor && hasWindow) {
        findings.push({
          ruleId: 'ncc-bedroom-egress',
          category: 'ncc',
          status: 'warning',
          message: `${room.name}: window only — verify window meets egress opening size.`,
          roomId: room.id,
        });
      }
    }

    return {
      ruleId: 'ncc-bedroom-egress',
      category: 'ncc',
      status: statusFromFindings(findings),
      description: 'Bedroom egress door or window (NCC AU stub)',
      findings,
    };
  },
};
