import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { ScorerResult } from '@/services/optimization/scoring/scorerTypes';

export function scoreNaturalLight(building: GeneratedBuilding): ScorerResult {
  const { floorPlan, request } = building;
  const windows = floorPlan.openings.filter((o) => o.type === 'window');
  const living = floorPlan.rooms.find((r) => r.type === 'Living');
  const totalWallLength = floorPlan.walls.reduce(
    (s, w) => s + Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y),
    0,
  );
  const glazingRatio = totalWallLength > 0 ? (windows.length * 40) / totalWallLength : 0;
  const orientation = request.parcel.orientation?.toUpperCase() ?? 'N';
  const northernBonus = /N/.test(orientation) && living ? 12 : 0;
  const livingWindows = living
    ? windows.filter((w) => {
        const wall = floorPlan.walls.find((wl) => wl.id === w.wallId);
        if (!wall) return false;
        const midY = (wall.start.y + wall.end.y) / 2;
        return Math.abs(midY - living.y) < living.depth + 20;
      }).length
    : 0;

  const base = Math.min(100, Math.round(50 + glazingRatio * 120 + northernBonus + livingWindows * 5));
  const score = Math.max(0, base);

  return {
    score,
    explanation: {
      summary: `Living areas receive ${Math.round(glazingRatio * 100)}% glazing ratio with ${livingWindows} living-zone window(s) on a ${orientation}-oriented site.`,
      metrics: {
        glazingRatioPercent: Math.round(glazingRatio * 100),
        livingWindows,
        totalWindows: windows.length,
        northernBonus,
      },
    },
  };
}
