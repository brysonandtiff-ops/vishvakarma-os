import {
  DEFAULT_REGION_ID,
  REGIONAL_INDICES_BY_ID,
} from '@/data/cost/regionalIndices';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import type { RegionalCostIndex } from '@/domain/cost/types';

export function getRegionById(regionId: string): RegionalCostIndex {
  return REGIONAL_INDICES_BY_ID.get(regionId) ?? REGIONAL_INDICES_BY_ID.get(DEFAULT_REGION_ID)!;
}

export function resolveRegion(
  request: BuildingRequest,
  council?: CouncilRequirements,
): RegionalCostIndex {
  const hints = [
    council?.rawText ?? '',
    council?.councilName ?? '',
    request.parcel.orientation ?? '',
  ]
    .join(' ')
    .toLowerCase();

  if (hints.includes('sydney') || hints.includes('nsw')) {
    return getRegionById('au-nsw-sydney');
  }
  if (hints.includes('melbourne') || hints.includes('vic')) {
    return getRegionById('au-vic-melbourne');
  }
  if (hints.includes('brisbane') || hints.includes('qld')) {
    return getRegionById('au-qld-brisbane');
  }
  if (hints.includes('regional')) {
    if (hints.includes('nsw')) return getRegionById('au-nsw-regional');
    if (hints.includes('vic')) return getRegionById('au-vic-regional');
    if (hints.includes('qld')) return getRegionById('au-qld-regional');
  }

  if (request.parcel.slope > 5) {
    return getRegionById('au-nsw-regional');
  }

  return getRegionById(DEFAULT_REGION_ID);
}

export function applyRegionalMultiplier(
  baseCost: number,
  region: RegionalCostIndex,
  type: 'material' | 'labor',
): number {
  const multiplier = type === 'material' ? region.materialMultiplier : region.laborMultiplier;
  return Math.round(baseCost * multiplier);
}
