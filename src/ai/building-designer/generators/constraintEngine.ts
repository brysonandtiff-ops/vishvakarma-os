import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import { MIN_ROOM_SIZE_M, type RoomType } from '@/domain/rooms/roomType';
import { buildableFootprintM } from '@/services/zoning/zoningRules';

export interface RoomSpec {
  id: string;
  type: RoomType;
  label: string;
  widthM: number;
  depthM: number;
}

export interface ConstraintResult {
  rooms: RoomSpec[];
  footprintWidthM: number;
  footprintDepthM: number;
}

export function buildRoomSpecs(request: BuildingRequest): RoomSpec[] {
  const specs: RoomSpec[] = [];
  let bedroomCount = 0;
  let bathroomCount = 0;

  const add = (type: RoomType, label?: string) => {
    const size = MIN_ROOM_SIZE_M[type];
    specs.push({
      id: `room-${type.toLowerCase()}-${specs.length}`,
      type,
      label: label ?? type,
      widthM: size.width,
      depthM: size.depth,
    });
  };

  add('Entry');
  add('Living');
  add('Dining');
  add('Kitchen');
  add('Hallway', 'Hallway');

  add('MasterBedroom', 'Master Bedroom');
  if (request.bathrooms >= 2) {
    add('Ensuite', 'Ensuite');
  } else {
    add('Bathroom', 'Bathroom');
  }

  for (let i = 1; i < request.bedrooms; i += 1) {
    bedroomCount += 1;
    add('Bedroom', `Bedroom ${bedroomCount}`);
  }

  const extraBaths = Math.max(0, request.bathrooms - (request.bathrooms >= 2 ? 2 : 1));
  for (let i = 0; i < extraBaths; i += 1) {
    bathroomCount += 1;
    add('Bathroom', `Bathroom ${bathroomCount + 1}`);
  }

  if (request.garageSpaces > 0) {
    const garageWidth = 3 * Math.min(request.garageSpaces, 3);
    specs.push({
      id: 'room-garage',
      type: 'Garage',
      label: request.garageSpaces > 1 ? `Garage (${request.garageSpaces})` : 'Garage',
      widthM: garageWidth,
      depthM: MIN_ROOM_SIZE_M.Garage.depth,
    });
    add('Laundry', 'Laundry');
    if (request.garageSpaces >= 2 || request.extras?.some((e) => /mudroom/i.test(e))) {
      add('Mudroom', 'Mudroom');
    }
  }

  if (request.extras?.some((e) => /study|office/i.test(e))) {
    add('Study', 'Study');
  }

  return specs;
}

export function applyConstraints(request: BuildingRequest): ConstraintResult {
  const rooms = buildRoomSpecs(request);
  const { width, depth } = buildableFootprintM(request.parcel.width, request.parcel.depth);
  const totalArea = rooms.reduce((sum, r) => sum + r.widthM * r.depthM, 0);
  const footprintArea = width * depth;

  if (totalArea > footprintArea * 1.15) {
    const scale = Math.sqrt((footprintArea * 0.95) / totalArea);
    for (const room of rooms) {
      room.widthM = Math.max(2, room.widthM * scale);
      room.depthM = Math.max(2, room.depthM * scale);
    }
  }

  return { rooms, footprintWidthM: width, footprintDepthM: depth };
}
