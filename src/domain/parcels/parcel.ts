export interface Parcel {
  width: number;
  depth: number;
  area: number;
  slope: number;
  orientation: string;
  cornerLot?: boolean;
}

export function createParcel(input: Partial<Parcel> & { area?: number }): Parcel {
  const area = input.area ?? (input.width && input.depth ? input.width * input.depth : 400);
  const width = input.width ?? Math.sqrt(area * 1.2);
  const depth = input.depth ?? area / width;

  return {
    width: Math.round(width * 10) / 10,
    depth: Math.round(depth * 10) / 10,
    area: Math.round(area),
    slope: input.slope ?? 0,
    orientation: input.orientation ?? 'N',
    cornerLot: input.cornerLot ?? false,
  };
}
