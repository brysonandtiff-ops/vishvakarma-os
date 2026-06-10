import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { ScorerResult } from '@/services/optimization/scoring/scorerTypes';

const WET_TYPES = new Set(['Bathroom', 'Ensuite', 'Laundry']);

export function scoreBuildability(building: GeneratedBuilding): ScorerResult {
  const { floorPlan } = building;
  const wallCount = floorPlan.walls.length;
  const roomCount = floorPlan.rooms.length;
  const wetRooms = floorPlan.rooms.filter((r) => WET_TYPES.has(r.type));

  let stackedWet = 0;
  for (let i = 0; i < wetRooms.length; i += 1) {
    for (let j = i + 1; j < wetRooms.length; j += 1) {
      const a = wetRooms[i];
      const b = wetRooms[j];
      const touches =
        Math.abs(a.x + a.width - b.x) < 4 ||
        Math.abs(b.x + b.width - a.x) < 4 ||
        Math.abs(a.y + a.depth - b.y) < 4 ||
        Math.abs(b.y + b.depth - a.y) < 4;
      if (touches) stackedWet += 1;
    }
  }

  const complexityPenalty = Math.max(0, (wallCount - roomCount * 3) * 2);
  const stackBonus = stackedWet * 8;
  const score = Math.max(0, Math.min(100, Math.round(75 + stackBonus - complexityPenalty)));

  return {
    score,
    explanation: {
      summary:
        stackedWet > 0
          ? `${stackedWet} wet-area adjacency pair(s) enable stacked plumbing; ${wallCount} walls to construct.`
          : `${wallCount} walls across ${roomCount} rooms — moderate construction complexity.`,
      metrics: { wallCount, roomCount, stackedWetPairs: stackedWet },
    },
  };
}
