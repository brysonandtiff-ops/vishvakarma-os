import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { RoomPlacement, SitePlan } from '@/domain/buildings/generatedBuilding';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import type { Point2D } from '@/types';
import { CANVAS_ORIGIN_X, CANVAS_ORIGIN_Y, PX_PER_METER } from '@/domain/constants';
import { DEFAULT_ZONING } from '@/services/zoning/zoningRules';

function parcelToPx(m: number) {
  return m * PX_PER_METER;
}

function buildParcelBoundary(
  request: BuildingRequest,
  setbacks: CouncilRequirements['setbacks'],
): Point2D[] {
  if (request.parcel.boundaryPolygon?.length && request.parcel.boundaryPolygon.length >= 3) {
    return request.parcel.boundaryPolygon;
  }

  const ox = CANVAS_ORIGIN_X - parcelToPx(setbacks.side);
  const oy = CANVAS_ORIGIN_Y - parcelToPx(setbacks.front);
  const pw = parcelToPx(request.parcel.width);
  const pd = parcelToPx(request.parcel.depth);

  return request.parcel.cornerLot
    ? [
        { x: ox, y: oy },
        { x: ox + pw, y: oy },
        { x: ox + pw, y: oy + pd * 0.55 },
        { x: ox + pw * 0.55, y: oy + pd * 0.55 },
        { x: ox + pw * 0.55, y: oy + pd },
        { x: ox, y: oy + pd },
      ]
    : [
        { x: ox, y: oy },
        { x: ox + pw, y: oy },
        { x: ox + pw, y: oy + pd },
        { x: ox, y: oy + pd },
      ];
}

export function generateSitePlan(
  request: BuildingRequest,
  rooms: RoomPlacement[],
  council?: CouncilRequirements,
): SitePlan {
  const setbacks = council?.setbacks ?? DEFAULT_ZONING.setbacks;
  const parcelBoundary = buildParcelBoundary(request, setbacks);

  const minX = Math.min(...rooms.map((r) => r.x));
  const minY = Math.min(...rooms.map((r) => r.y));
  const maxX = Math.max(...rooms.map((r) => r.x + r.width));
  const maxY = Math.max(...rooms.map((r) => r.y + r.depth));

  const buildingFootprint: Point2D[] = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];

  return {
    parcelBoundary,
    buildingFootprint,
    setbacks,
    orientation: request.parcel.orientation,
  };
}
