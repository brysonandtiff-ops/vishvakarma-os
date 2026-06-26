// 2D Blueprint Canvas Component — pointer-first for mouse, touch, and Pencil-style input
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { toast } from 'sonner';
import { useCanvasResize } from '@/hooks/useCanvasResize';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import { useCanvasViewport } from '@/hooks/useCanvasViewport';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';
import { isElementLocked, getElementLock } from '@/modules/elementLock';
import { getCollaborationEngine } from '@/modules/collaborationEngine';
import { mapCanvasBufferToDisplay, mapCanvasBufferToWorld, mapPointerToCanvasBuffer, mapPointerToWorldCoords, mapWorldToCanvasBuffer } from '@/utils/canvasPointerCoords';
import {
  computeStepZoomFactor,
  computeWheelZoomFactor,
  computeZoomedViewport,
} from '@/utils/canvasViewportZoom';
import type {
  CanvasViewportState,
  DimensionAnnotation,
  EditorLayerVisibility,
  FixtureItem,
  FurnitureItem,
  Label,
  LandscapeElement,
  MepSymbol,
  Opening,
  Point2D,
  Room,
  Staircase,
  TerrainPatch,
  ToolType,
  Wall,
} from '@/types';
import { DEFAULT_LAYER_VISIBILITY } from '@/types';
import { buildOrderedVertices } from '@/utils/roomCalculations';
import {
  checkOpeningOverlap,
  isOpeningInBounds,
  type UnitSystem,
} from '@/utils/measurements';
import {
  drawDimension,
  drawGrid,
  drawOpening,
  drawPaperBackground,
  drawPreviewOpening,
  computeVisibleGridBounds,
  pointToLineDistance,
} from './blueprintCanvasDrawing';
import {
  drawFurniture2D,
  drawLandscape2D,
  drawStair2D,
  FURNITURE_PRESETS,
  getFurnitureDefaults,
  getLandscapeDefaults,
  LANDSCAPE_TYPES,
} from '@/core/sceneVisualCatalog';
import {
  isWallSelected,
  normalizeSelectionRect,
  toggleWallInSelection,
  wallsInSelectionRect,
  type SelectionRect,
} from '@/editor/canvasSelection';
import {
  COMPASS_FILL,
  COMPASS_STROKE,
  CANVAS_FONT_COMPASS,
  CHIP_FILL_ALPHA,
  GOLD,
  GOLD_MUTED,
  INK_LABEL,
} from '@/core/sceneDrawingTokens';
import {
  drawTerrain2D,
  drawTerrainPreview,
  getTerrainElevationPreset,
  isValidTerrainPolygon,
  pointsNear,
} from '@/core/sceneTerrainCatalog';
import { SpatialIndex } from '@/editor/spatialIndex';
import {
  createCanvasRenderScheduler,
  createEmptyDirtyFlags,
  type CanvasDirtyFlags,
} from '@/components/editor/blueprint/canvasRenderLoop';
import { drawRoomFills, drawRoomLabels } from '@/components/editor/blueprint/drawRooms';
import { drawMepSymbol2D, drawFixture2D } from '@/components/editor/blueprint/drawSymbols';
import { drawWallsLayer } from '@/components/editor/blueprint/drawWalls';
import {
  getInputModeFromPointerType,
  getHitAreaForMode,
  isEraserPointerActive,
  isEraserPointerPressed,
  type CanvasInputMode,
} from '@/components/editor/blueprint/inputHandlers';
import {
  ActivePointerTracker,
  computeClientCentroid,
  pointerPairDistance,
} from '@/utils/canvasTouchGestures';
import {
  constrainToOrthogonal,
  enforceMinWallLength,
  getWallEndpointAtPoint,
  MIN_WALL_LENGTH_PX,
} from '@/utils/wallDrawConstraints';
import { computeVastuOverlayRadius, drawVastuSectorOverlay } from '@/core/simulations/vastuOverlay';

interface BlueprintCanvasProps {
  walls: Wall[];
  openings: Opening[];
  labels?: Label[];
  dimensions?: DimensionAnnotation[];
  rooms?: Room[];
  furniture?: FurnitureItem[];
  staircases?: Staircase[];
  mepSymbols?: MepSymbol[];
  fixtures?: FixtureItem[];
  landscapeElements?: LandscapeElement[];
  terrain?: TerrainPatch[];
  northOrientation?: number;
  currentTool: ToolType;
  gridVisible: boolean;
  snapEnabled: boolean;
  gridSize: number;
  onWallAdd: (wall: Wall) => void;
  onWallUpdate?: (wallId: string, updates: Partial<Wall>) => void;
  onWallDelete?: (wallId: string) => void;
  onOpeningAdd: (opening: Opening) => void;
  onOpeningUpdate?: (openingId: string, updates: Partial<Opening>) => void;
  onOpeningDelete?: (openingId: string) => void;
  onLabelAdd?: (label: Label) => void;
  onLabelUpdate?: (labelId: string, updates: Partial<Label>) => void;
  onDimensionAdd?: (dimension: DimensionAnnotation) => void;
  dimensionVisibility?: boolean;
  onRoomDetect?: (point: Point2D) => void;
  onFurnitureAdd?: (item: FurnitureItem) => void;
  onFurnitureUpdate?: (furnitureId: string, updates: Partial<FurnitureItem>) => void;
  onStaircaseAdd?: (staircase: Staircase) => void;
  selectedLabelId?: string;
  onLabelSelect?: (labelId: string | undefined) => void;
  onMepSymbolAdd?: (symbol: MepSymbol) => void;
  onFixtureAdd?: (fixture: FixtureItem) => void;
  onLandscapeAdd?: (element: LandscapeElement) => void;
  onTerrainAdd?: (patch: TerrainPatch) => void;
  selectedFixtureId?: string;
  onFixtureSelect?: (fixtureId: string | undefined) => void;
  onPointerCanvasMove?: (point: Point2D) => void;
  onWallSelect: (wallId: string | undefined) => void;
  onWallsSelect?: (wallIds: string[]) => void;
  onOpeningSelect?: (openingId: string | undefined) => void;
  selectedWallId?: string;
  selectedWallIds?: string[];
  selectedOpeningId?: string;
  unitSystem?: UnitSystem;
  canvasViewport?: CanvasViewportState;
  onCanvasViewportChange?: (viewport: Partial<CanvasViewportState>) => void;
  onResetViewport?: () => void;
  manifestWalls?: Wall[];
  layerVisibility?: EditorLayerVisibility;
  interactionLocked?: boolean;
}

const MEP_TYPES: MepSymbol['type'][] = ['outlet', 'switch', 'hvac', 'panel'];
const FIXTURE_TYPES: FixtureItem['type'][] = ['point', 'spot', 'ceiling'];
type MepPlacement =
  | { kind: 'mep'; type: MepSymbol['type'] }
  | { kind: 'fixture'; type: FixtureItem['type'] };

const MEP_PLACEMENT_CYCLE: MepPlacement[] = [
  ...MEP_TYPES.map((type) => ({ kind: 'mep' as const, type })),
  ...FIXTURE_TYPES.map((type) => ({ kind: 'fixture' as const, type })),
];
const STAIR_DIRECTIONS = [0, 90, 180, 270];
const COLUMN_PRESET = FURNITURE_PRESETS.find((entry) => entry.type === 'column')!;
const LANDSCAPE_TYPE_CYCLE = [...LANDSCAPE_TYPES];

type CanvasPointerEvent = PointerEvent<HTMLCanvasElement>;
type InputMode = CanvasInputMode;

const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 24;

function getHitArea(mode: InputMode, base = 10) {
  return getHitAreaForMode(mode, base);
}

function computeLabelKeyboardOffset(
  containerTop: number,
  labelDisplayY: number,
  keyboardBottomInset: number,
): number {
  if (keyboardBottomInset <= 80) return 0;
  const labelTop = containerTop + labelDisplayY - 28;
  const labelBottom = labelTop + 36;
  const visibleBottom = window.innerHeight - keyboardBottomInset;
  if (labelBottom > visibleBottom) {
    return labelBottom - visibleBottom + 8;
  }
  return 0;
}

