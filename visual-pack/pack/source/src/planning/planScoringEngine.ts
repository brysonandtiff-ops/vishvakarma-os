import { PX_PER_METER } from '@/domain/constants';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { RoomPlacement } from '@/domain/buildings/generatedBuilding';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import { MIN_ROOM_SIZE_M } from '@/domain/rooms/roomType';
import { generateSitePlan } from '@/ai/building-designer/generators/sitePlanGenerator';
import {
  buildAdjacencyWeights,
  scoreAdjacency,
} from '@/ai/building-designer/generators/adjacencySolver';
import type { RoomSpec } from '@/ai/building-designer/generators/constraintEngine';
import type { LayoutCandidate, PlanScore } from '@/planning/types';
import { computeWeightedTotal, DEFAULT_SCORING_WEIGHTS } from '@/planning/scoringWeights';
import { footprintInsideParcel, polygonAreaPx } from '@/rules/shared/siteContext';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';

function roomsTouch(a: RoomPlacement, b: RoomPlacement): boolean {
  return (
    Math.abs(a.x + a.width - b.x) < 4 ||
    Math.abs(b.x + b.width - a.x) < 4 ||
    Math.abs(a.y + a.depth - b.y) < 4 ||
    Math.abs(b.y + b.depth - a.y) < 4
  );
}

function scoreGlobalAdjacency(
  rooms: RoomPlacement[],
  specs: RoomSpec[],
): { score: number; highlights: string[] } {
  const weights = buildAdjacencyWeights();
  const specById = new Map(specs.map((s) => [s.id, s]));
  let total = 0;
  const highlights: string[] = [];

  for (let i = 0; i < rooms.length; i += 1) {
    for (let j = i + 1; j < rooms.length; j += 1) {
      const a = rooms[i];
      const b = rooms[j];
      if (!roomsTouch(a, b)) continue;

      const typeA = specById.get(a.id)?.type;
      const typeB = specById.get(b.id)?.type;
      if (!typeA || !typeB) continue;

      const points = scoreAdjacency(typeA, typeB, weights);
      if (points === 0) continue;

      total += points;
      if (points >= 8 && highlights.length < 6) {
        highlights.push(`${typeA} adjacent to ${typeB} (+${points})`);
      }
    }
  }

  const normalized = Math.min(100, Math.max(0, 50 + total));
  return { score: normalized, highlights };
}

function scoreProgramFit(rooms: RoomPlacement[], specs: RoomSpec[]): { score: number; disqualifiers: string[] } {
  const specById = new Map(specs.map((s) => [s.id, s]));
  const disqualifiers: string[] = [];
  let penalty = 0;

  for (const room of rooms) {
    const spec = specById.get(room.id);
    if (!spec) continue;

    const min = MIN_ROOM_SIZE_M[spec.type];
    const widthM = room.width / PX_PER_METER;
    const depthM = room.depth / PX_PER_METER;

    if (widthM + 0.05 < min.width || depthM + 0.05 < min.depth) {
      penalty += 20;
      disqualifiers.push(`${spec.label} below NCC minimum (${widthM.toFixed(1)}×${depthM.toFixed(1)}m)`);
    }
  }

  return { score: Math.max(0, 100 - penalty), disqualifiers };
}

function scoreZoningMargin(
  request: BuildingRequest,
  rooms: RoomPlacement[],
  council?: CouncilRequirements,
): number {
  const sitePlan = generateSitePlan(request, rooms, council);
  const parcelArea = polygonAreaPx(sitePlan.parcelBoundary);
  const buildingArea = polygonAreaPx(sitePlan.buildingFootprint);
  const ratio = parcelArea > 0 ? buildingArea / parcelArea : 1;
  const maxCoverage = council?.maxCoverageRatio ?? 0.5;
  const headroom = Math.max(0, maxCoverage - ratio);
  const inside = footprintInsideParcel(sitePlan.buildingFootprint, sitePlan.parcelBoundary);

  const coverageScore = Math.min(100, (headroom / Math.max(maxCoverage, 0.01)) * 100);
  return inside ? coverageScore : 0;
}

function scoreCirculationQuality(rooms: RoomPlacement[], circulation: LayoutCandidate['circulation']): number {
  const hallway = rooms.find((r) => r.type === 'Hallway');
  if (!hallway) return 40;
  if (circulation.length >= 2) return 90;
  return 65;
}

