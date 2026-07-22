import { getBedrooms } from '@/rules/shared/roomContext';
import { exteriorWallIds, hasDoorOnWalls } from '@/rules/shared/openingContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const egressPathRule: ComplianceRule = {
  id: 'fire-egress-path',
  description: 'Bedroom path to exterior door (fire egress stub)',
  category: 'fire',
  validate(project: Project): ComplianceResult {
    const bedrooms = getBedrooms(project.manifest);
    const findings: ComplianceFinding[] = [];
    const exterior = exteriorWallIds(project.manifest);

    if (bedrooms.length === 0) {
      return {
        ruleId: 'fire-egress-path',
        category: 'fire',
        status: 'pass',
        description: 'Bedroom path to exterior door (fire egress stub)',
        findings: [],
      };
    }

    for (const room of bedrooms) {
      const exteriorWalls = room.wallIds.filter((id) => exterior.has(id));
      const hasExteriorDoor = exteriorWalls.some((wallId) =>
        project.manifest.openings.some((o) => o.type === 'door' && o.wallId === wallId)
      );
      const hasInteriorDoor = hasDoorOnWalls(project.manifest, room.wallIds);

      if (!hasExteriorDoor && !hasInteriorDoor) {
        findings.push({
          ruleId: 'fire-egress-path',
          category: 'fire',
          status: 'warning',
          message: `${room.name}: no verified egress path to exterior — review fire separation.`,
          roomId: room.id,
        });
      } else if (!hasExteriorDoor && hasInteriorDoor) {
        findings.push({
          ruleId: 'fire-egress-path',
          category: 'fire',
          status: 'warning',
          message: `${room.name}: interior door only — confirm path to exterior exit.`,
          roomId: room.id,
        });
      }
    }

    return {
      ruleId: 'fire-egress-path',
      category: 'fire',
      status: statusFromFindings(findings),
      description: 'Bedroom path to exterior door (fire egress stub)',
      findings,
    };
  },
};
