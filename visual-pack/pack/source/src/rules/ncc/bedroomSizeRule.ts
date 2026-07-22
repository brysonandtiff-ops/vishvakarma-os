import { NCC_AU_THRESHOLDS } from '@/modules/compliance/constants';
import { getBedrooms } from '@/rules/shared/roomContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const bedroomSizeRule: ComplianceRule = {
  id: 'ncc-bedroom-size',
  description: 'Bedroom minimum area and width (NCC AU stub)',
  category: 'ncc',
  validate(project: Project): ComplianceResult {
    const bedrooms = getBedrooms(project.manifest);
    const findings: ComplianceFinding[] = [];

    if (bedrooms.length === 0) {
      findings.push({
        ruleId: 'ncc-bedroom-size',
        category: 'ncc',
        status: 'warning',
        message: 'No labelled bedrooms detected — add room labels to audit bedroom sizes.',
      });
    }

    for (const room of bedrooms) {
      if (room.areaSqM > 0 && room.areaSqM < NCC_AU_THRESHOLDS.minHabitableRoomAreaSqM) {
        findings.push({
          ruleId: 'ncc-bedroom-size',
          category: 'ncc',
          status: 'fail',
          message: `${room.name}: area ${room.areaSqM.toFixed(1)} m² is below minimum ${NCC_AU_THRESHOLDS.minHabitableRoomAreaSqM} m².`,
          roomId: room.id,
          field: 'area',
        });
      }
      if (room.widthM > 0 && room.widthM < NCC_AU_THRESHOLDS.minBedroomWidthM) {
        findings.push({
          ruleId: 'ncc-bedroom-size',
          category: 'ncc',
          status: 'fail',
          message: `${room.name}: width ${room.widthM.toFixed(1)} m is below minimum ${NCC_AU_THRESHOLDS.minBedroomWidthM} m.`,
          roomId: room.id,
          field: 'width',
        });
      }
      if (room.areaSqM === 0 && room.wallIds.length === 0) {
        findings.push({
          ruleId: 'ncc-bedroom-size',
          category: 'ncc',
          status: 'warning',
          message: `${room.name}: no enclosed walls — detect room or draw walls to measure area.`,
          roomId: room.id,
        });
      }
    }

    return {
      ruleId: 'ncc-bedroom-size',
      category: 'ncc',
      status: statusFromFindings(findings),
      description: 'Bedroom minimum area and width (NCC AU stub)',
      findings,
    };
  },
};
