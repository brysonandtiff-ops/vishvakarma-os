import { CANVAS_ORIGIN_X, CANVAS_ORIGIN_Y, PX_PER_METER } from '@/domain/constants';
import type { RoomPlacement } from '@/domain/buildings/generatedBuilding';
import type { LayoutSolverOptions, PackingStrategy } from '@/planning/types';
import type { OptimizationStrategy } from '@/domain/optimization/types';
import type { Point2D } from '@/types';
import {
  buildAdjacencyWeights,
  scoreAdjacency,
  sortRoomsForPlacement,
} from '@/ai/building-designer/generators/adjacencySolver';
import type { ConstraintResult, RoomSpec } from '@/ai/building-designer/generators/constraintEngine';

const ROOM_GAP_PX = 2;

function metersToPx(m: number) {
  return Math.round(m * PX_PER_METER);
}

function mergeLayoutOptions(
  strategy?: OptimizationStrategy,
  options?: LayoutSolverOptions,
): Required<LayoutSolverOptions> {
  return {
    seed: options?.seed ?? strategy?.layoutSeed ?? 0,
    packingStrategy: options?.packingStrategy ?? 'row',
    originOffsetX: options?.originOffsetX ?? 0,
    originOffsetY: options?.originOffsetY ?? 0,
    rotationDeg: options?.rotationDeg ?? 0,
    attemptBudget: options?.attemptBudget ?? (strategy ? 12 : 6),
  };
}

function placementScore(
  candidate: RoomPlacement,
  placed: RoomPlacement[],
  specs: RoomSpec[],
  weights: ReturnType<typeof buildAdjacencyWeights>,
  strategy?: OptimizationStrategy,
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
    if (a && b) score += scoreAdjacency(a, b, weights);
  }

  if (strategy?.northernLivingBias && specById.get(candidate.id)?.type === 'Living') {
    const northernBonus = Math.max(0, (CANVAS_ORIGIN_Y + metersToPx(2) - candidate.y) / 10);
    score += northernBonus;
  }

  if (strategy?.wetAreaStacking) {
    const type = specById.get(candidate.id)?.type;
    if (type === 'Bathroom' || type === 'Ensuite' || type === 'Laundry') {
      const wetNeighbors = placed.filter((p) => {
        const t = specById.get(p.id)?.type;
        return t === 'Bathroom' || t === 'Ensuite' || t === 'Laundry';
      });
      score += wetNeighbors.length * 3;
    }
  }

  return score;
}

function isPublicRoom(type: RoomSpec['type']) {
  return type === 'Living' || type === 'Dining' || type === 'Kitchen' || type === 'Entry';
}

function sortForPacking(rooms: RoomSpec[], strategy: PackingStrategy, optStrategy?: OptimizationStrategy): RoomSpec[] {
  const base = sortRoomsForPlacement(rooms, optStrategy);
  if (strategy === 'clusterPublic') {
    return [...base].sort((a, b) => {
      const aPublic = isPublicRoom(a.type) ? 0 : 1;
      const bPublic = isPublicRoom(b.type) ? 0 : 1;
      return aPublic - bPublic;
    });
  }
  if (strategy === 'clusterPrivate') {
    return [...base].sort((a, b) => {
      const aPrivate =
        a.type === 'MasterBedroom' || a.type === 'Bedroom' || a.type === 'Ensuite' || a.type === 'Bathroom' ? 0 : 1;
      const bPrivate =
        b.type === 'MasterBedroom' || b.type === 'Bedroom' || b.type === 'Ensuite' || b.type === 'Bathroom' ? 0 : 1;
      return aPrivate - bPrivate;
    });
  }
  if (strategy === 'column') {
    return [...base].reverse();
  }
  return base;
}

