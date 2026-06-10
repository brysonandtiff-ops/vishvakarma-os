import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DecisionExplainerPanel from '@/components/system-intelligence/DecisionExplainerPanel';
import type { OptimizationCandidate, OptimizationReport } from '@/domain/optimization/types';

const report: OptimizationReport = {
  winnerId: 'winner',
  runnerUpId: 'runner',
  winnerLabel: 'Family Focused',
  runnerUpLabel: 'Budget Optimized',
  tradeoffs: [
    { dimension: 'Resale', direction: 'improves', detail: 'Resale improves by 10 points (85 vs 75).' },
  ],
  riskAreas: [],
  estimatedCost: 400_000,
  complianceConfidence: 100,
  permitReady: true,
  moatGain: {
    score: 55,
    compositeScore: 60,
    decisionLift: 6,
    winnerMargin: 5,
    strategyDiversity: 40,
    permitConfidence: 100,
    explainabilityIndex: 85,
    valueImpactBand: 'defensible',
    valueImpactLabel: '$3M–8M',
    summary: 'Winner leads by 5 pts.',
  },
  generatedAt: '2026-06-10T00:00:00.000Z',
};

const candidate = (id: string): OptimizationCandidate => ({
  id,
  label: id,
  objective: 'family_focused',
  building: {
    complianceReport: { blocked: false, overall: 'pass', results: [] },
    costSummary: { total: 400_000, items: [] },
  } as OptimizationCandidate['building'],
  scores: [
    { category: 'resale', score: 85, weight: 0.14, explanation: { summary: '', metrics: {} } },
    { category: 'overall', score: 88, weight: 1, explanation: { summary: '', metrics: {} } },
  ],
  overallScore: 88,
  rank: 1,
});

describe('DecisionExplainerPanel', () => {
  it('renders why this design won with bullets', () => {
    render(
      <DecisionExplainerPanel
        winner={candidate('winner')}
        runnerUp={candidate('runner')}
        report={report}
      />,
    );

    expect(screen.getByTestId('decision-explainer')).toBeInTheDocument();
    expect(screen.getByText('Why this design won')).toBeInTheDocument();
    expect(screen.getByText(/Resale improves/)).toBeInTheDocument();
    expect(screen.getByText(/Winner leads by 5 pts/)).toBeInTheDocument();
  });
});
