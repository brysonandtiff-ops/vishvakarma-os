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

export const COMPLIANCE_CATEGORY_LABELS: Record<
  import('@/rules/types').ComplianceCategory,
  string
> = {
  ncc: 'NCC',
  accessibility: 'Access',
  energy: 'Energy',
  zoning: 'Zoning',
  fire: 'Fire',
};
