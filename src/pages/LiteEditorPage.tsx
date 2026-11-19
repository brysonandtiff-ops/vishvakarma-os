import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, DoorOpen, Download, Grid3X3, Hand, Maximize, MousePointer2, Redo2, Slash, Trash2, Undo2, Warehouse, type LucideIcon } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import { PROJECT_SPEC_VERSION } from '@/core/projectModel';
import { getLiteEditorManifest, type LiteEditorHandoff } from '@/editor/liteEditorHandoff';
import type { LightingConfig, Material, Opening, ProjectManifest, Room, Wall } from '@/types';

const Viewport3D = lazy(() => import('@/components/editor/Viewport3D'));

type Tool = 'select' | 'wall' | 'door' | 'window' | 'pan' | 'delete';
type Pt = { x: number; y: number };
type View = { zoom: number; tx: number; ty: number };
type Snapshot = { walls: Wall[]; openings: Opening[]; rooms: Room[] };
const DEFAULT_VIEW: View = { zoom: 0.82, tx: 80, ty: 70 };

const LITE_TOOLS: Array<{ value: Tool; Icon: LucideIcon; label: string }> = [
  { value: 'select', Icon: MousePointer2, label: 'Select' },
  { value: 'wall', Icon: Slash, label: 'Wall' },
  { value: 'door', Icon: DoorOpen, label: 'Door' },
  { value: 'window', Icon: Warehouse, label: 'Window' },
  { value: 'pan', Icon: Hand, label: 'Pan' },
  { value: 'delete', Icon: Trash2, label: 'Delete' },
];

const GRID = 50;
const MATERIALS: Material[] = [
  { id: 'material-concrete', name: 'Architectural Concrete', type: 'concrete', color: '#d7c6a7', roughness: 0.88 },
  { id: 'material-glass', name: 'Sacred Glass', type: 'glass', color: '#8ed7ff', roughness: 0.16, metalness: 0.02 },
  { id: 'material-timber', name: 'Warm Timber', type: 'wood', color: '#8a5525', roughness: 0.72 },
];
const LIGHTING: LightingConfig = { sunAzimuth: 135, sunElevation: 48, timeOfDay: 14, intensity: 1.1 };

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function sample(): Snapshot {
  const walls: Wall[] = [
    { id: 'lite-w-1', start: { x: 120, y: 120 }, end: { x: 760, y: 120 }, thickness: 16, height: 270, material: 'material-concrete' },
    { id: 'lite-w-2', start: { x: 760, y: 120 }, end: { x: 760, y: 520 }, thickness: 16, height: 270, material: 'material-concrete' },
    { id: 'lite-w-3', start: { x: 760, y: 520 }, end: { x: 120, y: 520 }, thickness: 16, height: 270, material: 'material-concrete' },
    { id: 'lite-w-4', start: { x: 120, y: 520 }, end: { x: 120, y: 120 }, thickness: 16, height: 270, material: 'material-concrete' },
    { id: 'lite-w-5', start: { x: 430, y: 120 }, end: { x: 430, y: 520 }, thickness: 14, height: 270, material: 'material-timber', fachwerk: true },
  ];
  return {
    walls,
    openings: [
      { id: 'lite-d-1', type: 'door', wallId: 'lite-w-3', position: 0.28, width: 90, height: 210 },
      { id: 'lite-win-1', type: 'window', wallId: 'lite-w-1', position: 0.72, width: 140, height: 110, sillHeight: 90 },
    ],
    rooms: [
      { id: 'lite-room-1', name: 'Studio', wallIds: ['lite-w-1', 'lite-w-3', 'lite-w-4', 'lite-w-5'], center: { x: 275, y: 320 }, area: 18.6, roomType: 'Studio' },
      { id: 'lite-room-2', name: 'Gallery', wallIds: ['lite-w-1', 'lite-w-2', 'lite-w-3', 'lite-w-5'], center: { x: 595, y: 320 }, area: 25.6, roomType: 'Living' },
    ],
  };
}

function empty(): Snapshot {
  return { walls: [], openings: [], rooms: [] };
}

function snapPt(point: Pt, enabled: boolean): Pt {
  if (!enabled) return point;
  return { x: Math.round(point.x / GRID) * GRID, y: Math.round(point.y / GRID) * GRID };
}

function length(wall: Wall) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

