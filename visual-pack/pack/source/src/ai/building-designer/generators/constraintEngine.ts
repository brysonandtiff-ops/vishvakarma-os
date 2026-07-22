import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { OptimizationStrategy } from '@/domain/optimization/types';
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

export function buildRoomSpecs(request: BuildingRequest, strategy?: OptimizationStrategy): RoomSpec[] {
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

  const extras = [...(request.extras ?? [])];
  if (strategy?.injectExtras) {
    for (const extra of strategy.injectExtras) {
      if (!extras.some((e) => e.toLowerCase().includes(extra.toLowerCase()))) {
        extras.push(extra);
      }
    }
  }

  if (!strategy?.dropOptionalExtras && extras.some((e) => /study|office/i.test(e))) {
    add('Study', 'Study');
  } else if (strategy?.injectExtras?.some((e) => /study|office/i.test(e))) {
    add('Study', 'Study');
  }

  if (strategy?.roomSizeBias) {
    for (const room of specs) {
      const bias = strategy.roomSizeBias[room.type];
      if (bias) {
        room.widthM = Math.max(2, room.widthM * bias);
        room.depthM = Math.max(2, room.depthM * bias);
      }
    }
  }

  return specs;
}

export function applyConstraints(request: BuildingRequest, strategy?: OptimizationStrategy): ConstraintResult {
  const rooms = buildRoomSpecs(request, strategy);
  const { width, depth } = buildableFootprintM(request.parcel.width, request.parcel.depth);
  const totalArea = rooms.reduce((sum, r) => sum + r.widthM * r.depthM, 0);
  const footprintArea = width * depth;
  const areaThreshold = strategy?.compactFootprint ? 1.05 : 1.15;
  const targetFill = strategy?.compactFootprint ? 0.88 : 0.95;

  if (totalArea > footprintArea * areaThreshold) {
    const scale = Math.sqrt((footprintArea * targetFill) / totalArea);
    for (const room of rooms) {
      room.widthM = Math.max(2, room.widthM * scale);
      room.depthM = Math.max(2, room.depthM * scale);
    }
  }

  return { rooms, footprintWidthM: width, footprintDepthM: depth };
}