function scoreFastCompliance(
  request: BuildingRequest,
  rooms: RoomPlacement[],
  council?: CouncilRequirements,
): { score: number; disqualifiers: string[] } {
  const sitePlan = generateSitePlan(request, rooms, council);
  const disqualifiers: string[] = [];

  if (!footprintInsideParcel(sitePlan.buildingFootprint, sitePlan.parcelBoundary)) {
    disqualifiers.push('Setback fail: footprint extends beyond parcel');
    return { score: 0, disqualifiers };
  }

  const parcelArea = polygonAreaPx(sitePlan.parcelBoundary);
  const buildingArea = polygonAreaPx(sitePlan.buildingFootprint);
  const ratio = parcelArea > 0 ? buildingArea / parcelArea : 0;
  const maxCoverage = council?.maxCoverageRatio ?? 0.5;

  if (ratio > maxCoverage) {
    disqualifiers.push(`Coverage ${(ratio * 100).toFixed(0)}% exceeds ${(maxCoverage * 100).toFixed(0)}% limit`);
    return { score: 0, disqualifiers };
  }

  const margin = maxCoverage - ratio;
  const score = Math.min(100, 60 + margin * 200);
  return { score, disqualifiers };
}

function scoreCostEfficiencyPlaceholder(): number {
  return 70;
}

export function scoreLayoutCandidate(
  candidate: LayoutCandidate,
  request: BuildingRequest,
  council?: CouncilRequirements,
): PlanScore {
  const { rooms, circulation, constraints, id } = candidate;
  const specs = constraints.rooms;

  const compliance = scoreFastCompliance(request, rooms, council);
  const adjacency = scoreGlobalAdjacency(rooms, specs);
  const programFit = scoreProgramFit(rooms, specs);
  const zoningMargin = scoreZoningMargin(request, rooms, council);
  const circulationScore = scoreCirculationQuality(rooms, circulation);
  const costEfficiency = scoreCostEfficiencyPlaceholder();

  const dimensions = {
    compliance: compliance.score,
    adjacency: adjacency.score,
    zoningMargin,
    programFit: programFit.score,
    costEfficiency,
    circulation: circulationScore,
  };

  const disqualifiers = [...compliance.disqualifiers, ...programFit.disqualifiers];
  const hardFail = disqualifiers.some((d) => d.includes('fail') || d.includes('exceeds'));

  const total = hardFail ? -Infinity : computeWeightedTotal(dimensions, DEFAULT_SCORING_WEIGHTS);

  return {
    candidateId: id,
    total,
    dimensions,
    disqualifiers,
    highlights: adjacency.highlights,
  };
}

export function scoreLayoutCandidates(
  candidates: LayoutCandidate[],
  request: BuildingRequest,
  council?: CouncilRequirements,
): PlanScore[] {
  return candidates.map((candidate) => scoreLayoutCandidate(candidate, request, council));
}

export function refineScoreWithBuilding(score: PlanScore, building: GeneratedBuilding): PlanScore {
  const complianceFails = building.complianceReport.results.filter((r) => r.status === 'fail').length;
  const complianceWarnings = building.complianceReport.results.filter((r) => r.status === 'warning').length;

  let complianceScore = score.dimensions.compliance;
  const disqualifiers = [...score.disqualifiers];

  if (complianceFails > 0) {
    complianceScore = 0;
    disqualifiers.push(`${complianceFails} compliance rule failure(s)`);
  } else if (complianceWarnings > 0) {
    complianceScore = Math.max(40, complianceScore - complianceWarnings * 8);
  } else {
    complianceScore = Math.min(100, complianceScore + 15);
  }

  const habitableArea = building.schedules.rooms.reduce((sum, row) => sum + row.areaSqM, 0);
  const costPerSqM = habitableArea > 0 ? building.costSummary.total / habitableArea : building.costSummary.total;
  const costEfficiency = Math.min(100, Math.max(20, 100 - costPerSqM / 5000));

  const dimensions = {
    ...score.dimensions,
    compliance: complianceScore,
    costEfficiency,
  };

  const hardFail = disqualifiers.some((d) => d.includes('failure') || d.includes('fail') || d.includes('exceeds'));
  const total = hardFail ? -Infinity : computeWeightedTotal(dimensions, DEFAULT_SCORING_WEIGHTS);

  return {
    ...score,
    dimensions,
    disqualifiers,
    total,
  };
}

export function rankPlanScores(scores: PlanScore[]): PlanScore[] {
  return [...scores].sort((a, b) => b.total - a.total);
}
