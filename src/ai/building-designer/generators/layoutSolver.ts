import { CANVAS_ORIGIN_X, CANVAS_ORIGIN_Y, PX_PER_METER } from '@/domain/constants';
import type { RoomPlacement } from '@/domain/buildings/generatedBuilding';
import type { Point2D } from '@/types';
import { scoreAdjacency, sortRoomsForPlacement } from '@/ai/building-designer/generators/adjacencySolver';
import type { ConstraintResult, RoomSpec } from '@/ai/building-designer/generators/constraintEngine';

const ROOM_GAP_PX = 2;

function metersToPx(m: number) {
  return Math.round(m * PX_PER_METER);
}

function placementScore(
  candidate: RoomPlacement,
  placed: RoomPlacement[],
  specs: RoomSpec[]
): number {
  let score = 0;
  const specById = new Map(specs.map((s) => [s.id, s]));

  for (const other of placed) {
    const touches =
      Math.abs(candidate.x + candidate.width - other.x) < 4 ||
      Math.abs(other.x + other.width - candidate.x) < 4 ||
      Math.abs(candidate.y + candidate.depth - other.y) < 4 ||
      Math.abs(other.y + other.depth - candidate.y) < 4;

    if (!touches) continue;

    const a = specById.get(candidate.id)?.type;
    const b = specById.get(other.id)?.type;
    if (a && b) score += scoreAdjacency(a, b);
  }

  return score;
}

export function solveLayout(constraints: ConstraintResult): {
  rooms: RoomPlacement[];
  circulation: Point2D[];
} {
  const sorted = sortRoomsForPlacement(constraints.rooms);
  const footprintW = metersToPx(constraints.footprintWidthM);
  const footprintD = metersToPx(constraints.footprintDepthM);
  const originX = CANVAS_ORIGIN_X;
  const originY = CANVAS_ORIGIN_Y;

  const placed: RoomPlacement[] = [];
  let cursorX = originX;
  let cursorY = originY;
  let rowHeight = 0;

  for (const spec of sorted) {
    const width = metersToPx(spec.widthM);
    const depth = metersToPx(spec.depthM);

    const candidates: RoomPlacement[] = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      let x = cursorX;
      let y = cursorY;

      if (x + width > originX + footprintW) {
        x = originX;
        y = cursorY + rowHeight + ROOM_GAP_PX;
      }

      if (y + depth > originY + footprintD) {
        x = originX + (attempt * 40) % Math.max(40, footprintW - width);
        y = originY + (attempt * 30) % Math.max(30, footprintD - depth);
      }

      candidates.push({
        id: spec.id,
        type: spec.type,
        label: spec.label,
        x,
        y,
        width,
        depth,
        floor: 0,
      });
    }

    const best = candidates.sort(
      (a, b) => placementScore(b, placed, constraints.rooms) - placementScore(a, placed, constraints.rooms)
    )[0];

    placed.push(best);

    cursorX = best.x + best.width + ROOM_GAP_PX;
    cursorY = best.y;
    rowHeight = Math.max(rowHeight, best.depth);

    if (cursorX + metersToPx(2) > originX + footprintW) {
      cursorX = originX;
      cursorY = best.y + best.depth + ROOM_GAP_PX;
      rowHeight = 0;
    }
  }

  const hallway = placed.find((r) => r.type === 'Hallway');
  const circulation: Point2D[] = hallway
    ? [
        { x: hallway.x + hallway.width / 2, y: hallway.y },
        { x: hallway.x + hallway.width / 2, y: hallway.y + hallway.depth },
      ]
    : [];

  return { rooms: placed, circulation };
}
