import { analyzeThermal } from '@/core/simulations/thermalEngine';
import { analyzePanchatattva } from '@/core/simulations/panchatattva';
import type { CastIntentEvent, CastIntentEventType } from '@/cast/types';
import type { LightingConfig, ProjectManifest } from '@/types';

let intentCounter = 0;

function nextIntentId(): string {
  intentCounter += 1;
  return `intent-${Date.now()}-${intentCounter}`;
}

function wallSignature(manifest: ProjectManifest): string {
  return manifest.walls
    .map((w) => `${w.id}:${w.start.x},${w.start.y}-${w.end.x},${w.end.y}`)
    .sort()
    .join('|');
}

function openingCount(manifest: ProjectManifest): number {
  return manifest.openings.length;
}

function lightingSignature(lighting: LightingConfig): string {
  return `${lighting.timeOfDay}:${lighting.sunAzimuth}:${lighting.sunElevation}:${lighting.intensity}`;
}

export interface ManifestDiffSnapshot {
  wallSig: string;
  openingCount: number;
  roomCount: number;
  lightingSig: string;
  vastuScore: number;
  thermalScore: number;
  panchatattvaScore: number;
}

export function snapshotManifestForDiff(manifest: ProjectManifest): ManifestDiffSnapshot {
  const thermal = analyzeThermal(manifest);
  const panchatattva = analyzePanchatattva(manifest);
  return {
    wallSig: wallSignature(manifest),
    openingCount: openingCount(manifest),
    roomCount: manifest.rooms?.length ?? 0,
    lightingSig: lightingSignature(manifest.lighting),
    vastuScore: panchatattva.balancePercent,
    thermalScore: thermal.overallComfort,
    panchatattvaScore: panchatattva.balancePercent,
  };
}

export function diffManifestIntents(
  before: ManifestDiffSnapshot,
  after: ManifestDiffSnapshot,
  manifest: ProjectManifest
): CastIntentEvent[] {
  const events: CastIntentEvent[] = [];
  const scores = {
    vastuDelta: after.panchatattvaScore - before.panchatattvaScore,
    thermalBefore: before.thermalScore,
    thermalAfter: after.thermalScore,
    panchatattvaBefore: before.panchatattvaScore,
    panchatattvaAfter: after.panchatattvaScore,
  };

  if (before.wallSig !== after.wallSig) {
    events.push({
      id: nextIntentId(),
      type: 'walls',
      message: `Wall geometry updated (${manifest.walls.length} walls)`,
      timestamp: Date.now(),
      scores,
    });
  }

  if (before.openingCount !== after.openingCount) {
    events.push({
      id: nextIntentId(),
      type: 'openings',
      message: `Openings changed (${before.openingCount} → ${after.openingCount})`,
      timestamp: Date.now(),
      scores,
    });
  }

  if (before.roomCount !== after.roomCount) {
    events.push({
      id: nextIntentId(),
      type: 'rooms',
      message: `Room count ${before.roomCount} → ${after.roomCount}`,
      timestamp: Date.now(),
      scores,
    });
  }

  if (before.lightingSig !== after.lightingSig) {
    const t = manifest.lighting.timeOfDay;
    const hours = Math.floor(t);
    const mins = String(Math.round((t % 1) * 60)).padStart(2, '0');
    events.push({
      id: nextIntentId(),
      type: 'lighting',
      message: `Solar study adjusted to ${hours}:${mins}, azimuth ${Math.round(manifest.lighting.sunAzimuth)}°`,
      timestamp: Date.now(),
    });
  }

  if (events.length === 0) return events;

  const deltaParts: string[] = [];
  if (scores.panchatattvaBefore !== undefined && scores.panchatattvaAfter !== undefined) {
    const delta = scores.panchatattvaAfter - scores.panchatattvaBefore;
    if (delta !== 0) deltaParts.push(`Panchatattva ${delta > 0 ? '+' : ''}${delta}%`);
  }
  if (scores.thermalBefore !== undefined && scores.thermalAfter !== undefined && scores.thermalBefore !== scores.thermalAfter) {
    deltaParts.push(`thermal ${scores.thermalBefore}→${scores.thermalAfter}%`);
  }

  if (deltaParts.length > 0 && events[0]) {
    events[0] = {
      ...events[0],
      message: `${events[0].message} → ${deltaParts.join(', ')}`,
    };
  }

  return events;
}

export function formatIntentType(type: CastIntentEventType): string {
  switch (type) {
    case 'walls':
      return 'Structure';
    case 'openings':
      return 'Openings';
    case 'lighting':
      return 'Solar';
    case 'rooms':
      return 'Rooms';
    default:
      return 'Design';
  }
}
