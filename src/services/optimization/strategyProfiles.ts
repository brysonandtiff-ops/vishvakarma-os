import type { OptimizationObjective, OptimizationStrategy } from '@/domain/optimization/types';

export const STRATEGY_PROFILES: OptimizationStrategy[] = [
  {
    id: 'candidate-a',
    objective: 'family_focused',
    label: 'Family Focused',
    layoutSeed: 11,
    roomSizeBias: { Living: 1.1, Dining: 1.08, Kitchen: 1.05, Bedroom: 1.06, MasterBedroom: 1.08 },
    roomPriority: { Living: 1, Dining: 2, Kitchen: 3, Laundry: 4, Mudroom: 5 },
    adjacencyMultipliers: [
      { roomA: 'Living', roomB: 'Dining', multiplier: 1.5 },
      { roomA: 'Living', roomB: 'Kitchen', multiplier: 1.4 },
      { roomA: 'Dining', roomB: 'Kitchen', multiplier: 1.3 },
    ],
    injectExtras: ['mudroom'],
  },
  {
    id: 'candidate-b',
    objective: 'budget_optimized',
    label: 'Budget Optimized',
    layoutSeed: 23,
    roomSizeBias: { Study: 0.85, Mudroom: 0.8, Ensuite: 0.9, Garage: 0.95 },
    roomPriority: { Entry: 1, Living: 2, Kitchen: 3, Hallway: 4 },
    adjacencyMultipliers: [
      { roomA: 'Kitchen', roomB: 'Laundry', multiplier: 1.2 },
    ],
    dropOptionalExtras: true,
    compactFootprint: true,
  },
  {
    id: 'candidate-c',
    objective: 'energy_optimized',
    label: 'Energy Optimized',
    layoutSeed: 37,
    roomSizeBias: { Living: 1.05 },
    roomPriority: { Living: 1, Kitchen: 2, Laundry: 3, Bathroom: 4 },
    adjacencyMultipliers: [
      { roomA: 'Living', roomB: 'Dining', multiplier: 1.3 },
      { roomA: 'Bathroom', roomB: 'Laundry', multiplier: 1.4 },
      { roomA: 'Ensuite', roomB: 'MasterBedroom', multiplier: 1.3 },
    ],
    northernLivingBias: true,
    wetAreaStacking: true,
  },
  {
    id: 'candidate-d',
    objective: 'premium_lifestyle',
    label: 'Premium Lifestyle',
    layoutSeed: 41,
    roomSizeBias: { MasterBedroom: 1.15, Ensuite: 1.12, Living: 1.1, Study: 1.1, Dining: 1.08 },
    roomPriority: { MasterBedroom: 1, Ensuite: 2, Living: 3, Study: 4, Dining: 5 },
    adjacencyMultipliers: [
      { roomA: 'MasterBedroom', roomB: 'Ensuite', multiplier: 1.6 },
      { roomA: 'Living', roomB: 'Dining', multiplier: 1.4 },
    ],
    injectExtras: ['study', 'alfresco'],
  },
  {
    id: 'candidate-e',
    objective: 'resale_value',
    label: 'Maximum Resale Value',
    layoutSeed: 53,
    roomSizeBias: { Garage: 1.08, MasterBedroom: 1.05, Bedroom: 1.04 },
    roomPriority: { Garage: 1, Entry: 2, Living: 3, MasterBedroom: 4, Bedroom: 5 },
    adjacencyMultipliers: [
      { roomA: 'Garage', roomB: 'Entry', multiplier: 1.3 },
      { roomA: 'Living', roomB: 'Entry', multiplier: 1.2 },
    ],
  },
  {
    id: 'candidate-f',
    objective: 'vastu_harmonized',
    label: 'Vastu Harmonized Layout',
    layoutSeed: 67,
    roomSizeBias: { MasterBedroom: 1.08, Kitchen: 1.06, Living: 1.05 },
    roomPriority: { Entry: 1, Kitchen: 2, MasterBedroom: 3, Living: 4, Dining: 5 },
    adjacencyMultipliers: [
      { roomA: 'Kitchen', roomB: 'Dining', multiplier: 1.35 },
      { roomA: 'Living', roomB: 'Entry', multiplier: 1.25 },
      { roomA: 'MasterBedroom', roomB: 'Ensuite', multiplier: 1.2 },
    ],
    northernLivingBias: true,
  },
];

export function getStrategyByObjective(objective: OptimizationObjective): OptimizationStrategy {
  const found = STRATEGY_PROFILES.find((s) => s.objective === objective);
  if (!found) throw new Error(`Unknown objective: ${objective}`);
  return found;
}

export function getAllStrategies(): OptimizationStrategy[] {
  return [...STRATEGY_PROFILES];
}
