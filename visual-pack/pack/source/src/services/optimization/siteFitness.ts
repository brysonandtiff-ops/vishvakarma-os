import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import type { SiteFitnessScore, SiteFitnessSubScore } from '@/domain/optimization/types';
import { buildableFootprintM } from '@/services/zoning/zoningRules';

export function computeSiteFitness(
  request: BuildingRequest,
  council?: CouncilRequirements,
): SiteFitnessScore {
  const parcel = request.parcel;
  const setbacks = council?.setbacks ?? { front: 6, side: 1.5, rear: 3 };
  const { width, depth } = buildableFootprintM(parcel.width, parcel.depth, {
    maxCoverageRatio: council?.maxCoverageRatio ?? 0.4,
    setbacks,
  });
  const buildableArea = width * depth;
  const parcelArea = parcel.width * parcel.depth;

  const orientation = parcel.orientation?.toUpperCase() ?? 'N';
  const solarOrientation = /N|NE|NW/.test(orientation) ? 88 : /E|W/.test(orientation) ? 72 : 60;

  const slope = parcel.slope ?? 0;
  const slopeSuitability = slope <= 2 ? 95 : slope <= 5 ? 78 : slope <= 10 ? 55 : 35;

  const accessEfficiency = parcel.cornerLot ? 85 : request.garageSpaces > 0 ? 80 : 65;

  const footprintRatio = parcelArea > 0 ? buildableArea / parcelArea : 0;
  const setbackUtilization = Math.min(100, Math.round(footprintRatio * 100 * 1.1));

  const openSpaceQuality = Math.min(100, Math.round((1 - footprintRatio * 0.4) * 100));

  const subScores: SiteFitnessSubScore[] = [
    {
      key: 'solarOrientation',
      label: 'Solar Orientation',
      score: solarOrientation,
      explanation: {
        summary: `Site faces ${orientation} — ${solarOrientation >= 80 ? 'strong' : 'moderate'} northern light potential for living areas.`,
        metrics: { orientationScore: solarOrientation },
      },
    },
    {
      key: 'slopeSuitability',
      label: 'Slope Suitability',
      score: slopeSuitability,
      explanation: {
        summary: `${slope}% slope is ${slope <= 5 ? 'suitable' : 'challenging'} for standard slab-on-ground construction.`,
        metrics: { slopePercent: slope },
      },
    },
    {
      key: 'accessEfficiency',
      label: 'Access Efficiency',
      score: accessEfficiency,
      explanation: {
        summary: parcel.cornerLot
          ? 'Corner lot provides dual street access for garage and entry.'
          : 'Standard lot access with front-entry configuration.',
        metrics: { cornerLot: parcel.cornerLot ? 1 : 0 },
      },
    },
    {
      key: 'setbackUtilization',
      label: 'Setback Utilization',
      score: setbackUtilization,
      explanation: {
        summary: `Buildable envelope uses ${Math.round(footprintRatio * 100)}% of parcel within ${setbacks.front}m front / ${setbacks.side}m side setbacks.`,
        metrics: { buildableAreaM2: Math.round(buildableArea), footprintRatioPercent: Math.round(footprintRatio * 100) },
      },
    },
    {
      key: 'openSpaceQuality',
      label: 'Open Space Quality',
      score: openSpaceQuality,
      explanation: {
        summary: `${Math.round((1 - footprintRatio) * 100)}% of parcel remains as open space for outdoor living.`,
        metrics: { openSpacePercent: Math.round((1 - footprintRatio) * 100) },
      },
    },
  ];

  const overall = Math.round(
    subScores.reduce((s, sub) => s + sub.score, 0) / subScores.length,
  );

  return {
    overall,
    solarOrientation,
    slopeSuitability,
    accessEfficiency,
    setbackUtilization,
    openSpaceQuality,
    explanations: subScores,
  };
}
