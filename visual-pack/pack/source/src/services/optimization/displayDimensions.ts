import type { OptimizationCandidate, OptimizationScore } from '@/domain/optimization/types';

export type PrimaryDimension =
  | 'compliance'
  | 'cost'
  | 'energy'
  | 'privacy'
  | 'resale'
  | 'buildability';

export const PRIMARY_DIMENSIONS: PrimaryDimension[] = [
  'compliance',
  'cost',
  'energy',
  'privacy',
  'resale',
  'buildability',
];

export const PRIMARY_DIMENSION_LABELS: Record<PrimaryDimension, string> = {
  compliance: 'Compliance',
  cost: 'Cost',
  energy: 'Energy',
  privacy: 'Privacy',
  resale: 'Resale',
  buildability: 'Buildability',
};

export interface DisplayScore {
  dimension: PrimaryDimension;
  label: string;
  score: number;
}

function scoreMap(scores: OptimizationScore[]): Map<string, number> {
  return new Map(scores.filter((s) => s.category !== 'overall').map((s) => [s.category, s.score]));
}

export function toDisplayScores(scores: OptimizationScore[]): DisplayScore[] {
  const map = scoreMap(scores);
  const get = (category: string) => map.get(category) ?? 0;

  return [
    { dimension: 'compliance', label: PRIMARY_DIMENSION_LABELS.compliance, score: get('compliance') },
    { dimension: 'cost', label: PRIMARY_DIMENSION_LABELS.cost, score: get('construction_cost') },
    {
      dimension: 'energy',
      label: PRIMARY_DIMENSION_LABELS.energy,
      score: Math.round(0.6 * get('energy') + 0.4 * get('natural_light')),
    },
    { dimension: 'privacy', label: PRIMARY_DIMENSION_LABELS.privacy, score: get('privacy') },
    { dimension: 'resale', label: PRIMARY_DIMENSION_LABELS.resale, score: get('resale') },
    {
      dimension: 'buildability',
      label: PRIMARY_DIMENSION_LABELS.buildability,
      score: Math.round(0.6 * get('buildability') + 0.4 * get('circulation')),
    },
  ];
}

export function toDisplayScoresForCandidate(candidate: OptimizationCandidate): DisplayScore[] {
  return toDisplayScores(candidate.scores);
}

export function computeDisplayOverall(candidate: OptimizationCandidate): number {
  const display = toDisplayScores(candidate.scores);
  if (display.length === 0) return 0;
  const total = display.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / display.length);
}
