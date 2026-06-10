import type { BuildingRequest } from '@/domain/buildings/buildingRequest';

export function validateBuildingRequest(request: BuildingRequest): string[] {
  const errors: string[] = [];
  if (request.bedrooms < 1 || request.bedrooms > 8) errors.push('bedrooms must be 1–8');
  if (request.bathrooms < 1 || request.bathrooms > 6) errors.push('bathrooms must be 1–6');
  if (request.garageSpaces < 0 || request.garageSpaces > 4) errors.push('garageSpaces must be 0–4');
  if (request.levels < 1 || request.levels > 3) errors.push('levels must be 1–3');
  if (request.parcel.area < 100) errors.push('parcel area too small');
  return errors;
}
