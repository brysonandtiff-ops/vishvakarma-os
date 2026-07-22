import { PX_PER_METER } from '@/domain/constants';
import { NCC_AU_THRESHOLDS } from '@/modules/compliance/constants';
import { resolveRooms } from '@/rules/shared/roomContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const glazingRatioRule: ComplianceRule = {
  id: 'energy-glazing-ratio',
  description: 'Window-to-floor area ratio per habitable room (stub)',
  category: 'energy',
  validate(project: Project): ComplianceResult {
    const findings: ComplianceFinding[] = [];
    const rooms = resolveRooms(project.manifest).filter((r) => r.areaSqM > 0);

    for (const room of rooms) {
      const windows = project.manifest.openings.filter(
        (o) => o.type === 'window' && room.wallIds.includes(o.wallId)
      );
      const windowAreaSqM = windows.reduce(
        (sum, w) => sum + (w.width / PX_PER_METER) * (w.height / PX_PER_METER),
        0
      );
      const ratio = room.areaSqM > 0 ? windowAreaSqM / room.areaSqM : 0;

      if (ratio > 0 && ratio < NCC_AU_THRESHOLDS.minGlazingRatio) {
        findings.push({
          ruleId: 'energy-glazing-ratio',
          category: 'energy',
          status: 'warning',
          message: `${room.name}: glazing ratio ${(ratio * 100).toFixed(0)}% may be low for daylight.`,
          roomId: room.id,
        });
      }
    }

    return {
      ruleId: 'energy-glazing-ratio',
      category: 'energy',
      status: statusFromFindings(findings),
      description: 'Window-to-floor area ratio per habitable room (stub)',
      findings,
    };
  },
};
