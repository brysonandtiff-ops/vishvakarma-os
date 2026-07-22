import { NBC_IN_THRESHOLDS } from '@/modules/compliance/constants';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

/** Stub: dead-end corridor length advisory for labelled circulation rooms. */
export const nbcDeadEndCorridorRule: ComplianceRule = {
  id: 'fire-dead-end-corridor',
  description: 'Dead-end corridor length (fire egress stub)',
  category: 'fire',
  validate(project: Project): ComplianceResult {
    const rooms = project.manifest.rooms ?? [];
    const corridors = rooms.filter(
      (r) => r.roomType === 'Study' || r.name.toLowerCase().includes('corridor'),
    );
    const findings: ComplianceFinding[] = [];

    if (corridors.length === 0) {
      findings.push({
        ruleId: 'fire-dead-end-corridor',
        category: 'fire',
        status: 'warning',
        message: `No labelled corridors — audit dead-end length ≤ ${NBC_IN_THRESHOLDS.maxDeadEndCorridorM} m when corridors are drawn.`,
      });
    } else {
      for (const room of corridors) {
        const lengthM = room.area ? Math.sqrt(room.area) : NBC_IN_THRESHOLDS.maxDeadEndCorridorM;
        const status = lengthM > NBC_IN_THRESHOLDS.maxDeadEndCorridorM ? 'warning' : 'pass';
        findings.push({
          ruleId: 'fire-dead-end-corridor',
          category: 'fire',
          status,
          message: `${room.name}: estimated run ${lengthM.toFixed(1)} m vs NBC stub limit ${NBC_IN_THRESHOLDS.maxDeadEndCorridorM} m.`,
          roomId: room.id,
        });
      }
    }

    return {
      ruleId: 'fire-dead-end-corridor',
      category: 'fire',
      status: statusFromFindings(findings),
      description: 'Dead-end corridor length (fire egress stub)',
      findings,
    };
  },
};
