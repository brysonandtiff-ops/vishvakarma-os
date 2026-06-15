import type { MouseEvent } from 'react';
import type { CanvasViewportState, Wall } from '@/types';

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
  canvasViewport,
  canvasSize,
  onPanToWorld,
}: {
  walls: Wall[];
  canvasViewport: CanvasViewportState;
  canvasSize: { width: number; height: number };
  onPanToWorld: (point: { x: number; y: number }) => void;
}) {
  const bounds = wallBounds(walls);
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const mapW = 120;
  const mapH = 90;
  const scale = Math.min(mapW / worldW, mapH / worldH);

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

  const handleClick = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const worldX = bounds.minX + mx / scale;
    const worldY = bounds.minY + my / scale;
    onPanToWorld({ x: worldX, y: worldY });
  };

  return (
    <div
      className="pointer-events-auto absolute bottom-14 right-3 z-20 rounded-xl border border-primary/20 bg-black/40 p-1 shadow-lg backdrop-blur-md"
      data-testid="canvas-minimap"
    >
      <svg
        width={mapW}
        height={mapH}
        className="block cursor-crosshair rounded-lg bg-[#f5f1e8]/90"
        onClick={handleClick}
        role="img"
        aria-label="Canvas minimap — click to pan"
      >
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
              stroke="#2c1810"
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
          stroke="#b8941f"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
