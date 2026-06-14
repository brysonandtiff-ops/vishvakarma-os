import { NBC_IN_THRESHOLDS } from '@/modules/compliance/constants';
import { getBedrooms } from '@/rules/shared/roomContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const nbcBedroomSizeRule: ComplianceRule = {
  id: 'nbc-bedroom-size',
  description: 'Bedroom minimum area and width (NBC India stub)',
  category: 'nbc',
  validate(project: Project): ComplianceResult {
    const bedrooms = getBedrooms(project.manifest);
    const findings: ComplianceFinding[] = [];

    if (bedrooms.length === 0) {
      findings.push({
        ruleId: 'nbc-bedroom-size',
        category: 'nbc',
        status: 'warning',
        message: 'No labelled bedrooms detected — add room labels to audit bedroom sizes.',
      });
    }

    for (const room of bedrooms) {
      if (room.areaSqM > 0 && room.areaSqM < NBC_IN_THRESHOLDS.minHabitableRoomAreaSqM) {
        findings.push({
          ruleId: 'nbc-bedroom-size',
          category: 'nbc',
          status: 'fail',
          message: `${room.name}: area ${room.areaSqM.toFixed(1)} m² is below NBC minimum ${NBC_IN_THRESHOLDS.minHabitableRoomAreaSqM} m².`,
          roomId: room.id,
          field: 'area',
        });
      }
      if (room.widthM > 0 && room.widthM < NBC_IN_THRESHOLDS.minBedroomWidthM) {
        findings.push({
          ruleId: 'nbc-bedroom-size',
          category: 'nbc',
          status: 'fail',
          message: `${room.name}: width ${room.widthM.toFixed(1)} m is below NBC minimum ${NBC_IN_THRESHOLDS.minBedroomWidthM} m.`,
          roomId: room.id,
          field: 'width',
        });
      }
    }

    return {
      ruleId: 'nbc-bedroom-size',
      category: 'nbc',
      status: statusFromFindings(findings),
      description: 'Bedroom minimum area and width (NBC India stub)',
      findings,
    };
  },
};
