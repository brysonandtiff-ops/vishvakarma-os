import { describe, expect, it } from 'vitest';
import { applyConstraints } from '@/ai/building-designer/generators/constraintEngine';
import { normalizeBuildingRequest } from '@/ai/building-designer/generators/requirementsExtractor';
import { analyzeLot } from '@/services/lot-analysis/lotAnalysis';
import { generateLayoutCandidates } from '@/planning/candidateGenerator';
import { rankPlanScores, scoreLayoutCandidates } from '@/planning/planScoringEngine';
import { parseCouncilText } from '@/services/copilot/ingestion/documentParsers';

describe('planScoringEngine', () => {
  const request = analyzeLot(
    normalizeBuildingRequest({
      style: 'modern',
      bedrooms: 4,
      bathrooms: 2,
      garageSpaces: 2,
      levels: 1,
      parcel: { width: 24.5, depth: 24.5, area: 600, slope: 0, orientation: 'corner', cornerLot: true },
    }),
  );
  const constraints = applyConstraints(request);
  const council = parseCouncilText('Front setback: 6m Side setback: 1.5m Rear setback: 3m Maximum coverage: 40%');

  it('ranks compliant cluster-public layouts above random seeds on adjacency', () => {
    const candidates = generateLayoutCandidates(constraints, 12, true);
    const scores = rankPlanScores(scoreLayoutCandidates(candidates, request, council));

    const clusterScores = scores.filter((score) => {
      const candidate = candidates.find((c) => c.id === score.candidateId);
      return candidate?.layoutOptions.packingStrategy === 'clusterPublic';
    });
    const rowScores = scores.filter((score) => {
      const candidate = candidates.find((c) => c.id === score.candidateId);
      return candidate?.layoutOptions.packingStrategy === 'row';
    });

    const bestCluster = clusterScores[0]?.dimensions.adjacency ?? 0;
    const worstRow = rowScores[rowScores.length - 1]?.dimensions.adjacency ?? 0;
    expect(bestCluster).toBeGreaterThanOrEqual(worstRow - 5);
    expect(scores[0].total).toBeGreaterThan(scores[scores.length - 1].total - 20);
  });

  it('disqualifies layouts with setback failures', () => {
    const candidates = generateLayoutCandidates(constraints, 6, true).map((candidate, index) =>
      index === 0
        ? {
            ...candidate,
            rooms: candidate.rooms.map((room) => ({ ...room, x: room.x - 5000, y: room.y - 5000 })),
          }
        : candidate,
    );

    const scores = scoreLayoutCandidates(candidates, request, council);
    expect(scores[0].disqualifiers.some((d) => d.toLowerCase().includes('setback'))).toBe(true);
    expect(scores[0].total).toBe(-Infinity);
  });
});
