import type { Room, Wall } from '@/types';
import { getRoomTypeFillStyle } from '@/domain/rooms/roomTypeColors';
import { ROOM_LABEL, ROOM_STROKE } from '@/core/sceneDrawingTokens';
import { getVerticesForRoom } from '@/utils/roomCalculations';

export function drawRoomsLayer(
  ctx: CanvasRenderingContext2D,
  rooms: Room[],
  roomWallSource: Wall[],
) {
  for (const room of rooms) {
    const vertices = getVerticesForRoom(room, roomWallSource);
    if (vertices.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i += 1) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = getRoomTypeFillStyle(room.roomType);
      ctx.fill();
      ctx.strokeStyle = ROOM_STROKE;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }

    if (room.center) {
      ctx.fillStyle = ROOM_LABEL;
      ctx.font = '12px sans-serif';
      ctx.fillText(`${room.name}${room.area ? ` · ${room.area.toFixed(1)} m²` : ''}`, room.center.x, room.center.y);
    }
  }
}
