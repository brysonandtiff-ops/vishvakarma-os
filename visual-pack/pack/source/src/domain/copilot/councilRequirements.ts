export interface CouncilSetbacks {
  front: number;
  side: number;
  rear: number;
}

export interface CouncilRequirements {
  councilName?: string;
  zone?: string;
  setbacks: CouncilSetbacks;
  maxCoverageRatio: number;
  maxHeightM?: number;
  heritageOverlay?: boolean;
  specialConditions: string[];
  rawText?: string;
}

export const DEFAULT_COUNCIL_REQUIREMENTS: CouncilRequirements = {
  setbacks: { front: 6, side: 1.5, rear: 3 },
  maxCoverageRatio: 0.4,
  maxHeightM: 8.5,
  heritageOverlay: false,
  specialConditions: [],
};

export function createCouncilRequirements(
  input: Partial<CouncilRequirements> = {},
): CouncilRequirements {
  return {
    ...DEFAULT_COUNCIL_REQUIREMENTS,
    ...input,
    setbacks: {
      ...DEFAULT_COUNCIL_REQUIREMENTS.setbacks,
      ...input.setbacks,
    },
    specialConditions: input.specialConditions ?? DEFAULT_COUNCIL_REQUIREMENTS.specialConditions,
  };
}
