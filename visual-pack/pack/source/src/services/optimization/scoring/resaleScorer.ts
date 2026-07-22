import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { ScorerResult } from '@/services/optimization/scoring/scorerTypes';

export function scoreResale(building: GeneratedBuilding): ScorerResult {
  const { request, floorPlan } = building;
  const bedrooms = floorPlan.rooms.filter((r) => r.type === 'Bedroom' || r.type === 'MasterBedroom').length;
  const bathrooms = floorPlan.rooms.filter(
    (r) => r.type === 'Bathroom' || r.type === 'Ensuite',
  ).length;
  const hasGarage = floorPlan.rooms.some((r) => r.type === 'Garage');
  const hasEnsuite = floorPlan.rooms.some((r) => r.type === 'Ensuite');

  let score = 50;
  if (bedrooms >= 3 && bedrooms <= 4) score += 15;
  else if (bedrooms >= 2) score += 8;
  if (bathrooms >= 2) score += 12;
  if (hasGarage) score += 10;
  if (hasEnsuite) score += 8;
  if (request.garageSpaces >= 2) score += 5;
  score = Math.min(100, score);

  return {
    score,
    explanation: {
      summary: `${bedrooms}-bedroom, ${bathrooms}-bathroom program with ${hasGarage ? 'garage' : 'no garage'} aligns with broad resale demand.`,
      metrics: { bedrooms, bathrooms, hasGarage: hasGarage ? 1 : 0, hasEnsuite: hasEnsuite ? 1 : 0 },
    },
  };
}
