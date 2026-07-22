import type { Room, Wall } from '@/types';
import { getRoomTypeFillStyle } from '@/domain/rooms/roomTypeColors';
import {
  CANVAS_FONT_MONO_XS,
  CANVAS_FONT_SANS,
  CHIP_FILL_ALPHA,
  GOLD,
  ROOM_LABEL,
  ROOM_STROKE_SOFT,
} from '@/core/sceneDrawingTokens';
import { getVerticesForRoom } from '@/utils/roomCalculations';

export function drawRoomFills(
  ctx: CanvasRenderingContext2D,
  rooms: Room[],
  roomWallSource: Wall[],
) {
  for (const room of rooms) {
    const vertices = getVerticesForRoom(room, roomWallSource);
    if (vertices.length < 3) continue;

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i += 1) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = getRoomTypeFillStyle(room.roomType);
    ctx.fill();
    ctx.strokeStyle = ROOM_STROKE_SOFT;
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }
}

export function drawRoomLabels(
  ctx: CanvasRenderingContext2D,
  rooms: Room[],
) {
  for (const room of rooms) {
    if (!room.center) continue;

    ctx.font = CANVAS_FONT_SANS;
    const nameLine = room.name;
    const areaLine = room.area ? `${room.area.toFixed(1)} m²` : '';
    const chipW = Math.max(ctx.measureText(nameLine).width, areaLine ? ctx.measureText(areaLine).width : 0) + 20;
    const chipH = areaLine ? 36 : 22;
    const cx = room.center.x;
    const cy = room.center.y;

    ctx.fillStyle = CHIP_FILL_ALPHA;
    ctx.fillRect(cx - chipW / 2, cy - chipH / 2, chipW, chipH);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - chipW / 2, cy - chipH / 2, chipW, chipH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ROOM_LABEL;
    ctx.font = CANVAS_FONT_SANS;
    ctx.fillText(nameLine, cx, areaLine ? cy - 8 : cy);

    if (areaLine) {
      ctx.font = CANVAS_FONT_MONO_XS;
      ctx.fillText(areaLine, cx, cy + 8);
    }
  }
}

/** @deprecated Use drawRoomFills + drawRoomLabels */
export function drawRoomsLayer(
  ctx: CanvasRenderingContext2D,
  rooms: Room[],
  roomWallSource: Wall[],
) {
  drawRoomFills(ctx, rooms, roomWallSource);
  drawRoomLabels(ctx, rooms);
}

export function buildRoomLabelSvg(room: Room): string {
  if (!room.center) return '';
  const nameLine = room.name;
  const areaLine = room.area ? `${room.area.toFixed(1)} m²` : '';
  const chipH = areaLine ? 36 : 22;
  const chipW = Math.max(nameLine.length * 7, areaLine.length * 6) + 20;
  const cx = room.center.x;
  const cy = room.center.y;
  return `<g class="room-label"><rect x="${cx - chipW / 2}" y="${cy - chipH / 2}" width="${chipW}" height="${chipH}" fill="rgba(249,246,240,0.95)" stroke="#B8941F" stroke-width="1" rx="2" /><text x="${cx}" y="${areaLine ? cy - 8 : cy}" text-anchor="middle" font-size="12" fill="#6b4f2a" font-family="system-ui,sans-serif">${nameLine}</text>${areaLine ? `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="9" fill="#6b4f2a" font-family="monospace">${areaLine}</text>` : ''}</g>`;
}
