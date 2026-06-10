import type { RegionalCostIndex } from '@/domain/cost/types';

export const DEFAULT_REGION_ID = 'au-national';

export const REGIONAL_INDICES: RegionalCostIndex[] = [
  {
    regionId: 'au-national',
    label: 'Australia (national baseline)',
    materialMultiplier: 1,
    laborMultiplier: 1,
    volatility: 0.12,
  },
  {
    regionId: 'au-nsw-sydney',
    label: 'NSW — Sydney metro',
    materialMultiplier: 1.14,
    laborMultiplier: 1.18,
    volatility: 0.18,
  },
  {
    regionId: 'au-vic-melbourne',
    label: 'VIC — Melbourne metro',
    materialMultiplier: 1.1,
    laborMultiplier: 1.14,
    volatility: 0.16,
  },
  {
    regionId: 'au-qld-brisbane',
    label: 'QLD — Brisbane metro',
    materialMultiplier: 1.06,
    laborMultiplier: 1.1,
    volatility: 0.14,
  },
  {
    regionId: 'au-nsw-regional',
    label: 'NSW — Regional',
    materialMultiplier: 1.02,
    laborMultiplier: 1.04,
    volatility: 0.1,
  },
  {
    regionId: 'au-vic-regional',
    label: 'VIC — Regional',
    materialMultiplier: 1.01,
    laborMultiplier: 1.03,
    volatility: 0.1,
  },
  {
    regionId: 'au-qld-regional',
    label: 'QLD — Regional',
    materialMultiplier: 0.98,
    laborMultiplier: 1,
    volatility: 0.09,
  },
];

export const REGIONAL_INDICES_BY_ID = new Map(
  REGIONAL_INDICES.map((region) => [region.regionId, region]),
);
