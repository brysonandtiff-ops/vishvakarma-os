import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MoatGainPanel from '@/components/optimization/MoatGainPanel';
import type { MoatGainReport } from '@/domain/optimization/types';

const defensibleMoat: MoatGainReport = {
  score: 72,
  compositeScore: 81,
  decisionLift: 10,
  winnerMargin: 8,
  strategyDiversity: 60,
  permitConfidence: 95,
  explainabilityIndex: 88,
  valueImpactBand: 'defensible',
  valueImpactLabel: '$3M–8M',
  costMoat: {
    score: 68,
    costConfidence: 78,
    pricingDefensibility: 82,
    valueImpactBand: 'cost_defensible',
    valueImpactLabel: '$10M–25M',
    summary: 'Cost pricing moat active.',
  },
  summary: 'Optimization moat active.',
};

describe('MoatGainPanel', () => {
  it('renders composite score and dual value bands', () => {
    render(<MoatGainPanel moatGain={defensibleMoat} />);

    expect(screen.getByTestId('moat-gain-panel')).toBeInTheDocument();
    expect(screen.getByText('81')).toBeInTheDocument();
    expect(screen.getByText(/\$1M–3M → \$3M–8M/)).toBeInTheDocument();
    expect(screen.getByTestId('cost-moat-band')).toBeInTheDocument();
    expect(screen.getByText(/\$5M–15M → \$10M–25M/)).toBeInTheDocument();
  });
});
