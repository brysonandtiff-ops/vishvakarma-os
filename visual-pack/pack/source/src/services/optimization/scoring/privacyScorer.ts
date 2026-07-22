import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { ScorerResult } from '@/services/optimization/scoring/scorerTypes';

const PRIVATE_TYPES = new Set(['MasterBedroom', 'Bedroom', 'Ensuite', 'Bathroom']);
const PUBLIC_TYPES = new Set(['Living', 'Dining', 'Kitchen', 'Entry', 'Garage']);

export function scorePrivacy(building: GeneratedBuilding): ScorerResult {
  const { floorPlan } = building;
  const privateRooms = floorPlan.rooms.filter((r) => PRIVATE_TYPES.has(r.type));
  const publicRooms = floorPlan.rooms.filter((r) => PUBLIC_TYPES.has(r.type));

  if (privateRooms.length === 0) {
    return {
      score: 50,
      explanation: { summary: 'No private zones detected.', metrics: { privateCount: 0 } },
    };
  }

  const privateCentroid = {
    x: privateRooms.reduce((s, r) => s + r.x + r.width / 2, 0) / privateRooms.length,
    y: privateRooms.reduce((s, r) => s + r.y + r.depth / 2, 0) / privateRooms.length,
  };
  const publicCentroid = publicRooms.length
    ? {
        x: publicRooms.reduce((s, r) => s + r.x + r.width / 2, 0) / publicRooms.length,
        y: publicRooms.reduce((s, r) => s + r.y + r.depth / 2, 0) / publicRooms.length,
      }
    : privateCentroid;

  const separation = Math.hypot(
    privateCentroid.x - publicCentroid.x,
    privateCentroid.y - publicCentroid.y,
  );
  const separationM = separation / 20;
  const score = Math.min(100, Math.round(55 + separationM * 8));

  return {
    score,
    explanation: {
      summary: `Bedroom cluster is ${separationM.toFixed(1)}m from public zones, supporting acoustic and visual privacy.`,
      metrics: {
        separationM: Math.round(separationM * 10) / 10,
        privateRoomCount: privateRooms.length,
        publicRoomCount: publicRooms.length,
      },
    },
  };
}
