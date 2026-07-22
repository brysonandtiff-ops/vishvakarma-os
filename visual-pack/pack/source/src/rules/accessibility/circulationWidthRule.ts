import { NCC_AU_THRESHOLDS } from '@/modules/compliance/constants';
import { resolveRooms } from '@/rules/shared/roomContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const circulationWidthRule: ComplianceRule = {
  id: 'access-circulation-width',
  description: 'Hallway minimum circulation width (NCC AU stub)',
  category: 'accessibility',
  validate(project: Project): ComplianceResult {
    const findings: ComplianceFinding[] = [];
    const hallways = resolveRooms(project.manifest).filter((r) => /hallway|corridor|hall/i.test(r.name));

    for (const hall of hallways) {
      if (hall.widthM > 0 && hall.widthM < NCC_AU_THRESHOLDS.minHallwayWidthM) {
        findings.push({
          ruleId: 'access-circulation-width',
          category: 'accessibility',
          status: 'warning',
          message: `${hall.name}: width ${hall.widthM.toFixed(1)} m may be below circulation minimum ${NCC_AU_THRESHOLDS.minHallwayWidthM} m.`,
          roomId: hall.id,
        });
      }
    }

    return {
      ruleId: 'access-circulation-width',
      category: 'accessibility',
      status: statusFromFindings(findings),
      description: 'Hallway minimum circulation width (NCC AU stub)',
      findings,
    };
  },
};
