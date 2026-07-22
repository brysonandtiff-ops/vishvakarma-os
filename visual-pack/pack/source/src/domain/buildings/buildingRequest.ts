import type { Parcel } from '@/domain/parcels/parcel';

export interface BuildingRequest {
  style: string;
  bedrooms: number;
  bathrooms: number;
  garageSpaces: number;
  levels: number;
  parcel: Parcel;
  extras?: string[];
}

export const DEFAULT_BUILDING_REQUEST: BuildingRequest = {
  style: 'modern',
  bedrooms: 3,
  bathrooms: 2,
  garageSpaces: 1,
  levels: 1,
  parcel: {
    width: 20,
    depth: 20,
    area: 400,
    slope: 0,
    orientation: 'N',
  },
};
