/** Australian NCC Vol 2 H-class dwelling stubs (Phase 2 — not certified). */
export const NCC_AU_THRESHOLDS = {
  minHabitableRoomAreaSqM: 6.5,
  minBedroomWidthM: 2.4,
  minDoorWidthM: 0.85,
  minHallwayWidthM: 1.0,
  minWallHeightM: 2.4,
  thermalComfortWarning: 55,
  thermalComfortFail: 40,
  minGlazingRatio: 0.08,
  maxGlazingRatio: 0.4,
} as const;

/** NBC India residential stubs (decision-support — not certified). */
export const NBC_IN_THRESHOLDS = {
  minHabitableRoomAreaSqM: 7.0,
  minBedroomWidthM: 2.1,
  minDoorWidthM: 0.81,
  minStairWidthM: 0.9,
  minWallHeightM: 2.75,
  minVentilationOpeningSqM: 0.3,
  maxStairRiseCm: 19,
  minStairRunCm: 25,
  maxRampGradientPercent: 8,
  maxDeadEndCorridorM: 6,
} as const;

export const COMPLIANCE_CATEGORY_LABELS: Record<
  import('@/rules/types').ComplianceCategory,
  string
> = {
  ncc: 'NCC',
  nbc: 'NBC',
  accessibility: 'Access',
  energy: 'Energy',
  zoning: 'Zoning',
  fire: 'Fire',
};
