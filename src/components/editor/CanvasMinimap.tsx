import { useRef, type PointerEvent } from 'react';
import type { CanvasViewportState, Room, Wall } from '@/types';
import { getRoomTypeFillStyle } from '@/domain/rooms/roomTypeColors';
import { getVerticesForRoom } from '@/utils/roomCalculations';
import { CANVAS_PAPER_FILL, GOLD, INK } from '@/core/sceneDrawingTokens';

function wallBounds(walls: Wall[]) {
  if (walls.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const wall of walls) {
    minX = Math.min(minX, wall.start.x, wall.end.x);
    minY = Math.min(minY, wall.start.y, wall.end.y);
    maxX = Math.max(maxX, wall.start.x, wall.end.x);
    maxY = Math.max(maxY, wall.start.y, wall.end.y);
  }
  const pad = 40;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

export default function CanvasMinimap({
  walls,
  rooms = [],
  roomWallSource,
  canvasViewport,
  canvasSize,
  onPanToWorld,
}: {
  walls: Wall[];
  rooms?: Room[];
  roomWallSource?: Wall[];
  canvasViewport: CanvasViewportState;
  canvasSize: { width: number; height: number };
  onPanToWorld: (point: { x: number; y: number }) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const bounds = wallBounds(walls);
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const mapW = 120;
  const mapH = 90;
  const scale = Math.min(mapW / worldW, mapH / worldH);
  const wallSource = roomWallSource ?? walls;

  const toMap = (x: number, y: number) => ({
    x: (x - bounds.minX) * scale,
    y: (y - bounds.minY) * scale,
  });

  const viewWorldLeft = (-canvasViewport.panX) / canvasViewport.zoom;
  const viewWorldTop = (-canvasViewport.panY) / canvasViewport.zoom;
  const viewWorldW = canvasSize.width / canvasViewport.zoom;
  const viewWorldH = canvasSize.height / canvasViewport.zoom;
  const viewRect = {
    x: (viewWorldLeft - bounds.minX) * scale,
    y: (viewWorldTop - bounds.minY) * scale,
    w: viewWorldW * scale,
    h: viewWorldH * scale,
  };

  const panFromClient = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const worldX = bounds.minX + mx / scale;
    const worldY = bounds.minY + my / scale;
    onPanToWorld({ x: worldX, y: worldY });
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panFromClient(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.preventDefault();
    panFromClient(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className="vish-minimap pointer-events-auto absolute bottom-14 right-3 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center p-1 touch-manipulation"
      data-testid="canvas-minimap"
    >
      <svg
        ref={svgRef}
        width={mapW}
        height={mapH}
        className="vish-minimap__svg block cursor-crosshair rounded-lg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="img"
        aria-label="Canvas minimap — tap or drag to pan"
      >
        <rect width="100%" height="100%" fill={CANVAS_PAPER_FILL} rx="8" />
        {rooms.map((room) => {
          const vertices = getVerticesForRoom(room, wallSource);
          if (vertices.length < 3) return null;
          const points = vertices.map((v) => {
            const p = toMap(v.x, v.y);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon
              key={room.id}
              points={points}
              fill={getRoomTypeFillStyle(room.roomType)}
              stroke="none"
            />
          );
        })}
        {walls.map((wall) => {
          const a = toMap(wall.start.x, wall.start.y);
          const b = toMap(wall.end.x, wall.end.y);
          return (
            <line
              key={wall.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={INK}
              strokeWidth={2}
            />
          );
        })}
        <rect
          x={viewRect.x}
          y={viewRect.y}
          width={viewRect.w}
          height={viewRect.h}
          fill="rgba(184, 148, 31, 0.15)"
          stroke={GOLD}
          strokeWidth={1.5}
          rx="1"
        />
      </svg>
    </div>
  );
}