function fitPlan(walls: Wall[], width: number, height: number): View {
  if (walls.length === 0 || width <= 0 || height <= 0) return DEFAULT_VIEW;
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const { start, end } of walls) {
    left = Math.min(left, start.x, end.x);
    right = Math.max(right, start.x, end.x);
    top = Math.min(top, start.y, end.y);
    bottom = Math.max(bottom, start.y, end.y);
  }
  const zoom = Math.max(0.05, Math.min(1.4, (width - 48) / Math.max(1, right - left), (height - 80) / Math.max(1, bottom - top)));

  return { zoom, tx: (width - (left + right) * zoom) / 2, ty: (height - (top + bottom) * zoom) / 2 };
}

function nearestWall(walls: Wall[], point: Pt, zoom: number) {
  const tolerance = Math.max(12, 18 / zoom);
  let best: { wall: Wall; distance: number; t: number } | null = null;
  for (const wall of walls) {
    const len = length(wall);
    if (len < 1) continue;
    const tRaw = ((point.x - wall.start.x) * (wall.end.x - wall.start.x) + (point.y - wall.start.y) * (wall.end.y - wall.start.y)) / (len * len);
    const t = Math.max(0, Math.min(1, tRaw));
    const px = wall.start.x + (wall.end.x - wall.start.x) * t;
    const py = wall.start.y + (wall.end.y - wall.start.y) * t;
    const distance = Math.hypot(px - point.x, py - point.y);
    if (distance <= tolerance && (!best || distance < best.distance)) best = { wall, distance, t };
  }
  return best;
}

function buildManifest(snapshot: Snapshot, snapEnabled: boolean): ProjectManifest {
  const now = new Date().toISOString();
  return {
    version: PROJECT_SPEC_VERSION,
    name: 'Vishvakarma Lite Editor Plan',
    description: 'Stable 2D/3D recovery editor manifest generated from the Vishvakarma.OS working editor pattern.',
    walls: snapshot.walls,
    openings: snapshot.openings,
    rooms: snapshot.rooms,
    labels: snapshot.rooms.map((room) => ({ id: `label-${room.id}`, text: room.name, position: room.center ?? { x: 0, y: 0 }, fontSize: 14, color: '#f1c768' })),
    dimensions: [],
    furniture: [],
    mepSymbols: [],
    fixtures: [],
    landscapeElements: [],
    terrain: [],
    costItems: [],
    staircases: [],
    materials: MATERIALS,
    floorMaterial: 'material-concrete',
    lighting: LIGHTING,
    gridSize: GRID,
    snapToGrid: snapEnabled,
    northOrientation: 0,
    metadata: { created: now, modified: now, author: 'Vishvakarma.OS Lite Editor', systemVersions: { source: 'vish-working-editor-adapter' } },
  };
}

