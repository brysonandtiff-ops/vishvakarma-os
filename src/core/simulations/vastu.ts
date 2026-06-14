import type { Label, Opening, Point2D, ProjectManifest, Wall } from '@/types';

export type VastuDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export const VASTU_DIRECTIONS: VastuDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export interface VastuDirectionScore {
  direction: VastuDirection;
  score: number;
  tip: string;
}

export interface VastuRoomPlacement {
  label: string;
  direction: VastuDirection;
  idealDirections: VastuDirection[];
  score: number;
}

export interface VastuAnalysisResult {
  harmonyPercent: number;
  entranceScore: number;
  kitchenScore: number;
  bedroomScore: number;
  pujaScore: number;
  directions: VastuDirectionScore[];
  roomPlacements: VastuRoomPlacement[];
  tips: string[];
}

/** Ideal Vastu sectors for common room types (decision-support heuristics). */
const IDEAL_BY_ROOM: { pattern: RegExp; ideal: VastuDirection[]; label: string }[] = [
  { pattern: /kitchen/i, ideal: ['SE', 'NW'], label: 'Kitchen' },
  { pattern: /master|bed/i, ideal: ['SW', 'S'], label: 'Bedroom' },
  { pattern: /puja|mandir|prayer/i, ideal: ['NE'], label: 'Puja' },
  { pattern: /living|hall/i, ideal: ['N', 'NE', 'E'], label: 'Living' },
  { pattern: /bath|toilet|wc/i, ideal: ['W', 'NW'], label: 'Bathroom' },
  { pattern: /study|office/i, ideal: ['W', 'NW'], label: 'Study' },
  { pattern: /courtyard|open/i, ideal: ['N', 'E'], label: 'Courtyard' },
];

const ENTRANCE_FAVORABLE: VastuDirection[] = ['N', 'NE', 'E'];

function centroid(walls: Wall[]): Point2D {
  if (walls.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const w of walls) {
    sx += w.start.x + w.end.x;
    sy += w.start.y + w.end.y;
    n += 2;
  }
  return { x: sx / n, y: sy / n };
}

function normalizeDegrees(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

/**
 * Map a plan point to one of eight Vastu directions relative to centroid and north bearing.
 * Screen Y increases downward; north bearing 0° aligns plan north with screen-up.
 */
export function pointToVastuDirection(
  point: Point2D,
  center: Point2D,
  northOrientationDeg = 0,
): VastuDirection {
  const dx = point.x - center.x;
  const dy = center.y - point.y;
  const angleFromEast = (Math.atan2(dy, dx) * 180) / Math.PI;
  const vastuAngle = normalizeDegrees(angleFromEast - 90 + northOrientationDeg);
  const sector = Math.floor((vastuAngle + 22.5) / 45) % 8;
  return VASTU_DIRECTIONS[sector];
}

function openingWorldPosition(opening: Opening, walls: Wall[]): Point2D | null {
  const wall = walls.find((w) => w.id === opening.wallId);
  if (!wall) return null;
  const t = opening.position;
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * t,
    y: wall.start.y + (wall.end.y - wall.start.y) * t,
  };
}

function mainEntranceDirection(
  openings: Opening[],
  walls: Wall[],
  center: Point2D,
  northOrientation: number,
): VastuDirection {
  const doors = openings.filter((o) => o.type === 'door');
  if (doors.length === 0) return 'E';
  const pos = openingWorldPosition(doors[0], walls);
  if (!pos) return 'E';
  return pointToVastuDirection(pos, center, northOrientation);
}

function scoreDirectionPlacement(actual: VastuDirection, ideal: VastuDirection[]): number {
  if (ideal.includes(actual)) return 92;
  const actualIdx = VASTU_DIRECTIONS.indexOf(actual);
  const minOffset = Math.min(
    ...ideal.map((d) => {
      const idealIdx = VASTU_DIRECTIONS.indexOf(d);
      const diff = Math.abs(actualIdx - idealIdx);
      return Math.min(diff, 8 - diff);
    }),
  );
  if (minOffset <= 1) return 72;
  if (minOffset <= 2) return 58;
  return 42;
}

function classifyLabel(text: string): (typeof IDEAL_BY_ROOM)[number] | null {
  return IDEAL_BY_ROOM.find((entry) => entry.pattern.test(text)) ?? null;
}

function buildRoomPlacements(
  labels: Label[],
  center: Point2D,
  northOrientation: number,
): VastuRoomPlacement[] {
  return labels
    .map((label) => {
      const rule = classifyLabel(label.text);
      if (!rule) return null;
      const direction = pointToVastuDirection(label.position, center, northOrientation);
      const score = scoreDirectionPlacement(direction, rule.ideal);
      return {
        label: label.text,
        direction,
        idealDirections: rule.ideal,
        score,
      };
    })
    .filter((p): p is VastuRoomPlacement => p !== null);
}

