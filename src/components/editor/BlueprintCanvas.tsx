// 2D Blueprint Canvas Component
import { useRef, useEffect, useState, useCallback, type PointerEvent } from 'react';
import type { Wall, Opening, Point2D, ToolType } from '@/types';
import {
  formatDimensionBySystem,
  checkOpeningOverlap,
  isOpeningInBounds,
  type UnitSystem
} from '@/utils/measurements';

interface BlueprintCanvasProps {
  walls: Wall[];
  openings: Opening[];
  currentTool: ToolType;
  gridVisible: boolean;
  snapEnabled: boolean;
  gridSize: number;
  onWallAdd: (wall: Wall) => void;
  onOpeningAdd: (opening: Opening) => void;
  onWallSelect: (wallId: string | undefined) => void;
  selectedWallId?: string;
  unitSystem?: UnitSystem;
}

type CanvasPointerEvent = PointerEvent<HTMLCanvasElement>;

export default function BlueprintCanvas({
  walls,
  openings,
  currentTool,
  gridVisible,
  snapEnabled,
  gridSize,
  onWallAdd,
  onOpeningAdd,
  onWallSelect,
  selectedWallId,
  unitSystem = 'metric',
}: BlueprintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point2D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point2D | null>(null);
  const [hoveredWall, setHoveredWall] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<Point2D | null>(null);
  const [hoveredOpening, setHoveredOpening] = useState<string | null>(null);
  const [previewOpening, setPreviewOpening] = useState<{
    position: Point2D;
    wallId: string;
    type: 'door' | 'window';
    parametricPosition: number;
  } | null>(null);

  const snapToGrid = useCallback(
    (point: Point2D): Point2D => {
      if (!snapEnabled) return point;
      return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize,
      };
    },
    [snapEnabled, gridSize]
  );

  // Corner auto-join: snap to nearby wall endpoints
  const snapToNearbyEndpoint = useCallback(
    (point: Point2D, snapDistance: number = 20): Point2D => {
      if (!snapEnabled) return point;

      const endpoints: Point2D[] = [];
      walls.forEach((wall) => {
        endpoints.push(wall.start, wall.end);
      });

      let closestEndpoint: Point2D | null = null;
      let minDistance = snapDistance;

      endpoints.forEach((endpoint) => {
        const dist = Math.sqrt(
          Math.pow(point.x - endpoint.x, 2) + Math.pow(point.y - endpoint.y, 2)
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestEndpoint = endpoint;
        }
      });

      return closestEndpoint || point;
    },
    [snapEnabled, walls]
  );

  const getCanvasPoint = useCallback(
    (e: Pick<CanvasPointerEvent, 'clientX' | 'clientY'>): Point2D => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const gridSnapped = snapToGrid(point);
      const endpointSnapped = snapToNearbyEndpoint(gridSnapped);

      return endpointSnapped;
    },
    [snapToGrid, snapToNearbyEndpoint]
  );

  const handlePointerDown = (e: CanvasPointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = getCanvasPoint(e);

    if (currentTool === 'wall') {
      setStartPoint(point);
      setIsDrawing(true);
    } else if (currentTool === 'select') {
      const clickedWall = walls.find((wall) => {
        const dist = pointToLineDistance(point, wall.start, wall.end);
        return dist < wall.thickness / 2 + 5;
      });
      onWallSelect(clickedWall?.id);
    } else if (currentTool === 'door' || currentTool === 'window') {
      const clickedWall = walls.find((wall) => {
        const dist = pointToLineDistance(point, wall.start, wall.end);
        return dist < wall.thickness / 2 + 10;
      });

      if (clickedWall) {
        const wallLength = Math.sqrt(
          Math.pow(clickedWall.end.x - clickedWall.start.x, 2) +
          Math.pow(clickedWall.end.y - clickedWall.start.y, 2)
        );

        const dx = clickedWall.end.x - clickedWall.start.x;
        const dy = clickedWall.end.y - clickedWall.start.y;
        const t = Math.max(0, Math.min(1,
          ((point.x - clickedWall.start.x) * dx + (point.y - clickedWall.start.y) * dy) /
          (wallLength * wallLength)
        ));

        const newOpening: Opening = {
          id: `${currentTool}-${Date.now()}`,
          type: currentTool,
          wallId: clickedWall.id,
          position: t,
          width: currentTool === 'door' ? 90 : 120,
          height: currentTool === 'door' ? 210 : 120,
          sillHeight: currentTool === 'window' ? 90 : undefined,
        };

        const wallOpenings = openings
          .filter((o) => o.wallId === clickedWall.id && o.id !== newOpening.id)
          .map((o) => ({ position: o.position, width: o.width }));

        const hasOverlap = checkOpeningOverlap(
          newOpening.position,
          newOpening.width,
          wallLength,
          wallOpenings
        );

        const inBounds = isOpeningInBounds(
          newOpening.position,
          newOpening.width,
          wallLength
        );

        if (hasOverlap) console.warn('Opening overlaps with existing opening');
        if (!inBounds) console.warn('Opening extends beyond wall boundaries');

        onOpeningAdd(newOpening);
      }
    }
  };

  const handlePointerMove = (e: CanvasPointerEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    setHoveredPoint(point);

    if (isDrawing && startPoint && currentTool === 'wall') {
      setCurrentPoint(point);
    } else if (currentTool === 'measure' || currentTool === 'door' || currentTool === 'window' || currentTool === 'select') {
      const hovered = walls.find((wall) => {
        const dist = pointToLineDistance(point, wall.start, wall.end);
        return dist < wall.thickness / 2 + 10;
      });
      setHoveredWall(hovered?.id || null);

      const hoveredOpeningFound = openings.find((opening) => {
        const wall = walls.find((w) => w.id === opening.wallId);
        if (!wall) return false;

        const openingX = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
        const openingY = wall.start.y + (wall.end.y - wall.start.y) * opening.position;

        const dist = Math.sqrt(
          Math.pow(point.x - openingX, 2) + Math.pow(point.y - openingY, 2)
        );

        return dist < 15;
      });
      setHoveredOpening(hoveredOpeningFound?.id || null);

      if ((currentTool === 'door' || currentTool === 'window') && hovered) {
        const wall = walls.find((w) => w.id === hovered.id);
        if (wall) {
          const wallLength = Math.sqrt(
            Math.pow(wall.end.x - wall.start.x, 2) +
            Math.pow(wall.end.y - wall.start.y, 2)
          );

          const dx = wall.end.x - wall.start.x;
          const dy = wall.end.y - wall.start.y;
          const t = Math.max(0, Math.min(1,
            ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) /
            (wallLength * wallLength)
          ));

          const previewX = wall.start.x + dx * t;
          const previewY = wall.start.y + dy * t;

          setPreviewOpening({
            position: { x: previewX, y: previewY },
            wallId: wall.id,
            type: currentTool,
            parametricPosition: t,
          });
        }
      } else {
        setPreviewOpening(null);
      }
    } else {
      setPreviewOpening(null);
      setHoveredOpening(null);
    }
  };

  const finishWallDrawing = (e: CanvasPointerEvent) => {
    if (isDrawing && startPoint && currentTool === 'wall') {
      const endPoint = getCanvasPoint(e);
      const length = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
      );

      if (length > 10) {
        const newWall: Wall = {
          id: `wall-${Date.now()}`,
          start: startPoint,
          end: endPoint,
          thickness: 10,
          height: 240,
          material: 'material-paint',
        };
        onWallAdd(newWall);
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handlePointerUp = (e: CanvasPointerEvent) => {
    e.preventDefault();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    finishWallDrawing(e);
  };

  const handlePointerCancel = (e: CanvasPointerEvent) => {
    e.preventDefault();
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setPreviewOpening(null);
  };

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#F5F1E8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gridVisible) {
      ctx.strokeStyle = '#D4CFC4';
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(184, 148, 31, 0.2)';
      ctx.lineWidth = 2;
      const majorGridSize = gridSize * 5;
      for (let x = 0; x < canvas.width; x += majorGridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += majorGridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(0 + canvas.width, y);
        ctx.stroke();
      }
    }

    walls.forEach((wall) => {
      const isSelected = wall.id === selectedWallId;
      const isHovered = wall.id === hoveredWall;

      if (isHovered && !isSelected) {
        ctx.strokeStyle = 'rgba(184, 148, 31, 0.3)';
        ctx.lineWidth = wall.thickness + 4;
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(wall.start.x, wall.start.y);
        ctx.lineTo(wall.end.x, wall.end.y);
        ctx.stroke();
      }

      ctx.strokeStyle = isSelected ? '#B8941F' : '#2C2C2C';
      ctx.lineWidth = wall.thickness;
      ctx.lineCap = 'square';

      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#B8941F' : '#2C2C2C';
      ctx.beginPath();
      ctx.arc(wall.start.x, wall.start.y, wall.thickness / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wall.end.x, wall.end.y, wall.thickness / 2, 0, Math.PI * 2);
      ctx.fill();

      if (snapEnabled) {
        ctx.strokeStyle = '#B8941F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wall.start.x, wall.start.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(wall.end.x, wall.end.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      if ((isSelected || (isHovered && currentTool === 'measure')) && !isDrawing) {
        const length = Math.sqrt(
          Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2)
        );
        const midX = (wall.start.x + wall.end.x) / 2;
        const midY = (wall.start.y + wall.end.y) / 2;
        const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
        const offsetX = Math.sin(angle) * 20;
        const offsetY = -Math.cos(angle) * 20;
        const lengthText = formatDimensionBySystem(length, unitSystem, 0);

        ctx.fillStyle = '#F9F6F0';
        ctx.fillRect(midX + offsetX - 35, midY + offsetY - 12, 70, 24);
        ctx.strokeStyle = '#B8941F';
        ctx.lineWidth = 1;
        ctx.strokeRect(midX + offsetX - 35, midY + offsetY - 12, 70, 24);
        ctx.fillStyle = '#2C2C2C';
        ctx.font = 'bold 11px "SF Mono", Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lengthText, midX + offsetX, midY + offsetY);
      }
    });

    openings.forEach((opening) => {
      const wall = walls.find((w) => w.id === opening.wallId);
      if (!wall) return;

      const openingX = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
      const openingY = wall.start.y + (wall.end.y - wall.start.y) * opening.position;
      const isHoveredOpening = opening.id === hoveredOpening;

      ctx.fillStyle = opening.type === 'door' ? '#C85A54' : '#4A7BA7';
      ctx.beginPath();
      ctx.arc(openingX, openingY, isHoveredOpening ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#F5F1E8';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (isHoveredOpening) {
        ctx.strokeStyle = opening.type === 'door' ? '#C85A54' : '#4A7BA7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(openingX, openingY, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (isHoveredOpening || (currentTool === 'measure')) {
        const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
        const offsetX = Math.sin(wallAngle) * 40;
        const offsetY = -Math.cos(wallAngle) * 40;
        const widthText = formatDimensionBySystem(opening.width * 2, unitSystem, 0);
        const heightText = formatDimensionBySystem(opening.height * 2, unitSystem, 0);

        ctx.fillStyle = 'rgba(249, 246, 240, 0.95)';
        ctx.fillRect(openingX + offsetX - 45, openingY + offsetY - 22, 90, 44);
        ctx.strokeStyle = opening.type === 'door' ? '#C85A54' : '#4A7BA7';
        ctx.lineWidth = 2;
        ctx.strokeRect(openingX + offsetX - 45, openingY + offsetY - 22, 90, 44);
        ctx.fillStyle = '#2C2C2C';
        ctx.font = 'bold 10px "SF Mono", Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opening.type.toUpperCase(), openingX + offsetX, openingY + offsetY - 10);
        ctx.font = '9px "SF Mono", Monaco, monospace';
        ctx.fillText(`W: ${widthText}`, openingX + offsetX, openingY + offsetY + 2);
        ctx.fillText(`H: ${heightText}`, openingX + offsetX, openingY + offsetY + 12);
      }
    });

    if (previewOpening && (currentTool === 'door' || currentTool === 'window')) {
      const wall = walls.find((w) => w.id === previewOpening.wallId);
      if (wall) {
        const { position, type } = previewOpening;
        const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

        ctx.fillStyle = type === 'door' ? 'rgba(200, 90, 84, 0.4)' : 'rgba(74, 123, 167, 0.4)';
        ctx.beginPath();
        ctx.arc(position.x, position.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = type === 'door' ? '#C85A54' : '#4A7BA7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(position.x, position.y, 16, 0, Math.PI * 2);
        ctx.stroke();

        const width = type === 'door' ? 90 : 120;
        const height = type === 'door' ? 210 : 120;
        const offsetX = Math.sin(wallAngle) * 35;
        const offsetY = -Math.cos(wallAngle) * 35;

        ctx.fillStyle = 'rgba(249, 246, 240, 0.95)';
        ctx.fillRect(position.x + offsetX - 40, position.y + offsetY - 20, 80, 40);
        ctx.strokeStyle = type === 'door' ? '#C85A54' : '#4A7BA7';
        ctx.lineWidth = 2;
        ctx.strokeRect(position.x + offsetX - 40, position.y + offsetY - 20, 80, 40);
        ctx.fillStyle = '#2C2C2C';
        ctx.font = 'bold 10px "SF Mono", Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(type.toUpperCase(), position.x + offsetX, position.y + offsetY - 8);
        ctx.font = '9px "SF Mono", Monaco, monospace';
        ctx.fillText(`${width}×${height}cm`, position.x + offsetX, position.y + offsetY + 6);
      }
    }

    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = 'rgba(184, 148, 31, 0.6)';
      ctx.lineWidth = 10;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const length = Math.sqrt(
        Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2)
      );
      const midX = (startPoint.x + currentPoint.x) / 2;
      const midY = (startPoint.y + currentPoint.y) / 2;

      ctx.fillStyle = '#F9F6F0';
      ctx.fillRect(midX - 30, midY - 20, 60, 20);
      ctx.fillStyle = '#2C2C2C';
      ctx.font = '12px "SF Mono", Monaco, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lengthText = formatDimensionBySystem(length, unitSystem, 0);
      ctx.fillText(lengthText, midX, midY - 10);

      if (hoveredPoint) {
        const isSnappedToEndpoint = walls.some((wall) => {
          const distToStart = Math.sqrt(
            Math.pow(currentPoint.x - wall.start.x, 2) + Math.pow(currentPoint.y - wall.start.y, 2)
          );
          const distToEnd = Math.sqrt(
            Math.pow(currentPoint.x - wall.end.x, 2) + Math.pow(currentPoint.y - wall.end.y, 2)
          );
          return distToStart < 1 || distToEnd < 1;
        });

        if (isSnappedToEndpoint) {
          ctx.strokeStyle = '#4CAF50';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(currentPoint.x, currentPoint.y, 15, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(currentPoint.x, currentPoint.y, 20, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }, [walls, openings, gridVisible, gridSize, isDrawing, startPoint, currentPoint, selectedWallId, snapEnabled, hoveredWall, currentTool, hoveredPoint, previewOpening, hoveredOpening, unitSystem]);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={800}
      className="architect-canvas cursor-crosshair-precise touch-none select-none rounded-lg shadow-sm"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={(e) => {
        if (isDrawing) return;
        setHoveredWall(null);
        setHoveredOpening(null);
        setPreviewOpening(null);
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      }}
    />
  );
}

function pointToLineDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx: number;
  let yy: number;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}
