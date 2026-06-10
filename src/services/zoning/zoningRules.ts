export interface ZoningConstraints {
  maxCoverageRatio: number;
  setbacks: { front: number; side: number; rear: number };
}

export const DEFAULT_ZONING: ZoningConstraints = {
  maxCoverageRatio: 0.4,
  setbacks: { front: 6, side: 1.5, rear: 3 },
};

export function buildableFootprintM(parcelWidth: number, parcelDepth: number, zoning = DEFAULT_ZONING) {
  const width = Math.max(6, parcelWidth - zoning.setbacks.side * 2);
  const depth = Math.max(6, parcelDepth - zoning.setbacks.front - zoning.setbacks.rear);
  const maxArea = parcelWidth * parcelDepth * zoning.maxCoverageRatio;
  const footprint = width * depth;
  if (footprint <= maxArea) {
    return { width, depth };
  }
  const scale = Math.sqrt(maxArea / footprint);
  return { width: width * scale, depth: depth * scale };
}