function getInputMode(event: CanvasPointerEvent): InputMode {
  return getInputModeFromPointerType(event.pointerType);
}

function positionOnWall(point: Point2D, wall: Wall): number {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const wallLength = Math.hypot(dx, dy);
  if (wallLength === 0) return 0;
  return Math.max(0, Math.min(1, ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / (wallLength * wallLength)));
}

function snapOpeningPosition(position: number): number {
  const endpointThreshold = 0.08;
  if (position < endpointThreshold) return 0;
  if (position > 1 - endpointThreshold) return 1;
  return position;
}

function drawLockGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, userName: string) {
  ctx.save();
  
  // Draw glassmorphic background container
  ctx.fillStyle = 'rgba(5, 5, 7, 0.85)'; // Obsidian backdrop
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  
  // Calculate text width for name tag
  ctx.font = '9px system-ui, sans-serif';
  const textWidth = ctx.measureText(userName).width;
  const padding = 6;
  const height = 18;
  const width = 16 + textWidth + padding * 2;
  const rx = x - width / 2;
  const ry = y - height / 2;
  
  // Draw background round rect
  ctx.beginPath();
  ctx.roundRect(rx, ry, width, height, 4);
  ctx.fill();
  ctx.stroke();
  
  // Draw small lock icon
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  
  // Lock shackle
  ctx.beginPath();
  ctx.arc(rx + padding + 3, ry + 6, 2.5, Math.PI, 0);
  ctx.stroke();
  
  // Lock body
  ctx.beginPath();
  ctx.roundRect(rx + padding, ry + 6, 6, 6, 1);
  ctx.fill();
  
  // Draw name
  ctx.fillStyle = '#f5f1e8'; // Parchment light text
  ctx.fillText(userName, rx + padding + 10, ry + height / 2 + 3);
  
  ctx.restore();
}