function scoreDirections(
  entrance: VastuDirection,
  placements: VastuRoomPlacement[],
): VastuDirectionScore[] {
  const occupied = new Map<VastuDirection, VastuRoomPlacement[]>();
  for (const p of placements) {
    const list = occupied.get(p.direction) ?? [];
    list.push(p);
    occupied.set(p.direction, list);
  }

  return VASTU_DIRECTIONS.map((direction) => {
    let score = 62;
    if (direction === entrance) score += ENTRANCE_FAVORABLE.includes(direction) ? 18 : 8;
    const roomsHere = occupied.get(direction) ?? [];
    if (roomsHere.length > 0) {
      const avg = roomsHere.reduce((sum, r) => sum + r.score, 0) / roomsHere.length;
      score = Math.round((score + avg) / 2);
    }
    return {
      direction,
      score: Math.min(100, Math.max(0, Math.round(score))),
      tip: `${direction} zone ${score >= 70 ? 'favorable' : 'review placement'}`,
    };
  });
}

function buildTips(
  manifest: Pick<ProjectManifest, 'openings' | 'labels'>,
  entrance: VastuDirection,
  placements: VastuRoomPlacement[],
): string[] {
  const tips: string[] = [];
  const labels = manifest.labels ?? [];

  const kitchen = placements.find((p) => /kitchen/i.test(p.label));
  if (!kitchen && !labels.some((l) => /kitchen/i.test(l.text))) {
    tips.push('Label kitchen in SE or NW for improved Agni balance.');
  } else if (kitchen && kitchen.score < 70) {
    tips.push(`Move Kitchen toward ${kitchen.idealDirections.join(' or ')} (currently ${kitchen.direction}).`);
  }

  const bedroom = placements.find((p) => /bed|master/i.test(p.label));
  if (!bedroom && !labels.some((l) => /bed|master/i.test(l.text))) {
    tips.push('Place master bedroom in SW for stability.');
  } else if (bedroom && bedroom.score < 70) {
    tips.push(`Move ${bedroom.label} toward ${bedroom.idealDirections.join(' or ')} (currently ${bedroom.direction}).`);
  }

  const puja = placements.find((p) => /puja|mandir|prayer/i.test(p.label));
  if (!puja && !labels.some((l) => /puja|mandir|prayer/i.test(l.text))) {
    tips.push('Add a Puja/Mandir label in NE for spiritual balance.');
  } else if (puja && puja.score < 70) {
    tips.push(`Move Puja space toward NE (currently ${puja.direction}).`);
  }

  if (manifest.openings.filter((o) => o.type === 'door').length === 0) {
    tips.push('Add a main entrance door to score entry direction.');
  } else if (!ENTRANCE_FAVORABLE.includes(entrance)) {
    tips.push(`Main entrance faces ${entrance} — N, NE, or E entries are traditionally favorable.`);
  }

  return tips;
}

export function analyzeVastu(
  manifest: Pick<ProjectManifest, 'walls' | 'openings' | 'labels' | 'northOrientation'>,
): VastuAnalysisResult {
  const walls = manifest.walls ?? [];
  const labels = manifest.labels ?? [];
  const northOrientation = manifest.northOrientation ?? 0;
  const center = centroid(walls);
  const entrance = mainEntranceDirection(manifest.openings ?? [], walls, center, northOrientation);
  const roomPlacements = buildRoomPlacements(labels, center, northOrientation);
  const directions = scoreDirections(entrance, roomPlacements);

  const harmonyPercent = Math.round(
    directions.reduce((sum, d) => sum + d.score, 0) / directions.length,
  );

  const kitchenPlacement = roomPlacements.find((p) => /kitchen/i.test(p.label));
  const bedroomPlacement = roomPlacements.find((p) => /bed|master/i.test(p.label));
  const pujaPlacement = roomPlacements.find((p) => /puja|mandir|prayer/i.test(p.label));

  const entranceScore = directions.find((d) => d.direction === entrance)?.score ?? 60;
  const kitchenScore = kitchenPlacement?.score ?? (labels.some((l) => /kitchen/i.test(l.text)) ? 78 : 52);
  const bedroomScore = bedroomPlacement?.score ?? (labels.some((l) => /bed|master/i.test(l.text)) ? 80 : 50);
  const pujaScore = pujaPlacement?.score ?? (labels.some((l) => /puja|mandir/i.test(l.text)) ? 85 : 48);

  const tips = buildTips(manifest, entrance, roomPlacements);

  return {
    harmonyPercent,
    entranceScore,
    kitchenScore,
    bedroomScore,
    pujaScore,
    directions,
    roomPlacements,
    tips,
  };
}

export function getVastuPlanCentroid(manifest: Pick<ProjectManifest, 'walls'>): Point2D {
  return centroid(manifest.walls ?? []);
}
