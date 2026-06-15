import { isCopilotEscalation } from '@/services/architecture-bot/issueCatalog';
import { repairIssue, repairDoorWidths, repairGovernanceState, repairMissingJurisdiction, repairMissingRooms, repairUnnamedBedrooms, repairWallHeights } from '@/services/architecture-bot/repairActions';
import type {
  ArchitectureBotCallbacks,
  ArchitectureIssue,
  RepairSummary,
} from '@/services/architecture-bot/types';
import type { ProjectManifest } from '@/types';

const REPAIR_ORDER = [
  'governance-localStorage',
  'structure-missing-jurisdiction',
  'structure-missing-rooms',
  'ncc-habitable-height',
  'nbc-habitable-height',
  'access-door-width',
  'fire-smoke-alarm-zone',
] as const;

function sortIssuesForRepair(issues: ArchitectureIssue[]): ArchitectureIssue[] {
  const orderIndex = new Map(REPAIR_ORDER.map((id, index) => [id, index]));
  return [...issues].sort((a, b) => {
    const aIndex = a.ruleId ? (orderIndex.get(a.ruleId as (typeof REPAIR_ORDER)[number]) ?? 99) : 99;
    const bIndex = b.ruleId ? (orderIndex.get(b.ruleId as (typeof REPAIR_ORDER)[number]) ?? 99) : 99;
    return aIndex - bIndex;
  });
}

export function applyArchitectureRepairs(
  issues: ArchitectureIssue[],
  manifest: ProjectManifest,
  callbacks: ArchitectureBotCallbacks,
): RepairSummary {
  const applied: RepairSummary['applied'] = [];
  const skipped: RepairSummary['skipped'] = [];
  const escalated: RepairSummary['escalated'] = [];

  const bulkRepairs = [
    () => repairGovernanceState(callbacks),
    () => repairMissingJurisdiction(manifest, callbacks),
    () => repairMissingRooms(callbacks),
    () => repairWallHeights(manifest, callbacks),
    () => repairDoorWidths(manifest, callbacks),
    () => repairUnnamedBedrooms(manifest, callbacks),
  ];

  for (const run of bulkRepairs) {
    for (const result of run()) {
      if (result.applied) applied.push(result);
      else skipped.push(result);
    }
  }

  const sorted = sortIssuesForRepair(issues);
  for (const issue of sorted) {
    if (!issue.autoFixable && !isCopilotEscalation(issue.ruleId ?? '')) continue;
    if (issue.ruleId && REPAIR_ORDER.includes(issue.ruleId as (typeof REPAIR_ORDER)[number])) {
      continue;
    }

    for (const result of repairIssue(issue, manifest, callbacks)) {
      if (result.escalated) escalated.push(result);
      else if (result.applied) applied.push(result);
      else if (result.description) skipped.push(result);
    }
  }

  for (const issue of issues) {
    if (issue.navigateTo === 'copilot' || isCopilotEscalation(issue.ruleId ?? '')) {
      escalated.push({
        issueId: issue.id,
        applied: false,
        description: issue.message,
        escalated: true,
      });
    }
  }

  const needsCopilot = escalated.length > 0;

  return {
    applied,
    skipped,
    escalated,
    needsCopilot,
  };
}
