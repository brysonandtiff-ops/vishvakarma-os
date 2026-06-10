import { createParcel, type Parcel } from '@/domain/parcels/parcel';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';

export function analyzeLot(request: BuildingRequest): BuildingRequest {
  const parcel = { ...request.parcel };

  if (parcel.cornerLot && parcel.width === parcel.depth) {
    parcel.width = Math.round(Math.sqrt(parcel.area * 1.1) * 10) / 10;
    parcel.depth = Math.round((parcel.area / parcel.width) * 10) / 10;
  }

  return { ...request, parcel };
}

export function parcelFromPromptHints(
  prompt: string,
  override?: Partial<Parcel>
): Parcel {
  const areaMatch = prompt.match(/(\d+)\s*m[²2]/i);
  const corner = /corner/i.test(prompt);
  const area = override?.area ?? (areaMatch ? Number(areaMatch[1]) : 400);
  const width = override?.width ?? (corner ? Math.sqrt(area * 1.15) : Math.sqrt(area * 1.2));
  const depth = override?.depth ?? area / width;

  return createParcel({
    ...override,
    area,
    width,
    depth,
    cornerLot: override?.cornerLot ?? corner,
    orientation: override?.orientation ?? (corner ? 'corner' : 'N'),
  });
}