function rotatePlacement(
  rooms: RoomPlacement[],
  footprintW: number,
  footprintD: number,
  originX: number,
  originY: number,
): RoomPlacement[] {
  const cx = originX + footprintW / 2;
  const cy = originY + footprintD / 2;

  return rooms.map((room) => {
    const rcx = room.x + room.width / 2;
    const rcy = room.y + room.depth / 2;
    const dx = rcx - cx;
    const dy = rcy - cy;
    const newWidth = room.depth;
    const newDepth = room.width;
    const newCenterX = cx - dy;
    const newCenterY = cy + dx;
    return {
      ...room,
      x: newCenterX - newWidth / 2,
      y: newCenterY - newDepth / 2,
      width: newWidth,
      depth: newDepth,
    };
  });
}

export function solveLayout(
  constraints: ConstraintResult,
  strategy?: OptimizationStrategy,
  layoutOptions?: LayoutSolverOptions,
): {
  rooms: RoomPlacement[];
  circulation: Point2D[];
} {
  const opts = mergeLayoutOptions(strategy, layoutOptions);
  const weights = buildAdjacencyWeights(undefined, strategy);
  const sorted = sortForPacking(constraints.rooms, opts.packingStrategy, strategy);
  const footprintW = metersToPx(constraints.footprintWidthM);
  const footprintD = metersToPx(constraints.footprintDepthM);
  const originX = CANVAS_ORIGIN_X + opts.originOffsetX;
  const originY = CANVAS_ORIGIN_Y + opts.originOffsetY;

  const placed: RoomPlacement[] = [];
  let cursorX = originX + (opts.seed % 3) * 4;
  let cursorY = originY + (opts.seed % 5) * 3;
  let rowHeight = 0;

  for (const spec of sorted) {
    const width = metersToPx(spec.widthM);
    const depth = metersToPx(spec.depthM);
    const candidates: RoomPlacement[] = [];

    for (let attempt = 0; attempt < opts.attemptBudget; attempt += 1) {
      let x = cursorX;
      let y = cursorY;

      if (opts.packingStrategy === 'column') {
        x = cursorX;
        y = cursorY;
        if (y + depth > originY + footprintD) {
          x = cursorX + rowHeight + ROOM_GAP_PX;
          y = originY;
        }
      } else if (x + width > originX + footprintW) {
        x = originX;
        y = cursorY + rowHeight + ROOM_GAP_PX;
      }

      if (y + depth > originY + footprintD) {
        const offset = attempt + opts.seed;
        x = originX + (offset * 40) % Math.max(40, footprintW - width);
        y = originY + (offset * 30) % Math.max(30, footprintD - depth);
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
      (a, b) =>
        placementScore(b, placed, constraints.rooms, weights, strategy) -
        placementScore(a, placed, constraints.rooms, weights, strategy),
    )[0];

    placed.push(best);

    if (opts.packingStrategy === 'column') {
      cursorY = best.y + best.depth + ROOM_GAP_PX;
      cursorX = best.x;
      rowHeight = Math.max(rowHeight, best.width);
      if (cursorY + metersToPx(2) > originY + footprintD) {
        cursorY = originY;
        cursorX = best.x + best.width + ROOM_GAP_PX;
        rowHeight = 0;
      }
    } else {
      cursorX = best.x + best.width + ROOM_GAP_PX;
      cursorY = best.y;
      rowHeight = Math.max(rowHeight, best.depth);
      if (cursorX + metersToPx(2) > originX + footprintW) {
        cursorX = originX;
        cursorY = best.y + best.depth + ROOM_GAP_PX;
        rowHeight = 0;
      }
    }
  }

  let finalRooms = placed;
  if (opts.rotationDeg === 90) {
    finalRooms = rotatePlacement(placed, footprintW, footprintD, originX, originY);
  }

  const hallway = finalRooms.find((r) => r.type === 'Hallway');
  const circulation: Point2D[] = hallway
    ? [
        { x: hallway.x + hallway.width / 2, y: hallway.y },
        { x: hallway.x + hallway.width / 2, y: hallway.y + hallway.depth },
      ]
    : [];

  return { rooms: finalRooms, circulation };
}
