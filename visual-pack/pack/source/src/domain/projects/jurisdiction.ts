export type ProjectJurisdiction = 'au' | 'in';

export const DEFAULT_JURISDICTION: ProjectJurisdiction = 'au';
export const DEFAULT_REGION_BY_JURISDICTION: Record<ProjectJurisdiction, string> = {
  au: 'au-national',
  in: 'in-national',
};

export function resolveJurisdiction(manifest?: { jurisdiction?: ProjectJurisdiction }): ProjectJurisdiction {
  return manifest?.jurisdiction ?? DEFAULT_JURISDICTION;
}

export function resolveRegionId(
  manifest?: { jurisdiction?: ProjectJurisdiction; regionId?: string },
): string {
  if (manifest?.regionId) return manifest.regionId;
  return DEFAULT_REGION_BY_JURISDICTION[resolveJurisdiction(manifest)];
}

export function jurisdictionLabel(jurisdiction: ProjectJurisdiction): string {
  return jurisdiction === 'in' ? 'India (NBC pre-check)' : 'Australia (NCC)';
}

export function complianceCodeLabel(jurisdiction: ProjectJurisdiction): string {
  return jurisdiction === 'in' ? 'NBC' : 'NCC';
}

export const JURISDICTION_OPTIONS: { value: ProjectJurisdiction; label: string }[] = [
  { value: 'au', label: 'Australia' },
  { value: 'in', label: 'India' },
];
