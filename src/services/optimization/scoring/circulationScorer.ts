import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import { computeVayuField } from '@/core/simulations/vayuCFD';
import type { ScorerResult } from '@/services/optimization/scoring/scorerTypes';

export function scoreCirculation(building: GeneratedBuilding): ScorerResult {
  const { floorPlan, architectureMap } = building;
  const hallway = floorPlan.rooms.find((r) => r.type === 'Hallway');
  const totalArea = floorPlan.rooms.reduce((s, r) => s + (r.width * r.depth) / 400, 0);
  const hallwayArea = hallway ? (hallway.width * hallway.depth) / 400 : 0;
  const hallwayPct = totalArea > 0 ? (hallwayArea / totalArea) * 100 : 0;
  const adjacencyWeight = architectureMap.edges.reduce((s, e) => s + Math.max(0, e.weight), 0);
  const cfd = computeVayuField(floorPlan.walls);
  const ventBonus = cfd.crossVentScore * 0.15;

  const hallwayPenalty = hallwayPct > 15 ? (hallwayPct - 15) * 2 : 0;
  const score = Math.max(
    0,
    Math.min(100, Math.round(60 + adjacencyWeight * 0.5 + ventBonus - hallwayPenalty)),
  );

  return {
    score,
    explanation: {
      summary:
        hallwayPct > 12
          ? `Corridor area is ${Math.round(hallwayPct)}% of floor area; adjacency graph weight ${Math.round(adjacencyWeight)} supports flow.`
          : `Efficient circulation with ${Math.round(hallwayPct)}% corridor area and strong adjacency connections.`,
      metrics: {
        hallwayAreaPercent: Math.round(hallwayPct),
        adjacencyWeight: Math.round(adjacencyWeight),
        crossVentScore: cfd.crossVentScore,
      },
    },
  };
}
