import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { Box, DoorOpen, Download, Grid3X3, Hand, MousePointer2, Redo2, Slash, Trash2, Undo2, Warehouse } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import type { LightingConfig, Material, Opening, ProjectManifest, Room, Wall } from '@/types';

const Viewport3D = lazy(() => import('@/components/editor/Viewport3D'));

type Tool = 'select' | 'wall' | 'door' | 'window' | 'pan' | 'delete';
type Pt = { x: number; y: number };
type View = { zoom: number; tx: number; ty: number };
type Snapshot = { walls: Wall[]; openings: Opening[]; rooms: Room[] };

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

function buildManifest(snapshot: Snapshot): ProjectManifest {
  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    name: 'Vishvakarma Lite Editor Plan',
    description: 'Stable 2D/3D recovery editor manifest generated from the VIP working editor pattern.',
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
    snapToGrid: true,
    northOrientation: 0,
    metadata: { created: now, modified: now, author: 'Vishvakarma.OS Lite Editor', systemVersions: { source: 'vip-working-editor-adapter' } },
  };
}

export default function LiteEditorPage() {
  const [history, setHistory] = useState<Snapshot[]>([sample()]);
  const [cursor, setCursor] = useState(0);
  const [tool, setTool] = useState<Tool>('wall');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [show3D, setShow3D] = useState(true);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [view, setView] = useState<View>({ zoom: 0.82, tx: 80, ty: 70 });
  const [tempWall, setTempWall] = useState<Wall | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gestureRef = useRef<{ mode: 'none' | 'pan' | 'draw'; start: Pt; startView: View }>({ mode: 'none', start: { x: 0, y: 0 }, startView: view });
  const snapshot = history[cursor] ?? empty();
  const activeWall = selectedWallId ? snapshot.walls.find((wall) => wall.id === selectedWallId) : null;

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
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = snapPt(pointFromEvent(event), snapEnabled);
    gestureRef.current = { mode: 'none', start: { x: event.clientX, y: event.clientY }, startView: view };

    if (tool === 'pan') {
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
        commit({ walls: snapshot.walls.filter((w) => w.id !== hit.wall.id), openings: snapshot.openings.filter((o) => o.wallId !== hit.wall.id), rooms: snapshot.rooms });
      }
      return;
    }
    if (tool === 'door' || tool === 'window') {
      addOpening(tool, point);
      return;
    }
    const wall: Wall = { id: id('wall'), start: point, end: point, thickness: 16, height: 270, material: 'material-concrete' };
    setTempWall(wall);
    gestureRef.current.mode = 'draw';
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const gesture = gestureRef.current;
    if (gesture.mode === 'pan') {
      setView({ ...gesture.startView, tx: gesture.startView.tx + event.clientX - gesture.start.x, ty: gesture.startView.ty + event.clientY - gesture.start.y });
      return;
    }
    if (gesture.mode === 'draw' && tempWall) {
      setTempWall({ ...tempWall, end: snapPt(pointFromEvent(event), snapEnabled) });
    }
  };

  const handlePointerUp = () => {
    if (gestureRef.current.mode === 'draw' && tempWall && length(tempWall) > 20) {
      commit({ ...snapshot, walls: [...snapshot.walls, tempWall] });
      setSelectedWallId(tempWall.id);
    }
    setTempWall(null);
    gestureRef.current.mode = 'none';
  };

  const zoomBy = (factor: number) => setView((current) => ({ ...current, zoom: Math.max(0.35, Math.min(2.4, current.zoom * factor)) }));
  const undo = () => setCursor((current) => Math.max(0, current - 1));
  const redo = () => setCursor((current) => Math.min(history.length - 1, current + 1));
  const clear = () => { commit(empty()); setSelectedWallId(null); };
  const loadSample = () => { commit(sample()); setSelectedWallId(null); };
  const downloadManifest = () => {
    const blob = new Blob([JSON.stringify(buildManifest(snapshot), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'vishvakarma-lite-editor-manifest.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let x = -1000; x <= 1800; x += GRID) lines.push(<line key={`x-${x}`} x1={x} y1={-1000} x2={x} y2={1400} />);
    for (let y = -1000; y <= 1400; y += GRID) lines.push(<line key={`y-${y}`} x1={-1000} y1={y} x2={1800} y2={y} />);
    return lines;
  }, []);

  const stats = { walls: snapshot.walls.length, openings: snapshot.openings.length, rooms: snapshot.rooms.length };

  return (
    <>
      <PageMeta title="Lite 2D/3D Editor — Vishvakarma.OS" description="Stable 2D wall editor and live 3D preview adapted from the working VIP editor pattern." />
      <main className="vish-editor-shell bg-ws-canvas text-ws-text" data-testid="lite-editor-page">
        <div className="vish-editor-topbar flex min-h-[72px] flex-wrap items-center gap-3 border-b px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Stable Recovery Editor</p>
            <h1 className="truncate text-lg font-semibold vish-text-heading">Working 2D + 3D Editor</h1>
            <p className="text-xs text-ws-text-dim">VIP working editor pattern + Vish features: snap/grid, doors/windows, undo/redo, export, current 3D renderer, iPad-safe UI.</p>
          </div>
          <Button asChild variant="outline" className="vish-gold-action"><Link to="/editor">Open Full Studio</Link></Button>
          <Button variant="gold" className="vish-gold-action" onClick={downloadManifest}><Download className="h-4 w-4" /> Export JSON</Button>
        </div>

        <div className="flex h-[calc(100dvh-72px)] min-h-0 flex-col lg:flex-row">
          <aside className="vish-tool-rail flex shrink-0 flex-row gap-2 overflow-x-auto border-b p-2 lg:w-[86px] lg:flex-col lg:border-b-0 lg:border-r" aria-label="Lite editor tools">
            {[
              ['select', MousePointer2, 'Select'],
              ['wall', Slash, 'Wall'],
              ['door', DoorOpen, 'Door'],
              ['window', Warehouse, 'Window'],
              ['pan', Hand, 'Pan'],
              ['delete', Trash2, 'Delete'],
            ].map(([value, Icon, label]) => (
              <button key={String(value)} type="button" onClick={() => setTool(value as Tool)} aria-pressed={tool === value} className={`touch-target flex min-w-[64px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-[10px] font-semibold ${tool === value ? 'border-primary bg-primary/15 text-primary' : 'border-ws-border bg-ws-toolbar/70 text-ws-text-dim'}`}>
                <Icon className="mb-1 h-4 w-4" />{label}
              </button>
            ))}
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="vish-editor-file-strip flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs text-ws-text-dim">
              <Button size="sm" variant="outline" onClick={undo} disabled={cursor === 0}><Undo2 className="h-3.5 w-3.5" /> Undo</Button>
              <Button size="sm" variant="outline" onClick={redo} disabled={cursor >= history.length - 1}><Redo2 className="h-3.5 w-3.5" /> Redo</Button>
              <Button size="sm" variant="outline" onClick={() => setGridVisible((v) => !v)}><Grid3X3 className="h-3.5 w-3.5" /> Grid {gridVisible ? 'On' : 'Off'}</Button>
              <Button size="sm" variant="outline" onClick={() => setSnapEnabled((v) => !v)}>Snap {snapEnabled ? 'On' : 'Off'}</Button>
              <Button size="sm" variant="outline" onClick={() => setShow3D((v) => !v)}><Box className="h-3.5 w-3.5" /> 3D {show3D ? 'On' : 'Off'}</Button>
              <Button size="sm" variant="outline" onClick={loadSample}>Load Sample</Button>
              <Button size="sm" variant="outline" onClick={clear}>Clear</Button>
              <span className="ml-auto rounded-full border border-primary/25 px-2 py-1 text-[10px] uppercase tracking-wider text-primary">{stats.walls} walls · {stats.openings} openings · {stats.rooms} rooms</span>
            </div>

            <div className={`flex min-h-0 flex-1 ${show3D ? 'flex-col xl:flex-row' : 'flex-col'}`}>
              <div className="vish-canvas-stage relative min-h-[360px] flex-1 overflow-hidden bg-[#f3ead3]">
                <svg ref={svgRef} data-testid="lite-blueprint-canvas" className="h-full w-full touch-none" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
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
                <div className="absolute bottom-3 left-3 rounded-xl border border-primary/25 bg-black/60 px-3 py-2 text-xs text-primary backdrop-blur-md">Tool: {tool} · {activeWall ? `Selected ${Math.round(length(activeWall))}px wall` : 'Tap/draw on canvas'}</div>
                <div className="absolute bottom-3 right-3 flex gap-1"><Button size="sm" variant="outline" onClick={() => zoomBy(1.16)}>+</Button><Button size="sm" variant="outline" onClick={() => zoomBy(0.86)}>-</Button></div>
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
