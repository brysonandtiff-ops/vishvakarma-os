import type { Point2D, Wall } from '@/types';
import type { UnitSystem } from '@/utils/measurements';
import { isWallSelected } from '@/editor/canvasSelection';
import {
  drawWall,
  drawWallMeasurement,
  drawWallEndpointHandles,
  drawWallPreview,
} from '@/components/editor/blueprintCanvasDrawing';

export interface DrawWallsLayerOptions {
  walls: Wall[];
  displayWalls: Wall[];
  selectedWallId?: string;
  selectedWallIds?: string[];
  hoveredWall: string | null;
  currentTool: string;
  snapEnabled: boolean;
  unitSystem: UnitSystem;
  isDrawing: boolean;
  singleSelectedId?: string;
  draggingWallEndpoint?: { wallId: string; end: 'start' | 'end' } | null;
  startPoint: Point2D | null;
  currentPoint: Point2D | null;
}

export function drawWallsLayer(ctx: CanvasRenderingContext2D, options: DrawWallsLayerOptions) {
  const {
    displayWalls,
    selectedWallId,
    selectedWallIds,
    hoveredWall,
    currentTool,
    snapEnabled,
    unitSystem,
    isDrawing,
    singleSelectedId,
    draggingWallEndpoint,
    startPoint,
    currentPoint,
    walls,
  } = options;

  for (const wall of displayWalls) {
    const selected = isWallSelected(wall.id, selectedWallId, selectedWallIds);
    drawWall(ctx, wall, {
      selected,
      hovered: wall.id === hoveredWall,
      snapEnabled,
    });

    if ((selected || (wall.id === hoveredWall && currentTool === 'measure')) && !isDrawing) {
      drawWallMeasurement(ctx, wall, unitSystem);
    }
  }

  if (singleSelectedId && currentTool === 'select' && !isDrawing) {
    const handleWall = displayWalls.find((w) => w.id === singleSelectedId);
    if (handleWall) {
      drawWallEndpointHandles(ctx, handleWall, {
        activeEnd:
          draggingWallEndpoint?.wallId === singleSelectedId ? draggingWallEndpoint.end : undefined,
      });
    }
  }

  if (isDrawing && startPoint && currentPoint) {
    drawWallPreview(ctx, startPoint, currentPoint, walls, unitSystem);
  }
}