export default function BlueprintCanvas({
  walls,
  openings,
  labels = [],
  dimensions = [],
  rooms = [],
  furniture = [],
  staircases = [],
  mepSymbols = [],
  fixtures = [],
  landscapeElements = [],
  terrain = [],
  northOrientation = 0,
  currentTool,
  gridVisible,
  snapEnabled,
  gridSize,
  onWallAdd,
  onWallUpdate,
  onWallDelete,
  onOpeningAdd,
  onOpeningUpdate,
  onOpeningDelete,
  onLabelAdd,
  onLabelUpdate,
  onDimensionAdd,
  dimensionVisibility = true,
  onRoomDetect,
  onFurnitureAdd,
  onFurnitureUpdate,
  onStaircaseAdd,
  onMepSymbolAdd,
  onFixtureAdd,
  selectedFixtureId,
  onFixtureSelect,
  selectedLabelId,
  onLabelSelect,
  onLandscapeAdd,
  onTerrainAdd,
  onPointerCanvasMove,
  onWallSelect,
  onWallsSelect,
  onOpeningSelect,
  selectedWallId,
  selectedWallIds,
  selectedOpeningId,
  unitSystem = 'metric',
  onCanvasViewportChange,
  onResetViewport,
  manifestWalls,
  layerVisibility = DEFAULT_LAYER_VISIBILITY,
  interactionLocked = false,
}: BlueprintCanvasProps) {
  const floorPlanEngine = getFloorPlanEngine();
  const {
    canvasViewport: engineViewport,
    setCanvasViewport: setEngineViewport,
    resetCanvasViewport: resetEngineViewport,
  } = useCanvasViewport();
  const canvasViewport = engineViewport;
  const applyViewportChange = useCallback(
    (patch: Partial<CanvasViewportState>) => {
      setEngineViewport(patch);
      onCanvasViewportChange?.(patch);
    },
    [onCanvasViewportChange, setEngineViewport],
  );
  const handleResetViewport = useCallback(() => {
    resetEngineViewport();
    onResetViewport?.();
  }, [onResetViewport, resetEngineViewport]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const isCoarsePointer = useCoarsePointer();
  const canvasMetrics = useCanvasResize(containerRef, undefined, {
    wallCount: walls.length,
    coarsePointer: isCoarsePointer,
  });
  const { bottomInset: keyboardBottomInset } = useVisualViewportInset();

  useEffect(() => {
    const engine = getCollaborationEngine();
    if (!engine.isConnected()) return;

    const lockedElements: { id: string; type: 'wall' | 'opening' | 'annotation' }[] = [];

    if (selectedWallId) {
      engine.broadcastLock(selectedWallId, 'wall');
      lockedElements.push({ id: selectedWallId, type: 'wall' });
    }
    if (selectedOpeningId) {
      engine.broadcastLock(selectedOpeningId, 'opening');
      lockedElements.push({ id: selectedOpeningId, type: 'opening' });
    }
    if (selectedFixtureId) {
      engine.broadcastLock(selectedFixtureId, 'annotation');
      lockedElements.push({ id: selectedFixtureId, type: 'annotation' });
    }
    if (selectedLabelId) {
      engine.broadcastLock(selectedLabelId, 'annotation');
      lockedElements.push({ id: selectedLabelId, type: 'annotation' });
    }

    return () => {
      for (const item of lockedElements) {
        engine.broadcastUnlock(item.id, item.type);
      }
    };
  }, [selectedWallId, selectedOpeningId, selectedFixtureId, selectedLabelId]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point2D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point2D | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<Point2D | null>(null);
  const [hoveredWall, setHoveredWall] = useState<string | null>(null);
  const [hoveredOpening, setHoveredOpening] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('mouse');
  const [previewOpening, setPreviewOpening] = useState<{
    position: Point2D;
    wallId: string;
    type: 'door' | 'window';
  } | null>(null);
  const [draggingOpeningId, setDraggingOpeningId] = useState<string | null>(null);
  const [dragOpeningPosition, setDragOpeningPosition] = useState<number | null>(null);
  const [draggingFurnitureId, setDraggingFurnitureId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelText, setEditingLabelText] = useState('');
  const [dragFurniturePosition, setDragFurniturePosition] = useState<Point2D | null>(null);
  const [dimensionStart, setDimensionStart] = useState<Point2D | null>(null);
  const [furniturePresetIndex, setFurniturePresetIndex] = useState(0);
  const [mepPlacementIndex, setMepPlacementIndex] = useState(0);
  const [landscapeTypeIndex, setLandscapeTypeIndex] = useState(0);
  const [terrainVertices, setTerrainVertices] = useState<Point2D[]>([]);
  const [terrainElevationIndex, setTerrainElevationIndex] = useState(0);
  const [marqueeRect, setMarqueeRect] = useState<SelectionRect | null>(null);
  const [stairDirectionIndex, setStairDirectionIndex] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [draggingWallEndpoint, setDraggingWallEndpoint] = useState<{
    wallId: string;
    end: 'start' | 'end';
  } | null>(null);
  const [dragWallEndpointPosition, setDragWallEndpointPosition] = useState<Point2D | null>(null);
  const panOriginRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const pointerTrackerRef = useRef(new ActivePointerTracker());
  const pinchSessionRef = useRef<{
    startDistance: number;
    startZoom: number;
    prevCentroidClient: { x: number; y: number };
  } | null>(null);
  const lastLabelTapRef = useRef<{
    time: number;
    labelId: string;
    clientX: number;
    clientY: number;
  } | null>(null);
  const eraserStrokeRef = useRef<Set<string>>(new Set());
  const isErasingRef = useRef(false);
  const [isPinching, setIsPinching] = useState(false);

  const cancelTransientInteractions = useCallback(() => {
    if (draggingOpeningId || draggingFurnitureId || draggingWallEndpoint) {
      floorPlanEngine.abortEditTransaction();
    }
    setIsPanning(false);
    panOriginRef.current = null;
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setDraggingOpeningId(null);
    setDragOpeningPosition(null);
    setDraggingFurnitureId(null);
    setDragFurniturePosition(null);
    setDraggingWallEndpoint(null);
    setDragWallEndpointPosition(null);
    setMarqueeRect(null);
    setPreviewOpening(null);
    isErasingRef.current = false;
    eraserStrokeRef.current.clear();
  }, [draggingFurnitureId, draggingOpeningId, draggingWallEndpoint, floorPlanEngine]);

  const spatialIndexRef = useRef(new SpatialIndex());

  const syncActivePointer = useCallback((event: CanvasPointerEvent) => {
    pointerTrackerRef.current.set(event.pointerId, {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const clearActivePointer = useCallback((pointerId: number) => {
    pointerTrackerRef.current.delete(pointerId);
    if (pointerTrackerRef.current.size() < 2) {
      setIsPinching(false);
      pinchSessionRef.current = null;
    }
  }, []);

  const beginPinchIfReady = useCallback(() => {
    const tracker = pointerTrackerRef.current;
    if (!tracker.shouldEnterTouchGesture()) return false;
    const touchPointers = tracker.touchPointers();
    if (touchPointers.length < 2) return false;
    const startDistance = pointerPairDistance(touchPointers[0]!, touchPointers[1]!);
    const prevCentroidClient = computeClientCentroid(touchPointers);
    cancelTransientInteractions();
    pinchSessionRef.current = {
      startDistance,
      startZoom: canvasViewport.zoom,
      prevCentroidClient,
    };
    setIsPinching(true);
    return true;
  }, [cancelTransientInteractions, canvasViewport.zoom]);

  const applyPinchGesture = useCallback(() => {
    const session = pinchSessionRef.current;
    const tracker = pointerTrackerRef.current;
    if (!session || tracker.touchPointers().length < 2) return;
    const touchPointers = tracker.touchPointers();
    const nextCentroid = computeClientCentroid(touchPointers);
    const nextDistance = pointerPairDistance(touchPointers[0]!, touchPointers[1]!);
    const factor = nextDistance / (session.startDistance > 0 ? session.startDistance : 1);
    const newZoom = session.startZoom * factor;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    const centroidBuffer = mapPointerToCanvasBuffer(
      nextCentroid.x,
      nextCentroid.y,
      rect,
      canvas.width,
      canvas.height,
    );
    const panDxBuffer = (nextCentroid.x - session.prevCentroidClient.x) * scaleX;
    const panDyBuffer = (nextCentroid.y - session.prevCentroidClient.y) * scaleY;

    const zoomPatch = computeZoomedViewport(
      canvasViewport,
      newZoom,
      centroidBuffer.x,
      centroidBuffer.y,
    );
    applyViewportChange({
      zoom: zoomPatch.zoom,
      panX: (zoomPatch.panX ?? canvasViewport.panX) + panDxBuffer,
      panY: (zoomPatch.panY ?? canvasViewport.panY) + panDyBuffer,
    });
    session.prevCentroidClient = nextCentroid;
  }, [applyViewportChange, canvasViewport]);

  const stepCanvasZoom = useCallback(
    (direction: 'in' | 'out') => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const anchorBuffer = mapPointerToCanvasBuffer(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect,
        canvas.width,
        canvas.height,
      );
      const factor = computeStepZoomFactor(direction);
      applyViewportChange(
        computeZoomedViewport(
          canvasViewport,
          canvasViewport.zoom * factor,
          anchorBuffer.x,
          anchorBuffer.y,
        ),
      );
    },
    [applyViewportChange, canvasViewport],
  );

  const dirtyFlagsRef = useRef<CanvasDirtyFlags>(createEmptyDirtyFlags());
  const drawSceneRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    spatialIndexRef.current.rebuild({ walls, openings, furniture, fixtures });
    dirtyFlagsRef.current.geometry = true;
  }, [fixtures, furniture, openings, walls]);

  const renderScheduler = useMemo(
    () =>
      createCanvasRenderScheduler(
        () => drawSceneRef.current(),
        () => dirtyFlagsRef.current,
        () => {
          dirtyFlagsRef.current = createEmptyDirtyFlags();
        },
      ),
    [],
  );

  const requestCanvasDraw = useCallback(
    (flag: 'geometry' | 'viewport' | 'interaction' | 'overlay') => {
      renderScheduler.requestDraw(flag);
    },
    [renderScheduler],
  );
  const roomWallSource = manifestWalls ?? walls;

  const [bhumiCanvasMode, setBhumiCanvasMode] = useState<string>('sacred-parchment');

  useEffect(() => {
    requestCanvasDraw('geometry');
  }, [bhumiCanvasMode, requestCanvasDraw]);

  const snapToGrid = useCallback(
    (point: Point2D): Point2D => {
      if (!snapEnabled) return point;
      return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize,
      };
    },
    [gridSize, snapEnabled]
  );

  const snapToNearbyEndpoint = useCallback(
    (point: Point2D, snapDistance = 20): Point2D => {
      if (!snapEnabled) return point;

      let closest: Point2D | null = null;
      let minDistance = snapDistance;

      for (const wall of walls) {
        for (const endpoint of [wall.start, wall.end]) {
          const distance = Math.hypot(point.x - endpoint.x, point.y - endpoint.y);
          if (distance < minDistance) {
            minDistance = distance;
            closest = endpoint;
          }
        }
      }

      return closest ?? point;
    },
    [snapEnabled, walls]
  );

  const getRawCanvasPoint = useCallback(
    (event: Pick<CanvasPointerEvent, 'clientX' | 'clientY'>): Point2D => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return mapPointerToWorldCoords(
        event.clientX,
        event.clientY,
        rect,
        canvas.width,
        canvas.height,
        canvasViewport,
      );
    },
    [canvasViewport],
  );

  const applyPointSnaps = useCallback(
    (point: Point2D): Point2D => snapToNearbyEndpoint(snapToGrid(point)),
    [snapToGrid, snapToNearbyEndpoint],
  );

  const getWallDrawPoint = useCallback(
    (event: Pick<CanvasPointerEvent, 'clientX' | 'clientY' | 'shiftKey'>, origin: Point2D): Point2D => {
      let point = getRawCanvasPoint(event);
      if (event.shiftKey) {
        point = constrainToOrthogonal(origin, point);
      }
      return applyPointSnaps(point);
    },
    [applyPointSnaps, getRawCanvasPoint],
  );

  const getCanvasPoint = useCallback(
    (event: Pick<CanvasPointerEvent, 'clientX' | 'clientY'>): Point2D => {
      return applyPointSnaps(getRawCanvasPoint(event));
    },
    [applyPointSnaps, getRawCanvasPoint],
  );

  const getSingleSelectedWallId = useCallback((): string | undefined => {
    if (selectedWallIds?.length === 1) return selectedWallIds[0];
    if (selectedWallId && !selectedWallIds?.length) return selectedWallId;
    return undefined;
  }, [selectedWallId, selectedWallIds]);

  const openLabelEdit = useCallback(
    (label: Label) => {
      if (!onLabelUpdate) return;
      setEditingLabelId(label.id);
      setEditingLabelText(label.text);
      onLabelSelect?.(label.id);
    },
    [onLabelSelect, onLabelUpdate],
  );

  const getWallAtPoint = useCallback(
    (point: Point2D, extraHitArea = 10) =>
      spatialIndexRef.current.findWallAtPoint(point, extraHitArea) ??
      walls.find((wall) => pointToLineDistance(point, wall.start, wall.end) < wall.thickness / 2 + extraHitArea),
    [walls]
  );

  const getOpeningAtPoint = useCallback(
    (point: Point2D, mode: InputMode) => {
      const hitRadius = getHitArea(mode, 15);
      const fromIndex = spatialIndexRef.current.findOpeningAtPoint(point, hitRadius, (opening) =>
        opening.id === draggingOpeningId && dragOpeningPosition !== null
          ? dragOpeningPosition
          : opening.position,
      );
      if (fromIndex) return fromIndex;
      return openings.find((opening) => {
        const wall = walls.find((candidate) => candidate.id === opening.wallId);
        if (!wall) return false;
        const pos = opening.id === draggingOpeningId && dragOpeningPosition !== null
          ? dragOpeningPosition
          : opening.position;
        const x = wall.start.x + (wall.end.x - wall.start.x) * pos;
        const y = wall.start.y + (wall.end.y - wall.start.y) * pos;
        return Math.hypot(point.x - x, point.y - y) < hitRadius;
      });
    },
    [dragOpeningPosition, draggingOpeningId, openings, walls],
  );

  const getLabelAtPoint = useCallback(
    (point: Point2D) => labels.find((label) => {
      const size = (label.fontSize ?? 14) * (label.text.length * 0.45);
      return (
        point.x >= label.position.x - 4 &&
        point.x <= label.position.x + size &&
        point.y >= label.position.y - (label.fontSize ?? 14) &&
        point.y <= label.position.y + 4
      );
    }),
    [labels],
  );

  const getFurnitureAtPoint = useCallback(
    (point: Point2D, mode: InputMode) =>
      spatialIndexRef.current.findFurnitureAtPoint(point, getHitArea(mode, 4)) ??
      furniture.find((item) => {
        const width = item.width ?? 80;
        const depth = item.depth ?? 60;
        return (
          Math.abs(point.x - item.position.x) < width / 2 + getHitArea(mode, 4) &&
          Math.abs(point.y - item.position.y) < depth / 2 + getHitArea(mode, 4)
        );
      }),
    [furniture],
  );

  const getFixtureAtPoint = useCallback(
    (point: Point2D, mode: InputMode) =>
      spatialIndexRef.current.findFixtureAtPoint(point, 10 + getHitArea(mode, 2)) ??
      fixtures.find((fixture) => {
        const radius = 10 + getHitArea(mode, 2);
        return Math.hypot(point.x - fixture.position.x, point.y - fixture.position.y) <= radius;
      }),
    [fixtures],
  );

  const placeOpening = (point: Point2D, mode: InputMode) => {
    if (currentTool !== 'door' && currentTool !== 'window') return;

    const wall = getWallAtPoint(point, getHitArea(mode));
    if (!wall) return;

    const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    const position = snapOpeningPosition(positionOnWall(point, wall));

    const opening: Opening = {
      id: `${currentTool}-${Date.now()}`,
      type: currentTool,
      wallId: wall.id,
      position,
      width: currentTool === 'door' ? 90 : 120,
      height: currentTool === 'door' ? 210 : 120,
      sillHeight: currentTool === 'window' ? 90 : undefined,
    };

    const wallOpenings = openings
      .filter((item) => item.wallId === wall.id)
      .map((item) => ({ position: item.position, width: item.width }));

    if (checkOpeningOverlap(opening.position, opening.width, wallLength, wallOpenings)) {
      console.warn('Opening overlaps with existing opening');
    }

    if (!isOpeningInBounds(opening.position, opening.width, wallLength)) {
      console.warn('Opening extends beyond wall boundaries');
    }

    onOpeningAdd(opening);
  };

  const runHoverPreview = useCallback(
    (point: Point2D, mode: InputMode) => {
      setHoveredPoint(point);
      onPointerCanvasMove?.(point);

      const wall = getWallAtPoint(point, getHitArea(mode));
      const opening = getOpeningAtPoint(point, mode);
      setHoveredWall(wall?.id ?? null);
      setHoveredOpening(opening?.id ?? null);

      if ((currentTool === 'door' || currentTool === 'window') && wall) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const wallLength = Math.hypot(dx, dy);
        const t = Math.max(
          0,
          Math.min(
            1,
            ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / (wallLength * wallLength),
          ),
        );
        setPreviewOpening({
          position: { x: wall.start.x + dx * t, y: wall.start.y + dy * t },
          wallId: wall.id,
          type: currentTool,
        });
        return;
      }

      setPreviewOpening(null);
    },
    [currentTool, getOpeningAtPoint, getWallAtPoint, onPointerCanvasMove],
  );

  const eraseAtPoint = useCallback(
    (point: Point2D, mode: InputMode, strokeIds: Set<string>) => {
      const opening = getOpeningAtPoint(point, mode);
      if (opening) {
        const strokeKey = `opening:${opening.id}`;
        if (strokeIds.has(strokeKey)) return;
        if (isElementLocked(opening.id, 'opening')) {
          const lock = getElementLock(opening.id, 'opening');
          toast.warning(`This opening is locked by ${lock?.userName ?? 'another user'}`);
          return;
        }
        if (!onOpeningDelete) return;
        strokeIds.add(strokeKey);
        onOpeningDelete(opening.id);
        onOpeningSelect?.(undefined);
        onWallSelect(undefined);
        onWallsSelect?.([]);
        onLabelSelect?.(undefined);
        return;
      }

      const wall = getWallAtPoint(point, getHitArea(mode, 5));
      if (wall) {
        const strokeKey = `wall:${wall.id}`;
        if (strokeIds.has(strokeKey)) return;
        if (isElementLocked(wall.id, 'wall')) {
          const lock = getElementLock(wall.id, 'wall');
          toast.warning(`This wall is locked by ${lock?.userName ?? 'another user'}`);
          return;
        }
        if (!onWallDelete) return;
        strokeIds.add(strokeKey);
        onWallDelete(wall.id);
        onWallSelect(undefined);
        onWallsSelect?.([]);
        onOpeningSelect?.(undefined);
        onLabelSelect?.(undefined);
      }
    },
    [
      getOpeningAtPoint,
      getWallAtPoint,
      onLabelSelect,
      onOpeningDelete,
      onOpeningSelect,
      onWallDelete,
      onWallSelect,
      onWallsSelect,
    ],
  );

  const handlePointerDown = (event: CanvasPointerEvent) => {
    if (pointerTrackerRef.current.shouldRejectIncoming(event.pointerType)) {
      return;
    }

    syncActivePointer(event);

    if (pointerTrackerRef.current.shouldEnterTouchGesture()) {
      event.preventDefault();
      beginPinchIfReady();
      return;
    }

    if (isPinching) {
      event.preventDefault();
      return;
    }

    const allowsPanWhileLocked =
      currentTool === 'pan' && event.button === 0 ||
      event.button === 1 ||
      (event.button === 0 && event.shiftKey);

    if (interactionLocked && !allowsPanWhileLocked) {
      return;
    }

    if (isEraserPointerActive(event)) {
      event.preventDefault();
      const mode = getInputMode(event);
      setInputMode(mode);
      eraserStrokeRef.current = new Set();
      isErasingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      eraseAtPoint(getCanvasPoint(event), mode, eraserStrokeRef.current);
      return;
    }

    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      event.preventDefault();
      panOriginRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        panX: canvasViewport.panX,
        panY: canvasViewport.panY,
      };
      setIsPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (currentTool === 'pan' && event.button === 0) {
      event.preventDefault();
      panOriginRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        panX: canvasViewport.panX,
        panY: canvasViewport.panY,
      };
      setIsPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    event.preventDefault();
    const mode = getInputMode(event);
    setInputMode(mode);
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(event);

    if (currentTool === 'wall') {
      if (isDrawing && startPoint) {
        setCurrentPoint(point);
        return;
      }
      setStartPoint(point);
      setCurrentPoint(point);
      setIsDrawing(true);
      return;
    }

    if (currentTool === 'select') {
      const opening = getOpeningAtPoint(point, mode);
      if (opening) {
        if (isElementLocked(opening.id, 'opening')) {
          const lock = getElementLock(opening.id, 'opening');
          toast.warning(`This opening is locked by ${lock?.userName ?? 'another user'}`);
          return;
        }
        onOpeningSelect?.(opening.id);
        onWallSelect(undefined);
        onWallsSelect?.([]);
        onLabelSelect?.(undefined);
        setDraggingOpeningId(opening.id);
        setDragOpeningPosition(opening.position);
        floorPlanEngine.beginEditTransaction();
        return;
      }

      const furnitureItem = getFurnitureAtPoint(point, mode);
      if (furnitureItem && onFurnitureUpdate) {
        if (isElementLocked(furnitureItem.id, 'annotation')) {
          const lock = getElementLock(furnitureItem.id, 'annotation');
          toast.warning(`This item is locked by ${lock?.userName ?? 'another user'}`);
          return;
        }
        onOpeningSelect?.(undefined);
        onWallSelect(undefined);
        onWallsSelect?.([]);
        onLabelSelect?.(undefined);
        setDraggingFurnitureId(furnitureItem.id);
        setDragFurniturePosition(furnitureItem.position);
        floorPlanEngine.beginEditTransaction();
        return;
      }

      const label = getLabelAtPoint(point);
      if (label) {
        if (isElementLocked(label.id, 'annotation')) {
          const lock = getElementLock(label.id, 'annotation');
          toast.warning(`This label is locked by ${lock?.userName ?? 'another user'}`);
          return;
        }
        const now = Date.now();
        const lastTap = lastLabelTapRef.current;
        const isDoubleTap =
          lastTap &&
          lastTap.labelId === label.id &&
          now - lastTap.time < DOUBLE_TAP_MS &&
          Math.hypot(event.clientX - lastTap.clientX, event.clientY - lastTap.clientY) < DOUBLE_TAP_PX;

        if (isDoubleTap && onLabelUpdate) {
          openLabelEdit(label);
          lastLabelTapRef.current = null;
          return;
        }

        if (selectedLabelId === label.id && onLabelUpdate) {
          openLabelEdit(label);
          return;
        }

        lastLabelTapRef.current = {
          time: now,
          labelId: label.id,
          clientX: event.clientX,
          clientY: event.clientY,
        };
        onLabelSelect?.(label.id);
        onFixtureSelect?.(undefined);
        onOpeningSelect?.(undefined);
        onWallSelect(undefined);
        onWallsSelect?.([]);
        return;
      }

      const fixture = getFixtureAtPoint(point, mode);
      if (fixture) {
        if (isElementLocked(fixture.id, 'annotation')) {
          const lock = getElementLock(fixture.id, 'annotation');
          toast.warning(`This fixture is locked by ${lock?.userName ?? 'another user'}`);
          return;
        }
        onFixtureSelect?.(fixture.id);
        onLabelSelect?.(undefined);
        onOpeningSelect?.(undefined);
        onWallSelect(undefined);
        onWallsSelect?.([]);
        return;
      }

      const singleWallId = getSingleSelectedWallId();
      if (singleWallId && onWallUpdate) {
        const selectedWallForDrag = walls.find((w) => w.id === singleWallId);
        if (selectedWallForDrag) {
          const hitRadius = getHitArea(mode, 8) / canvasViewport.zoom;
          const endpoint = getWallEndpointAtPoint(point, selectedWallForDrag, hitRadius);
          if (endpoint) {
            if (isElementLocked(singleWallId, 'wall')) {
              const lock = getElementLock(singleWallId, 'wall');
              toast.warning(`This wall is locked by ${lock?.userName ?? 'another user'}`);
              return;
            }
            onOpeningSelect?.(undefined);
            onLabelSelect?.(undefined);
            onFixtureSelect?.(undefined);
            setDraggingWallEndpoint({ wallId: singleWallId, end: endpoint });
            setDragWallEndpointPosition(
              endpoint === 'start' ? selectedWallForDrag.start : selectedWallForDrag.end,
            );
            floorPlanEngine.beginEditTransaction();
            return;
          }
        }
      }

      const wall = getWallAtPoint(point, getHitArea(mode, 5));
      if (wall) {
        if (isElementLocked(wall.id, 'wall')) {
          const lock = getElementLock(wall.id, 'wall');
          toast.warning(`This wall is locked by ${lock?.userName ?? 'another user'}`);
          return;
        }
        const additive = event.shiftKey;
        const currentIds = selectedWallIds?.length
          ? selectedWallIds
          : selectedWallId
            ? [selectedWallId]
            : [];
        const nextIds = toggleWallInSelection(currentIds, wall.id, additive);
        if (onWallsSelect) {
          onWallsSelect(nextIds);
        } else {
          onWallSelect(nextIds[0]);
        }
        onOpeningSelect?.(undefined);
        onLabelSelect?.(undefined);
        onFixtureSelect?.(undefined);
        return;
      }

      onOpeningSelect?.(undefined);
      onLabelSelect?.(undefined);
      onFixtureSelect?.(undefined);
      setMarqueeRect({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
      return;
    }

    if (currentTool === 'text') {
      onLabelAdd?.({
        id: `label-${Date.now()}`,
        text: 'Room',
        position: point,
        fontSize: 14,
        color: '#2c1810',
      });
      return;
    }

    if (currentTool === 'dimension') {
      if (!dimensionStart) {
        setDimensionStart(point);
        return;
      }

      onDimensionAdd?.({
        id: `dimension-${Date.now()}`,
        start: dimensionStart,
        end: point,
      });
      setDimensionStart(null);
      return;
    }

    if (currentTool === 'room') {
      onRoomDetect?.(point);
      return;
    }

    if (currentTool === 'column') {
      onFurnitureAdd?.({
        id: `column-${Date.now()}`,
        type: COLUMN_PRESET.type,
        position: point,
        width: COLUMN_PRESET.width,
        depth: COLUMN_PRESET.depth,
        rotation: 0,
      });
      return;
    }

    if (currentTool === 'stair') {
      const direction = STAIR_DIRECTIONS[stairDirectionIndex % STAIR_DIRECTIONS.length];
      onStaircaseAdd?.({
        id: `stair-${Date.now()}`,
        position: point,
        direction,
      });
      setStairDirectionIndex((index) => index + 1);
      return;
    }

    if (currentTool === 'furniture') {
      const preset = FURNITURE_PRESETS[furniturePresetIndex % FURNITURE_PRESETS.length];
      onFurnitureAdd?.({
        id: `furniture-${Date.now()}`,
        type: preset.type,
        position: point,
        width: preset.width,
        depth: preset.depth,
        rotation: 0,
      });
      setFurniturePresetIndex((index) => (index + 1) % FURNITURE_PRESETS.length);
      return;
    }

    if (currentTool === 'mep') {
      const placement = MEP_PLACEMENT_CYCLE[mepPlacementIndex % MEP_PLACEMENT_CYCLE.length];
      if (placement.kind === 'mep') {
        onMepSymbolAdd?.({
          id: `mep-${Date.now()}`,
          type: placement.type,
          position: point,
        });
      } else {
        onFixtureAdd?.({
          id: `fixture-${Date.now()}`,
          type: placement.type,
          position: point,
          intensity: 1,
        });
      }
      setMepPlacementIndex((index) => (index + 1) % MEP_PLACEMENT_CYCLE.length);
      return;
    }

    if (currentTool === 'landscape') {
      const type = LANDSCAPE_TYPE_CYCLE[landscapeTypeIndex % LANDSCAPE_TYPE_CYCLE.length];
      const landscapeDefaults = getLandscapeDefaults(type);
      onLandscapeAdd?.({
        id: `landscape-${Date.now()}`,
        type,
        position: point,
        ...(type === 'water' || type === 'rock'
          ? { width: landscapeDefaults.width, depth: landscapeDefaults.depth }
          : {}),
      });
      setLandscapeTypeIndex((index) => (index + 1) % LANDSCAPE_TYPE_CYCLE.length);
      return;
    }

    if (currentTool === 'terrain') {
      if (terrainVertices.length >= 3 && pointsNear(point, terrainVertices[0])) {
        if (isValidTerrainPolygon(terrainVertices)) {
          onTerrainAdd?.({
            id: `terrain-${Date.now()}`,
            points: [...terrainVertices],
            elevation: getTerrainElevationPreset(terrainElevationIndex),
          });
          setTerrainElevationIndex((index) => index + 1);
        }
        setTerrainVertices([]);
        return;
      }

      setTerrainVertices((vertices) => [...vertices, point]);
      return;
    }

    placeOpening(point, mode);
  };

  const handlePointerMove = (event: CanvasPointerEvent) => {
    event.preventDefault();
    syncActivePointer(event);

    if (isPinching && pointerTrackerRef.current.touchPointers().length >= 2) {
      applyPinchGesture();
      return;
    }

    const mode = getInputMode(event);
    setInputMode(mode);

    if (isErasingRef.current && isEraserPointerPressed(event)) {
      eraseAtPoint(getCanvasPoint(event), mode, eraserStrokeRef.current);
      return;
    }

    if (event.pointerType === 'pen' && event.buttons === 0) {
      const hoverPoint = applyPointSnaps(getRawCanvasPoint(event));
      runHoverPreview(hoverPoint, mode);
      return;
    }

    if (isPanning && panOriginRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scaleX = canvas.width / canvas.getBoundingClientRect().width;
      const scaleY = canvas.height / canvas.getBoundingClientRect().height;
      const dx = (event.clientX - panOriginRef.current.clientX) * scaleX;
      const dy = (event.clientY - panOriginRef.current.clientY) * scaleY;
      applyViewportChange({
        panX: panOriginRef.current.panX + dx,
        panY: panOriginRef.current.panY + dy,
      });
      return;
    }

    const point = getCanvasPoint(event);
    setHoveredPoint(point);
    onPointerCanvasMove?.(point);

    if (isDrawing && startPoint && currentTool === 'wall') {
      const nativeEvent = event.nativeEvent as globalThis.PointerEvent;
      const coalescedEvents =
        typeof nativeEvent.getCoalescedEvents === 'function' ? nativeEvent.getCoalescedEvents() : [nativeEvent];
      const lastCoalesced = coalescedEvents[coalescedEvents.length - 1];
      const drawEvent = lastCoalesced
        ? {
            clientX: lastCoalesced.clientX,
            clientY: lastCoalesced.clientY,
            shiftKey: event.shiftKey,
          }
        : event;
      setCurrentPoint(getWallDrawPoint(drawEvent, startPoint));
      return;
    }

    if (draggingWallEndpoint && onWallUpdate) {
      const wall = walls.find((candidate) => candidate.id === draggingWallEndpoint.wallId);
      if (wall) {
        const fixed = draggingWallEndpoint.end === 'start' ? wall.end : wall.start;
        let next = applyPointSnaps(getRawCanvasPoint(event));
        next = enforceMinWallLength(fixed, next, MIN_WALL_LENGTH_PX);
        setDragWallEndpointPosition(next);
        onWallUpdate(draggingWallEndpoint.wallId, draggingWallEndpoint.end === 'start' ? { start: next } : { end: next });
      }
      return;
    }

    if (draggingOpeningId && onOpeningUpdate) {
      const opening = openings.find((item) => item.id === draggingOpeningId);
      const wall = opening ? walls.find((candidate) => candidate.id === opening.wallId) : undefined;
      if (opening && wall) {
        const nextPos = snapOpeningPosition(positionOnWall(point, wall));
        setDragOpeningPosition(nextPos);
        onOpeningUpdate(draggingOpeningId, { position: nextPos });
      }
      return;
    }

    if (draggingFurnitureId && onFurnitureUpdate) {
      setDragFurniturePosition(point);
      onFurnitureUpdate(draggingFurnitureId, { position: point });
      return;
    }

    if (marqueeRect && currentTool === 'select') {
      setMarqueeRect({ ...marqueeRect, x2: point.x, y2: point.y });
      return;
    }

    const wall = getWallAtPoint(point, getHitArea(mode));
    const opening = getOpeningAtPoint(point, mode);
    setHoveredWall(wall?.id ?? null);
    setHoveredOpening(opening?.id ?? null);

    if ((currentTool === 'door' || currentTool === 'window') && wall) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const wallLength = Math.hypot(dx, dy);
      const t = Math.max(0, Math.min(1, ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / (wallLength * wallLength)));
      setPreviewOpening({
        position: { x: wall.start.x + dx * t, y: wall.start.y + dy * t },
        wallId: wall.id,
        type: currentTool,
      });
      return;
    }

    setPreviewOpening(null);
  };

  const finishWallDrawing = (event: CanvasPointerEvent) => {
    if (!isDrawing || !startPoint || currentTool !== 'wall') return;

    const end = getWallDrawPoint(event, startPoint);
    if (Math.hypot(end.x - startPoint.x, end.y - startPoint.y) <= MIN_WALL_LENGTH_PX) {
      setCurrentPoint(end);
      return;
    }

    onWallAdd({
      id: `wall-${Date.now()}`,
      start: startPoint,
      end,
      thickness: 10,
      height: 240,
      material: 'material-paint',
    });

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handlePointerUp = (event: CanvasPointerEvent) => {
    event.preventDefault();
    const isErasingBeforeUp = isErasingRef.current;
    if (isErasingRef.current) {
      isErasingRef.current = false;
      eraserStrokeRef.current.clear();
      // #region agent log
      fetch('http://127.0.0.1:7794/ingest/0451e9e7-1a3e-4172-9adc-c1db59fe5192',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'32bff4'},body:JSON.stringify({sessionId:'32bff4',location:'BlueprintCanvas.tsx:pointer-up-reset',message:'eraser reset on pointerup',data:{beforeMultiTouchCheck:true},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
    }
    const wasMultiTouch = isPinching || pointerTrackerRef.current.shouldEnterTouchGesture();
    clearActivePointer(event.pointerId);
    // #region agent log
    fetch('http://127.0.0.1:7794/ingest/0451e9e7-1a3e-4172-9adc-c1db59fe5192',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'32bff4'},body:JSON.stringify({sessionId:'32bff4',location:'BlueprintCanvas.tsx:pointer-up',message:'handlePointerUp entry',data:{wasMultiTouch,isErasingBeforeUp,button:event.button,buttons:event.buttons,pointerId:event.pointerId},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    if (wasMultiTouch) {
      // #region agent log
      fetch('http://127.0.0.1:7794/ingest/0451e9e7-1a3e-4172-9adc-c1db59fe5192',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'32bff4'},body:JSON.stringify({sessionId:'32bff4',location:'BlueprintCanvas.tsx:pointer-up-multitouch',message:'pointerup early return multitouch',data:{isErasingBeforeUp,skippedEraserReset:false},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      panOriginRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (draggingOpeningId && onOpeningUpdate && dragOpeningPosition !== null) {
      onOpeningUpdate(draggingOpeningId, { position: dragOpeningPosition });
      floorPlanEngine.commitEditTransaction('Move opening');
    }

    if (draggingFurnitureId && onFurnitureUpdate && dragFurniturePosition) {
      onFurnitureUpdate(draggingFurnitureId, { position: dragFurniturePosition });
      floorPlanEngine.commitEditTransaction('Move furniture');
    }

    if (draggingWallEndpoint && onWallUpdate && dragWallEndpointPosition) {
      const { wallId, end } = draggingWallEndpoint;
      onWallUpdate(wallId, end === 'start' ? { start: dragWallEndpointPosition } : { end: dragWallEndpointPosition });
      floorPlanEngine.commitEditTransaction('Move wall endpoint');
    }

    setDraggingOpeningId(null);
    setDragOpeningPosition(null);
    setDraggingFurnitureId(null);
    setDragFurniturePosition(null);
    setDraggingWallEndpoint(null);
    setDragWallEndpointPosition(null);

    if (marqueeRect && currentTool === 'select') {
      const end = getCanvasPoint(event);
      const rect: SelectionRect = { ...marqueeRect, x2: end.x, y2: end.y };
      const ids = wallsInSelectionRect(walls, rect);
      if (ids.length > 0) {
        onWallsSelect?.(ids);
        onOpeningSelect?.(undefined);
      } else {
        const { width, height } = normalizeSelectionRect(rect);
        if (width < 10 && height < 10) {
          onWallSelect(undefined);
          onWallsSelect?.([]);
          onOpeningSelect?.(undefined);
        }
      }
      setMarqueeRect(null);
    }

    finishWallDrawing(event);
  };

  const handleDoubleClick = (event: CanvasPointerEvent) => {
    const point = getCanvasPoint(event);
    const label = getLabelAtPoint(point);
    if (!label || !onLabelUpdate) return;
    openLabelEdit(label);
  };

  const commitLabelEdit = () => {
    if (editingLabelId && onLabelUpdate && editingLabelText.trim()) {
      onLabelUpdate(editingLabelId, { text: editingLabelText.trim() });
    }
    setEditingLabelId(null);
    setEditingLabelText('');
  };

  const handlePointerCancel = (event: CanvasPointerEvent) => {
    event.preventDefault();
    if (isErasingRef.current) {
      isErasingRef.current = false;
      eraserStrokeRef.current.clear();
      // #region agent log
      fetch('http://127.0.0.1:7794/ingest/0451e9e7-1a3e-4172-9adc-c1db59fe5192',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'32bff4'},body:JSON.stringify({sessionId:'32bff4',location:'BlueprintCanvas.tsx:pointer-cancel-reset',message:'eraser reset on pointercancel',data:{beforePinchCheck:true},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
    }
    clearActivePointer(event.pointerId);
    if (isPinching) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (draggingOpeningId || draggingFurnitureId || draggingWallEndpoint) {
      floorPlanEngine.abortEditTransaction();
    }
    setDraggingOpeningId(null);
    setDragOpeningPosition(null);
    setDraggingFurnitureId(null);
    setDragFurniturePosition(null);
    setDraggingWallEndpoint(null);
    setDragWallEndpointPosition(null);
    setDimensionStart(null);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setPreviewOpening(null);
    setTerrainVertices([]);
    setMarqueeRect(null);
  };

  useEffect(() => {
    if (currentTool !== 'terrain') {
      setTerrainVertices([]);
    }
  }, [currentTool]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (terrainVertices.length > 0) {
          setTerrainVertices([]);
        }
        if (marqueeRect) {
          setMarqueeRect(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [marqueeRect, terrainVertices.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== canvasMetrics.bufferWidth || canvas.height !== canvasMetrics.bufferHeight) {
      canvas.width = canvasMetrics.bufferWidth;
      canvas.height = canvasMetrics.bufferHeight;
    }
  }, [canvasMetrics.bufferWidth, canvasMetrics.bufferHeight]);

  useEffect(() => {
    if (editingLabelId) {
      labelInputRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [editingLabelId, keyboardBottomInset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const buffer = mapPointerToCanvasBuffer(
        event.clientX,
        event.clientY,
        rect,
        canvas.width,
        canvas.height,
      );
      const factor = computeWheelZoomFactor(event.deltaY);
      applyViewportChange(
        computeZoomedViewport(
          canvasViewport,
          canvasViewport.zoom * factor,
          buffer.x,
          buffer.y,
        ),
      );
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [canvasViewport, applyViewportChange]);

  useEffect(() => {
    drawSceneRef.current = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    drawPaperBackground(ctx, canvas.width, canvas.height, bhumiCanvasMode);

    ctx.save();
    ctx.translate(canvasViewport.panX, canvasViewport.panY);
    ctx.scale(canvasViewport.zoom, canvasViewport.zoom);

    const gridBounds = computeVisibleGridBounds(canvas.width, canvas.height, canvasViewport);

    if (gridVisible) {
      drawGrid(ctx, gridBounds, gridSize, bhumiCanvasMode);
    }

    if (layerVisibility.rooms) {
      drawRoomFills(ctx, rooms, roomWallSource);
    }

    if (layerVisibility.walls) {
      const displayWalls = walls.map((wall) => {
        if (
          draggingWallEndpoint &&
          dragWallEndpointPosition &&
          wall.id === draggingWallEndpoint.wallId
        ) {
          return draggingWallEndpoint.end === 'start'
            ? { ...wall, start: dragWallEndpointPosition }
            : { ...wall, end: dragWallEndpointPosition };
        }
        return wall;
      });

      const singleSelectedId =
        selectedWallIds?.length === 1
          ? selectedWallIds[0]
          : selectedWallId && !selectedWallIds?.length
            ? selectedWallId
            : undefined;

      drawWallsLayer(ctx, {
        walls,
        displayWalls,
        openings,
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
      });

      // Draw lock overlays for walls
      for (const wall of displayWalls) {
        const lock = getElementLock(wall.id, 'wall');
        if (lock) {
          const user = getCollaborationEngine().getUser(lock.userId);
          const collabColor = user?.color ?? '#ef4444';
          ctx.save();
          ctx.strokeStyle = collabColor;
          ctx.lineWidth = wall.thickness + 4;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(wall.start.x, wall.start.y);
          ctx.lineTo(wall.end.x, wall.end.y);
          ctx.stroke();
          ctx.restore();

          const midX = (wall.start.x + wall.end.x) / 2;
          const midY = (wall.start.y + wall.end.y) / 2;
          drawLockGlyph(ctx, midX, midY, collabColor, lock.userName);
        }
      }
    }

    if (layerVisibility.openings) {
      for (const opening of openings) {
        const wall = walls.find((item) => item.id === opening.wallId);
        if (!wall) continue;
        drawOpening(ctx, wall, opening, {
          hovered: opening.id === hoveredOpening || opening.id === selectedOpeningId || currentTool === 'measure',
          selected: opening.id === selectedOpeningId,
          dragging: opening.id === draggingOpeningId,
          dragPositionPercent: opening.id === draggingOpeningId ? dragOpeningPosition ?? undefined : undefined,
          unitSystem,
        });

        // Complete the element lock UI for openings
        const lock = getElementLock(opening.id, 'opening');
        if (lock) {
          const user = getCollaborationEngine().getUser(lock.userId);
          const collabColor = user?.color ?? '#ef4444';
          const dx = wall.end.x - wall.start.x;
          const dy = wall.end.y - wall.start.y;
          const len = Math.hypot(dx, dy);
          if (len > 0) {
            const px = wall.start.x + dx * opening.position;
            const py = wall.start.y + dy * opening.position;
            ctx.save();
            ctx.strokeStyle = collabColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(px, py, opening.width / 2 + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            drawLockGlyph(ctx, px, py, collabColor, lock.userName);
          }
        }
      }
    }

    if (layerVisibility.rooms) {
      drawRoomLabels(ctx, rooms);
    }

    if (layerVisibility.labels) {
      for (const label of labels) {
        const isSelected = label.id === selectedLabelId;
        const fontSize = label.fontSize ?? 14;
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        const textWidth = ctx.measureText(label.text).width;
        if (isSelected) {
          ctx.fillStyle = CHIP_FILL_ALPHA;
          ctx.fillRect(label.position.x - 6, label.position.y - fontSize - 4, textWidth + 12, fontSize + 8);
          ctx.strokeStyle = GOLD;
          ctx.lineWidth = 1;
          ctx.strokeRect(label.position.x - 6, label.position.y - fontSize - 4, textWidth + 12, fontSize + 8);
        }
        ctx.fillStyle = label.color ?? INK_LABEL;
        ctx.fillText(label.text, label.position.x, label.position.y);

        // Complete the element lock UI for labels
        const lock = getElementLock(label.id, 'annotation');
        if (lock) {
          const user = getCollaborationEngine().getUser(lock.userId);
          const collabColor = user?.color ?? '#ef4444';
          ctx.save();
          ctx.strokeStyle = collabColor;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.8;
          ctx.strokeRect(label.position.x - 8, label.position.y - fontSize - 6, textWidth + 16, fontSize + 12);
          ctx.restore();

          drawLockGlyph(
            ctx,
            label.position.x + textWidth / 2,
            label.position.y - fontSize / 2,
            collabColor,
            lock.userName,
          );
        }
      }
    }

    if (layerVisibility.furniture) {
      for (const item of furniture) {
        const pos = item.id === draggingFurnitureId && dragFurniturePosition
          ? dragFurniturePosition
          : item.position;
        drawFurniture2D(ctx, item, pos, item.id === draggingFurnitureId);

        // Complete the element lock UI for furniture items
        const lock = getElementLock(item.id, 'annotation');
        if (lock) {
          const user = getCollaborationEngine().getUser(lock.userId);
          const collabColor = user?.color ?? '#ef4444';
          const defaults = getFurnitureDefaults(item.type);
          const width = item.width ?? defaults.width;
          const depth = item.depth ?? defaults.depth;
          const hw = width / 2;
          const hd = depth / 2;

          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(((item.rotation ?? 0) * Math.PI) / 180);
          ctx.strokeStyle = collabColor;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.roundRect(-hw - 4, -hd - 4, width + 8, depth + 8, 4);
          ctx.stroke();
          ctx.restore();

          drawLockGlyph(ctx, pos.x, pos.y, collabColor, lock.userName);
        }
      }

      for (const staircase of staircases) {
        drawStair2D(ctx, staircase.position, staircase.direction ?? 0, currentTool === 'measure');
      }
    }

    if (layerVisibility.mep) {
      for (const symbol of mepSymbols) {
        drawMepSymbol2D(ctx, symbol, { highlighted: currentTool === 'measure' });
      }

      for (const fixture of fixtures) {
        drawFixture2D(ctx, fixture, { selected: fixture.id === selectedFixtureId });

        // Complete the element lock UI for fixtures
        const lock = getElementLock(fixture.id, 'annotation');
        if (lock) {
          const user = getCollaborationEngine().getUser(lock.userId);
          const collabColor = user?.color ?? '#ef4444';
          ctx.save();
          ctx.strokeStyle = collabColor;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(fixture.position.x, fixture.position.y, 12, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          drawLockGlyph(ctx, fixture.position.x, fixture.position.y, collabColor, lock.userName);
        }
      }
    }

    if (layerVisibility.terrain) {
      for (const patch of terrain) {
        drawTerrain2D(ctx, patch);
      }
    }

    if (layerVisibility.landscape) {
      for (const element of landscapeElements) {
        drawLandscape2D(ctx, element);
      }
    }

    if (currentTool === 'terrain' && terrainVertices.length > 0 && hoveredPoint) {
      drawTerrainPreview(
        ctx,
        terrainVertices,
        hoveredPoint,
        getTerrainElevationPreset(terrainElevationIndex),
      );
    }

    if (layerVisibility.dimensions && dimensionVisibility) {
      for (const dimension of dimensions) {
        drawDimension(ctx, dimension, unitSystem);
      }
    }

    if (dimensionStart && hoveredPoint && currentTool === 'dimension') {
      drawDimension(ctx, { id: 'preview', start: dimensionStart, end: hoveredPoint }, unitSystem, true);
    }

    if (previewOpening) {
      drawPreviewOpening(ctx, previewOpening, walls, unitSystem);
    }

    if (isDrawing && startPoint && currentTool === 'wall') {
      // preview rendered in drawWallsLayer
    }

    if (marqueeRect && currentTool === 'select') {
      const { left, top, width, height } = normalizeSelectionRect(marqueeRect);
      ctx.save();
      ctx.fillStyle = 'rgba(184, 148, 31, 0.08)';
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([6, 4]);
      ctx.fillRect(left, top, width, height);
      ctx.strokeRect(left, top, width, height);
      ctx.setLineDash([]);
      ctx.restore();
    }

    if (layerVisibility.vastuOverlay && currentTool === 'vastu' && walls.length > 0) {
      drawVastuSectorOverlay(
        ctx,
        { walls, openings, labels, northOrientation },
        computeVastuOverlayRadius(walls),
      );
    }

    ctx.restore();

    if (currentTool === 'vastu' || northOrientation !== 0) {
      const center = { x: canvas.width - 72, y: 72 };
      const radius = 42;
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(((northOrientation - 90) * Math.PI) / 180);

      ctx.fillStyle = CHIP_FILL_ALPHA;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = COMPASS_STROKE;
      ctx.fillStyle = COMPASS_FILL;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = COMPASS_STROKE;
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i += 1) {
        const angle = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * (radius - 6), Math.sin(angle) * (radius - 6));
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.lineTo(0, radius);
      ctx.moveTo(-radius, 0);
      ctx.lineTo(radius, 0);
      ctx.stroke();

      ctx.fillStyle = GOLD_MUTED;
      ctx.font = CANVAS_FONT_COMPASS;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', 0, -radius + 16);
      ctx.restore();
    }
    };
    requestCanvasDraw('overlay');
  }, [canvasViewport, currentPoint, currentTool, dimensionStart, dimensionVisibility, dimensions, dragFurniturePosition, dragOpeningPosition, dragWallEndpointPosition, draggingFurnitureId, draggingOpeningId, draggingWallEndpoint, fixtures, furniture, gridSize, gridVisible, hoveredOpening, hoveredPoint, hoveredWall, isDrawing, labels, landscapeElements, layerVisibility, marqueeRect, mepSymbols, northOrientation, openings, previewOpening, requestCanvasDraw, roomWallSource, rooms, selectedFixtureId, selectedLabelId, selectedOpeningId, selectedWallId, selectedWallIds, snapEnabled, staircases, startPoint, terrain, terrainElevationIndex, terrainVertices, unitSystem, walls, bhumiCanvasMode]);

  return (
    <div
      ref={containerRef}
      className="vish-paper-grain vish-paper-grain--animated relative w-full max-w-full touch-manipulation"
      style={{
        width: canvasMetrics.displayWidth,
        height: canvasMetrics.displayHeight,
        maxWidth: '100%',
      }}
    >
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2">
      <span className="vish-canvas-hud-badge rounded-md border border-primary/25 bg-background/90 px-2 py-1 text-[10px] font-mono text-foreground shadow-sm backdrop-blur-sm">
        {(canvasViewport.zoom * 100).toFixed(0)}%
      </span>
      <button
        type="button"
        aria-label="Zoom out"
        className="vish-canvas-zoom-btn touch-target pointer-events-auto rounded-md border border-border bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm active:text-foreground"
        onClick={() => stepCanvasZoom('out')}
      >
        −
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        className="vish-canvas-zoom-btn touch-target pointer-events-auto rounded-md border border-border bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm active:text-foreground"
        onClick={() => stepCanvasZoom('in')}
      >
        +
      </button>
      {handleResetViewport && canvasViewport.zoom !== 1 && (
        <button
          type="button"
          aria-label="Reset canvas view"
          className="vish-canvas-hud-badge pointer-events-auto rounded-md border border-border bg-background/90 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur-sm active:text-foreground"
          onClick={handleResetViewport}
        >
          Reset view
        </button>
      )}
      <select
        value={bhumiCanvasMode}
        onChange={(e) => setBhumiCanvasMode(e.target.value)}
        className="vish-canvas-hud-badge pointer-events-auto rounded-md border border-border bg-background/90 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur-sm active:text-foreground outline-none cursor-pointer"
        aria-label="Canvas grid mode"
        data-testid="bhumi-mode-select"
      >
        <option value="sacred-parchment">Parchment</option>
        <option value="midnight-obsidian">Obsidian</option>
        <option value="industrial-slate">Slate</option>
        <option value="indigo-cyanotype">Cyanotype</option>
        <option value="aged-copper">Copper</option>
      </select>
    </div>
    {editingLabelId && (() => {
      const editingLabel = labels.find((l) => l.id === editingLabelId);
      const displayPos = editingLabel
        ? mapCanvasBufferToDisplay(
            mapWorldToCanvasBuffer(editingLabel.position, canvasViewport),
            canvasMetrics.bufferWidth,
            canvasMetrics.bufferHeight,
            canvasMetrics.displayWidth,
            canvasMetrics.displayHeight,
          )
        : { x: 0, y: 0 };
      const containerTop = containerRef.current?.getBoundingClientRect().top ?? 0;
      const keyboardOffset = computeLabelKeyboardOffset(containerTop, displayPos.y, keyboardBottomInset);
      return (
      <input
        ref={labelInputRef}
        type="text"
        value={editingLabelText}
        onChange={(e) => setEditingLabelText(e.target.value)}
        onBlur={commitLabelEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitLabelEdit();
          if (e.key === 'Escape') {
            setEditingLabelId(null);
            setEditingLabelText('');
          }
        }}
        className="absolute z-10 rounded border border-primary bg-background px-2 py-1 text-sm shadow-md"
        style={{
          left: displayPos.x,
          top: displayPos.y - 28 - keyboardOffset,
        }}
        autoFocus
        aria-label="Edit label text"
      />
      );
    })()}
    <canvas
      ref={canvasRef}
      width={canvasMetrics.bufferWidth}
      height={canvasMetrics.bufferHeight}
      style={{
        width: canvasMetrics.displayWidth,
        height: canvasMetrics.displayHeight,
        maxWidth: '100%',
      }}
      className={`architect-canvas vish-canvas-tool-${currentTool} touch-none select-none rounded-lg shadow-md`}
      data-testid="blueprint-canvas"
      data-tutorial="blueprint-canvas"
      data-current-tool={currentTool}
      data-input-mode={inputMode}
      aria-label="2D blueprint drawing canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={() => {
        if (isDrawing) return;
        setHoveredWall(null);
        setHoveredOpening(null);
        setPreviewOpening(null);
      }}
    />
    </div>
  );
}
