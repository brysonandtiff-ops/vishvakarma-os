import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import { analyzeThermal } from '@/core/simulations/thermalEngine';
import type { ScorerResult } from '@/services/optimization/scoring/scorerTypes';

export function scoreEnergy(building: GeneratedBuilding): ScorerResult {
  const thermal = analyzeThermal(building.manifest);
  const score = thermal.overallComfort;

  return {
    score,
    explanation: {
      summary: `Thermal comfort score ${score}/100 based on wall R-values and solar exposure.`,
      metrics: {
        overallComfort: score,
        avgRValue: Math.round(thermal.rooms[0]?.rValue ?? 2),
        roomCount: thermal.rooms.length,
      },
    },
  };
}
