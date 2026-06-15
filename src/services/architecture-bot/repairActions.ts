import { PX_PER_METER } from '@/domain/constants';
import { roomTypeLabel, type RoomType } from '@/domain/rooms/roomType';
import { resolveJurisdiction } from '@/domain/projects/jurisdiction';
import { NBC_IN_THRESHOLDS, NCC_AU_THRESHOLDS } from '@/modules/compliance/constants';
import { getBedrooms } from '@/rules/shared/roomContext';
import { isCopilotEscalation } from '@/services/architecture-bot/issueCatalog';
import type {
  ArchitectureBotCallbacks,
  ArchitectureIssue,
  RepairActionResult,
} from '@/services/architecture-bot/types';
import type { ProjectManifest } from '@/types';

function minWallHeightPx(jurisdiction: 'au' | 'in'): number {
  const minM = jurisdiction === 'in' ? NBC_IN_THRESHOLDS.minWallHeightM : NCC_AU_THRESHOLDS.minWallHeightM;
  return minM * PX_PER_METER;
}

function minDoorWidthPx(jurisdiction: 'au' | 'in'): number {
  const minM = jurisdiction === 'in' ? NBC_IN_THRESHOLDS.minDoorWidthM : NCC_AU_THRESHOLDS.minDoorWidthM;
  return minM * PX_PER_METER;
}

export function repairWallHeights(
  manifest: ProjectManifest,
  callbacks: ArchitectureBotCallbacks,
): RepairActionResult[] {
  if (!callbacks.onUpdateWall) return [];

  const jurisdiction = resolveJurisdiction(manifest);
  const minHeight = minWallHeightPx(jurisdiction);
  const results: RepairActionResult[] = [];

  for (const wall of manifest.walls) {
    if (wall.height > 0 && wall.height < minHeight) {
      callbacks.onUpdateWall(wall.id, { height: minHeight });
      results.push({
        issueId: `wall-height-${wall.id}`,
        applied: true,
        description: `Raised wall ${wall.id} to minimum height.`,
      });
    }
  }

  return results;
}

export function repairDoorWidths(
  manifest: ProjectManifest,
  callbacks: ArchitectureBotCallbacks,
): RepairActionResult[] {
  if (!callbacks.onUpdateOpening) return [];

  const jurisdiction = resolveJurisdiction(manifest);
  const minWidth = minDoorWidthPx(jurisdiction);
  const results: RepairActionResult[] = [];

  for (const opening of manifest.openings) {
    if (opening.type !== 'door') continue;
    if (opening.width >= minWidth) continue;
    callbacks.onUpdateOpening(opening.id, { width: minWidth });
    results.push({
      issueId: `door-width-${opening.id}`,
      applied: true,
      description: `Widened door ${opening.id} to minimum clear width.`,
    });
  }

  return results;
}

export function repairUnnamedBedrooms(
  manifest: ProjectManifest,
  callbacks: ArchitectureBotCallbacks,
): RepairActionResult[] {
  if (!callbacks.onUpdateRoom) return [];

  const results: RepairActionResult[] = [];
  for (const room of getBedrooms(manifest)) {
    if (room.name.trim()) continue;
    const label = room.roomType ? roomTypeLabel(room.roomType as RoomType) : 'Bedroom';
    callbacks.onUpdateRoom(room.id, { name: label });
    results.push({
      issueId: `room-name-${room.id}`,
      applied: true,
      description: `Labelled bedroom ${room.id} as "${label}".`,
    });
  }

  return results;
}

export function repairMissingRooms(callbacks: ArchitectureBotCallbacks): RepairActionResult[] {
  if (!callbacks.onDetectAllRooms) return [];

  const count = callbacks.onDetectAllRooms();
  if (count === 0) {
    return [
      {
        issueId: 'structure-missing-rooms',
        applied: false,
        description: 'No enclosed rooms found to detect.',
      },
    ];
  }

  return [
    {
      issueId: 'structure-missing-rooms',
      applied: true,
      description: `Detected ${count} room${count === 1 ? '' : 's'}.`,
    },
  ];
}

export function repairMissingJurisdiction(
  manifest: ProjectManifest,
  callbacks: ArchitectureBotCallbacks,
): RepairActionResult[] {
  if (manifest.jurisdiction || !callbacks.onSetJurisdiction) return [];

  callbacks.onSetJurisdiction('au');
  return [
    {
      issueId: 'structure-missing-jurisdiction',
      applied: true,
      description: 'Set locale to Australia (NCC).',
    },
  ];
}

export function repairGovernanceState(callbacks: ArchitectureBotCallbacks): RepairActionResult[] {
  if (!callbacks.onRepairGovernanceState) return [];

  const count = callbacks.onRepairGovernanceState();
  if (count === 0) return [];

  return [
    {
      issueId: 'governance-localStorage',
      applied: true,
      description: `Initialized ${count} session setting${count === 1 ? '' : 's'}.`,
    },
  ];
}

export function repairIssue(
  issue: ArchitectureIssue,
  manifest: ProjectManifest,
  callbacks: ArchitectureBotCallbacks,
): RepairActionResult[] {
  if (isCopilotEscalation(issue.ruleId ?? '')) {
    return [
      {
        issueId: issue.id,
        applied: false,
        description: issue.message,
        escalated: true,
      },
    ];
  }

  switch (issue.ruleId) {
    case 'ncc-habitable-height':
    case 'nbc-habitable-height':
      return repairWallHeights(manifest, callbacks);
    case 'access-door-width':
      return repairDoorWidths(manifest, callbacks);
    case 'fire-smoke-alarm-zone':
      return repairUnnamedBedrooms(manifest, callbacks);
    case 'structure-missing-rooms':
      return repairMissingRooms(callbacks);
    case 'structure-missing-jurisdiction':
      return repairMissingJurisdiction(manifest, callbacks);
    case 'governance-localStorage':
      return repairGovernanceState(callbacks);
    default:
      if (issue.autoFixable) {
        return [
          {
            issueId: issue.id,
            applied: false,
            description: `No automatic repair for ${issue.ruleId ?? issue.id}.`,
          },
        ];
      }
      return [];
  }
}
