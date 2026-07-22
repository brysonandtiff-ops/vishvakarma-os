import type { ProjectJurisdiction } from '@/domain/projects/jurisdiction';
import type { RegionalCostIndex } from '@/domain/cost/types';

export const DEFAULT_REGION_ID = 'au-national';

export const REGIONAL_INDICES: RegionalCostIndex[] = [
  {
    regionId: 'au-national',
    label: 'Australia (national baseline)',
    jurisdiction: 'au',
    currency: 'AUD',
    materialMultiplier: 1,
    laborMultiplier: 1,
    volatility: 0.12,
  },
  {
    regionId: 'au-nsw-sydney',
    label: 'NSW — Sydney metro',
    jurisdiction: 'au',
    currency: 'AUD',
    materialMultiplier: 1.14,
    laborMultiplier: 1.18,
    volatility: 0.18,
  },
  {
    regionId: 'au-vic-melbourne',
    label: 'VIC — Melbourne metro',
    jurisdiction: 'au',
    currency: 'AUD',
    materialMultiplier: 1.1,
    laborMultiplier: 1.14,
    volatility: 0.16,
  },
  {
    regionId: 'au-qld-brisbane',
    label: 'QLD — Brisbane metro',
    jurisdiction: 'au',
    currency: 'AUD',
    materialMultiplier: 1.06,
    laborMultiplier: 1.1,
    volatility: 0.14,
  },
  {
    regionId: 'au-nsw-regional',
    label: 'NSW — Regional',
    jurisdiction: 'au',
    currency: 'AUD',
    materialMultiplier: 1.02,
    laborMultiplier: 1.04,
    volatility: 0.1,
  },
  {
    regionId: 'au-vic-regional',
    label: 'VIC — Regional',
    jurisdiction: 'au',
    currency: 'AUD',
    materialMultiplier: 1.01,
    laborMultiplier: 1.03,
    volatility: 0.1,
  },
  {
    regionId: 'au-qld-regional',
    label: 'QLD — Regional',
    jurisdiction: 'au',
    currency: 'AUD',
    materialMultiplier: 0.98,
    laborMultiplier: 1,
    volatility: 0.09,
  },
  {
    regionId: 'in-national',
    label: 'India (national baseline)',
    jurisdiction: 'in',
    currency: 'INR',
    materialMultiplier: 1,
    laborMultiplier: 1,
    volatility: 0.14,
  },
  {
    regionId: 'in-mumbai',
    label: 'Maharashtra — Mumbai metro',
    jurisdiction: 'in',
    currency: 'INR',
    materialMultiplier: 1.18,
    laborMultiplier: 1.22,
    volatility: 0.2,
  },
  {
    regionId: 'in-bengaluru',
    label: 'Karnataka — Bengaluru metro',
    jurisdiction: 'in',
    currency: 'INR',
    materialMultiplier: 1.12,
    laborMultiplier: 1.16,
    volatility: 0.18,
  },
  {
    regionId: 'in-delhi-ncr',
    label: 'Delhi NCR',
    jurisdiction: 'in',
    currency: 'INR',
    materialMultiplier: 1.15,
    laborMultiplier: 1.2,
    volatility: 0.19,
  },
  {
    regionId: 'in-hyderabad',
    label: 'Telangana — Hyderabad metro',
    jurisdiction: 'in',
    currency: 'INR',
    materialMultiplier: 1.08,
    laborMultiplier: 1.12,
    volatility: 0.16,
  },
  {
    regionId: 'in-chennai',
    label: 'Tamil Nadu — Chennai metro',
    jurisdiction: 'in',
    currency: 'INR',
    materialMultiplier: 1.1,
    laborMultiplier: 1.14,
    volatility: 0.17,
  },
  {
    regionId: 'in-kolkata',
    label: 'West Bengal — Kolkata metro',
    jurisdiction: 'in',
    currency: 'INR',
    materialMultiplier: 1.05,
    laborMultiplier: 1.08,
    volatility: 0.15,
  },
];

export const REGIONAL_INDICES_BY_ID = new Map(
  REGIONAL_INDICES.map((region) => [region.regionId, region]),
);

export function getRegionsForJurisdiction(jurisdiction: ProjectJurisdiction): RegionalCostIndex[] {
  return REGIONAL_INDICES.filter((r) => r.jurisdiction === jurisdiction);
}