export default function LiteEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const returnedPlan = getLiteEditorManifest(location.state);
  const [history, setHistory] = useState<Snapshot[]>(() => [returnedPlan
    ? { walls: returnedPlan.walls, openings: returnedPlan.openings, rooms: returnedPlan.rooms ?? [] }
    : sample()]);
  const [cursor, setCursor] = useState(0);
  const [tool, setTool] = useState<Tool>('wall');
  const [snapEnabled, setSnapEnabled] = useState(returnedPlan?.snapToGrid ?? true);
  const [gridVisible, setGridVisible] = useState(true);
  const [show3D, setShow3D] = useState(true);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [tempWall, setTempWall] = useState<Wall | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const initialWallsRef = useRef(history[0].walls);
  const manualViewRef = useRef(false);
  const gestureRef = useRef<{ mode: 'none' | 'pan' | 'draw'; start: Pt; startView: View }>({ mode: 'none', start: { x: 0, y: 0 }, startView: view });
  const snapshot = history[cursor] ?? empty();
  const activeWall = selectedWallId ? snapshot.walls.find((wall) => wall.id === selectedWallId) : null;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const fitInitialPlan = () => {
      if (manualViewRef.current) return;
      const { width, height } = svg.getBoundingClientRect();
      setView(fitPlan(initialWallsRef.current, width, height));
    };
    fitInitialPlan();
    const observer = new ResizeObserver(fitInitialPlan);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const commit = useCallback((next: Snapshot) => {
    setHistory((existing) => [...existing.slice(0, cursor + 1), next].slice(-50));
    setCursor((current) => Math.min(current + 1, 49));
  }, [cursor]);

  const pointFromEvent = (event: ReactPointerEvent<SVGSVGElement>): Pt => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (event.clientX - rect.left - view.tx) / view.zoom, y: (event.clientY - rect.top - view.ty) / view.zoom };
  };

  const addOpening = (type: 'door' | 'window', point: Pt) => {
    const hit = nearestWall(snapshot.walls, point, view.zoom);
    if (!hit) return false;
    const opening: Opening = {
      id: id(type === 'door' ? 'door' : 'window'),
      type,
      wallId: hit.wall.id,
      position: hit.t,
      width: type === 'door' ? 90 : 130,
      height: type === 'door' ? 210 : 110,
      sillHeight: type === 'window' ? 90 : undefined,
    };
    commit({ ...snapshot, openings: [...snapshot.openings, opening] });
    setSelectedWallId(hit.wall.id);
    return true;
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    gestureRef.current = { mode: 'none', start: { x: event.clientX, y: event.clientY }, startView: view };

    if (tool === 'pan') {
      manualViewRef.current = true;
      gestureRef.current.mode = 'pan';
      return;
    }
    if (tool === 'select') {
      const hit = nearestWall(snapshot.walls, point, view.zoom);
      setSelectedWallId(hit?.wall.id ?? null);
      return;
    }
    if (tool === 'delete') {
      const hit = nearestWall(snapshot.walls, point, view.zoom);
      if (hit) {
        commit({
          walls: snapshot.walls.filter((wall) => wall.id !== hit.wall.id),
          openings: snapshot.openings.filter((opening) => opening.wallId !== hit.wall.id),
          rooms: snapshot.rooms.filter((room) => !room.wallIds.includes(hit.wall.id)),
        });
      }
      return;
    }
    if (tool === 'door' || tool === 'window') {
      addOpening(tool, point);
      return;
    }
    const start = snapPt(point, snapEnabled);
    const wall: Wall = { id: id('wall'), start, end: start, thickness: 16, height: 270, material: 'material-concrete' };
    setTempWall(wall);
    gestureRef.current.mode = 'draw';
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!event.isPrimary) return;
    const gesture = gestureRef.current;
    if (gesture.mode === 'pan') {
      setView({ ...gesture.startView, tx: gesture.startView.tx + event.clientX - gesture.start.x, ty: gesture.startView.ty + event.clientY - gesture.start.y });
      return;
    }
    if (gesture.mode === 'draw' && tempWall) {
      setTempWall({ ...tempWall, end: snapPt(pointFromEvent(event), snapEnabled) });
    }
  };

  const resetGesture = () => {
    setTempWall(null);
    gestureRef.current.mode = 'none';
  };

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!event.isPrimary) return;
    if (gestureRef.current.mode === 'draw' && tempWall) {
      const wall = { ...tempWall, end: snapPt(pointFromEvent(event), snapEnabled) };
      if (length(wall) > 20) {
        commit({ ...snapshot, walls: [...snapshot.walls, wall] });
        setSelectedWallId(wall.id);
      }
    }
    resetGesture();
  };

  const zoomBy = (factor: number) => {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return;
    manualViewRef.current = true;
    setView((current) => {
      const zoom = Math.max(0.05, Math.min(2.4, current.zoom * factor));
      const scale = zoom / current.zoom;
      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;
      return { zoom, tx: centerX + (current.tx - centerX) * scale, ty: centerY + (current.ty - centerY) * scale };
    });
  };
  const fitCurrentPlan = () => {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return;
    manualViewRef.current = true;
    setView(fitPlan(snapshot.walls, bounds.width, bounds.height));
  };
  const undo = () => setCursor((current) => Math.max(0, current - 1));
  const redo = () => setCursor((current) => Math.min(history.length - 1, current + 1));
  const clear = () => { commit(empty()); setSelectedWallId(null); };
  const loadSample = () => { commit(sample()); setSelectedWallId(null); };
  const openWorkspace = async (path: '/3d-room' | '/editor') => {
    const state: LiteEditorHandoff = { liteEditorManifest: buildManifest(snapshot, snapEnabled) };
    await navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state });
    void navigate(path, { state });
  };
  const downloadManifest = () => {
    const blob = new Blob([JSON.stringify(buildManifest(snapshot, snapEnabled), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'vishvakarma-lite-editor-manifest.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const gridLines = useMemo(() => {
    const lines: ReactNode[] = [];
    for (let x = -1000; x <= 1800; x += GRID) lines.push(<line key={`x-${x}`} x1={x} y1={-1000} x2={x} y2={1400} />);
    for (let y = -1000; y <= 1400; y += GRID) lines.push(<line key={`y-${y}`} x1={-1000} y1={y} x2={1800} y2={y} />);
    return lines;
  }, []);

  const stats = { walls: snapshot.walls.length, openings: snapshot.openings.length, rooms: snapshot.rooms.length };
  const zoomButtonStyle = { width: 44, minWidth: 44, height: 44, minHeight: 44, paddingInline: 0 };

  return (
    <>
      <PageMeta title="Draw in 2D — Vishvakarma.OS" description="Draw walls, doors and windows and explore your plan in the 3D Room." />
      <main className="vish-editor-shell bg-ws-canvas text-ws-text" data-testid="lite-editor-page">
        <div className="vish-editor-topbar border-b">
          <div className="flex min-h-[72px] w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2">
            <div className="min-w-0 flex-1 basis-64">
              <h1 className="text-lg font-semibold vish-text-heading">Draw your home in 2D</h1>
              <p className="text-xs text-ws-text-dim">Drag to draw a wall. Choose Door or Window, then select a wall to place it.</p>
            </div>
            <nav className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap" aria-label="Blueprint workflow">
              <Button asChild variant="workstation" size="sm" className="min-h-11 motion-reduce:transition-none motion-reduce:transform-none"><Link to="/projects"><ArrowLeft aria-hidden="true" /> Projects</Link></Button>
              <Button type="button" variant="gold" size="sm" className="min-h-11 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => void openWorkspace('/3d-room')}><Box aria-hidden="true" /> Open 3D Room</Button>
              <Button type="button" variant="workstation" size="sm" className="min-h-11 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => void openWorkspace('/editor')}>Full Studio</Button>
              <Button type="button" variant="workstation" size="sm" className="min-h-11 motion-reduce:transition-none motion-reduce:transform-none" onClick={downloadManifest}><Download aria-hidden="true" /> Export JSON</Button>
            </nav>
          </div>
        </div>

        <div className="flex h-[calc(100dvh-72px)] min-h-0 flex-col lg:flex-row">
          <aside className="vish-tool-rail flex shrink-0 flex-row gap-2 overflow-x-auto border-b p-2 lg:w-[86px] lg:flex-col lg:border-b-0 lg:border-r" aria-label="Lite editor tools">
            {LITE_TOOLS.map(({ value, Icon, label }) => (
              <button key={value} type="button" onClick={() => setTool(value)} aria-pressed={tool === value} className={`touch-target flex min-w-[64px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-[10px] font-semibold ${tool === value ? 'border-primary bg-primary/15 text-primary' : 'border-ws-border bg-ws-toolbar/70 text-ws-text-dim'}`}>
                <Icon className="mb-1 h-4 w-4" />{label}
              </button>
            ))}
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="vish-editor-file-strip flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs text-ws-text-dim">
              <Button size="sm" variant="outline" onClick={undo} disabled={cursor === 0}><Undo2 className="h-3.5 w-3.5" /> Undo</Button>
              <Button size="sm" variant="outline" onClick={redo} disabled={cursor >= history.length - 1}><Redo2 className="h-3.5 w-3.5" /> Redo</Button>
              <Button size="sm" variant="outline" aria-pressed={gridVisible} onClick={() => setGridVisible((v) => !v)}><Grid3X3 className="h-3.5 w-3.5" /> Grid {gridVisible ? 'On' : 'Off'}</Button>
              <Button size="sm" variant="outline" aria-pressed={snapEnabled} onClick={() => setSnapEnabled((v) => !v)}>Snap {snapEnabled ? 'On' : 'Off'}</Button>
              <Button size="sm" variant="outline" aria-pressed={show3D} onClick={() => setShow3D((v) => !v)}><Box className="h-3.5 w-3.5" /> 3D {show3D ? 'On' : 'Off'}</Button>
              <Button size="sm" variant="outline" onClick={loadSample}>Load Sample</Button>
              <Button size="sm" variant="outline" onClick={clear}>Clear</Button>
              <span className="ml-auto rounded-full border border-primary/25 px-2 py-1 text-[10px] uppercase tracking-wider text-primary">{stats.walls} walls · {stats.openings} openings · {stats.rooms} rooms</span>
            </div>

            <div className={`flex min-h-0 flex-1 ${show3D ? 'flex-col xl:flex-row' : 'flex-col'}`}>
              <div className="vish-canvas-stage relative min-h-[360px] flex-1 overflow-hidden bg-[#f3ead3]">
                <svg ref={svgRef} aria-label="2D blueprint" data-testid="lite-blueprint-canvas" className="h-full w-full touch-none" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={(event) => { if (event.isPrimary) resetGesture(); }}>
                  <defs>
                    <pattern id="lite-dot" width="50" height="50" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(87,65,33,.22)" /></pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#lite-dot)" opacity={gridVisible ? 1 : 0} />
                  <g transform={`translate(${view.tx} ${view.ty}) scale(${view.zoom})`}>
                    {gridVisible && <g stroke="rgba(96,72,38,.15)" strokeWidth="1">{gridLines}</g>}
                    {snapshot.rooms.map((room) => room.center && <text key={room.id} x={room.center.x} y={room.center.y} textAnchor="middle" className="fill-[#7a5a27] text-[18px] font-bold">{room.name}</text>)}
                    {snapshot.walls.map((wall) => (
                      <line key={wall.id} x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} stroke={wall.id === selectedWallId ? '#d89f35' : '#2d2315'} strokeWidth={wall.thickness} strokeLinecap="round" />
                    ))}
                    {tempWall && <line x1={tempWall.start.x} y1={tempWall.start.y} x2={tempWall.end.x} y2={tempWall.end.y} stroke="#d89f35" strokeWidth={tempWall.thickness} strokeDasharray="12 8" strokeLinecap="round" />}
                    {snapshot.openings.map((opening) => {
                      const wall = snapshot.walls.find((w) => w.id === opening.wallId);
                      if (!wall) return null;
                      const x = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
                      const y = wall.start.y + (wall.end.y - wall.start.y) * opening.position;
                      return <circle key={opening.id} cx={x} cy={y} r={opening.type === 'door' ? 18 : 14} fill={opening.type === 'door' ? '#b67825' : '#7fdcff'} stroke="#fff7d6" strokeWidth="3" />;
                    })}
                  </g>
                </svg>
                <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                  <div className="min-w-0 rounded-xl border border-primary/25 bg-black/75 px-3 py-2 text-xs text-[#f8e8c7]">
                    {activeWall ? `Wall · ${(length(activeWall) / 100).toFixed(2)} m` : LITE_TOOLS.find(({ value }) => value === tool)?.label}
                  </div>
                  <div className="pointer-events-auto flex shrink-0 gap-1">
                    <Button size="sm" variant="outline" className="!h-11 !w-11 !min-h-[44px] !min-w-[44px] !px-0" style={zoomButtonStyle} aria-label="Fit plan" title="Fit plan" onClick={fitCurrentPlan}><Maximize aria-hidden="true" /></Button>
                    <Button size="sm" variant="outline" className="!h-11 !w-11 !min-h-[44px] !min-w-[44px] !px-0" style={zoomButtonStyle} aria-label="Zoom in" onClick={() => zoomBy(1.16)}>+</Button>
                    <Button size="sm" variant="outline" className="!h-11 !w-11 !min-h-[44px] !min-w-[44px] !px-0" style={zoomButtonStyle} aria-label="Zoom out" onClick={() => zoomBy(0.86)}>-</Button>
                  </div>
                </div>
              </div>

              {show3D && (
                <aside className="vish-3d-viewport-pane min-h-[320px] xl:w-[42%]" data-testid="lite-3d-pane">
                  <Suspense fallback={<Viewport3DLoading />}>
                    <Viewport3D walls={snapshot.walls} openings={snapshot.openings} lighting={LIGHTING} materials={MATERIALS} rooms={snapshot.rooms} furniture={[]} mepSymbols={[]} fixtures={[]} landscapeElements={[]} terrain={[]} staircases={[]} floorMaterial="material-concrete" geometryRevision={cursor + snapshot.walls.length + snapshot.openings.length} />
                  </Suspense>
                </aside>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
