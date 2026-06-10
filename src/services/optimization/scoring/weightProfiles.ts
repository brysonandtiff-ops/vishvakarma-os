import type { OptimizationObjective, OptimizationScoreCategory } from '@/domain/optimization/types';

export type WeightProfile = Record<Exclude<OptimizationScoreCategory, 'overall'>, number>;

export const DEFAULT_WEIGHT_PROFILE: WeightProfile = {
  compliance: 0.15,
  construction_cost: 0.12,
  natural_light: 0.1,
  energy: 0.12,
  circulation: 0.1,
  privacy: 0.1,
  resale: 0.16,
  buildability: 0.15,
};

export const OBJECTIVE_WEIGHT_PROFILES: Record<OptimizationObjective, WeightProfile> = {
  family_focused: {
    compliance: 0.12,
    construction_cost: 0.1,
    natural_light: 0.12,
    energy: 0.1,
    circulation: 0.14,
    privacy: 0.14,
    resale: 0.14,
    buildability: 0.14,
  },
  budget_optimized: {
    compliance: 0.15,
    construction_cost: 0.25,
    natural_light: 0.08,
    energy: 0.1,
    circulation: 0.1,
    privacy: 0.08,
    resale: 0.12,
    buildability: 0.12,
  },
  energy_optimized: {
    compliance: 0.12,
    construction_cost: 0.08,
    natural_light: 0.18,
    energy: 0.25,
    circulation: 0.1,
    privacy: 0.08,
    resale: 0.1,
    buildability: 0.09,
  },
  premium_lifestyle: {
    compliance: 0.1,
    construction_cost: 0.08,
    natural_light: 0.14,
    energy: 0.12,
    circulation: 0.12,
    privacy: 0.16,
    resale: 0.14,
    buildability: 0.14,
  },
  resale_value: {
    compliance: 0.14,
    construction_cost: 0.12,
    natural_light: 0.1,
    energy: 0.1,
    circulation: 0.1,
    privacy: 0.1,
    resale: 0.22,
    buildability: 0.12,
  },
};

export function getWeightProfile(objective?: OptimizationObjective): WeightProfile {
  if (objective) return OBJECTIVE_WEIGHT_PROFILES[objective];
  return DEFAULT_WEIGHT_PROFILE;
}
