import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import { validateManifest } from '@/core/manifestSchema';

export function validateGeneratedBuilding(building: GeneratedBuilding): string[] {
  const errors: string[] = [];
  if (building.floorPlan.walls.length < 4) errors.push('floor plan needs at least 4 walls');
  if (building.floorPlan.rooms.length < 3) errors.push('floor plan needs at least 3 rooms');

  const manifestCheck = validateManifest(building.manifest);
  if (!manifestCheck.valid) {
    errors.push(...manifestCheck.errors.map((e) => e.message));
  }

  return errors;
}
