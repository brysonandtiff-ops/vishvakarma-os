/* @refresh reset */
// Main Blueprint Editor Page — Professional Workstation Layout
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Save, FolderOpen, FileDown, Plus, Package, Undo2, Redo2,
  Database, Wifi, WifiOff, ArrowRight, Layers, Pencil, Move3d,
  Zap, RefreshCw, Map, Box, Palette, Settings, ChevronDown,
  MousePointer2, Info,
  LayoutGrid, Magnet, ZoomIn, ZoomOut, Maximize2,
  PenLine, DoorOpen, AppWindow, Ruler,
} from 'lucide-react';
import KeyboardShortcuts from '@/components/editor/KeyboardShortcuts';
import AppLayout from '@/components/layouts/AppLayout';
import ToolRail from '@/components/editor/ToolRail';
import BlueprintCanvas from '@/components/editor/BlueprintCanvas';
import Viewport3D from '@/components/editor/Viewport3D';
import MaterialPicker from '@/components/editor/MaterialPicker';
import SolarTimeline from '@/components/editor/SolarTimeline';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import { getProjects, createProject, updateProject } from '@/db/api';
import type {
  Wall,
  Opening,
  ProjectManifest,
  ToolType,
  LightingConfig,
  Project,
} from '@/types';
import type { UnitSystem } from '@/utils/measurements';

// ── Supabase connection status ───────────────────────────────────────────────
function useSupabaseStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    setConnected(Boolean(url && key && url !== 'undefined' && key !== 'undefined'));
  }, []);
  return connected;
}

// ── 2D→3D sync pulse indicator ───────────────────────────────────────────────
function SyncIndicator({ wallCount, openingCount }: { wallCount: number; openingCount: number }) {
  const [syncing, setSyncing] = useState(false);
  const prevRef = useRef(wallCount + openingCount);

  useEffect(() => {
    const current = wallCount + openingCount;
    if (current !== prevRef.current) {
      prevRef.current = current;
      setSyncing(true);
      const t = setTimeout(() => setSyncing(false), 900);
      return () => clearTimeout(t);
    }
  }, [wallCount, openingCount]);

  return (
    <div
      className="flex items-center gap-1 rounded px-2 py-0.5"
      style={{ background: 'hsl(var(--ws-hover))' }}
    >
      <span className="font-technical text-[9px] text-ws-text-faint">2D</span>
      <ArrowRight className="h-2.5 w-2.5 text-ws-text-faint" />
      <span className="font-technical text-[9px] text-ws-text-faint">3D</span>
      <span
        className={`ml-0.5 h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
          syncing ? 'bg-ws-active' : 'bg-ws-text-faint'
        }`}
      />
      {syncing && <RefreshCw className="h-2.5 w-2.5 animate-spin text-ws-active" />}
    </div>
  );
}

// ── Save mode indicator ───────────────────────────────────────────────────────
function SaveModeBadge({ connected }: { connected: boolean | null }) {
  if (connected === null) return null;
  return (
    <div className="flex items-center gap-1 rounded px-2 py-0.5" style={{ background: 'hsl(var(--ws-hover))' }}>
      {connected ? (
        <>
          <Wifi className="h-2.5 w-2.5 text-success" />
          <span className="font-technical text-[9px] text-success">Cloud</span>
        </>
      ) : (
        <>
          <WifiOff className="h-2.5 w-2.5 text-ws-text-faint" />
          <span className="font-technical text-[9px] text-ws-text-faint">Local</span>
        </>
      )}
    </div>
  );
}

// ── Bottom status bar ────────────────────────────────────────────────────────
function StatusBar({
  currentTool,
  wallCount,
  openingCount,
  mousePos,
  snapEnabled,
}: {
  currentTool: ToolType;
  wallCount: number;
  openingCount: number;
  mousePos: { x: number; y: number };
  snapEnabled: boolean;
}) {
  const toolHints: Record<ToolType, string> = {
    select:  'Select — click to select, drag to move',
    wall:    'Wall — click to start, click to end',
    door:    'Door — click on wall to place',
    window:  'Window — click on wall to place',
    measure: 'Measure — click two points to measure',
  };

  return (
    <div className="ws-status-bar">
      {/* Tool hint */}
      <div className="ws-status-item active">
        <MousePointer2 className="h-2.5 w-2.5" />
        <span>{toolHints[currentTool]}</span>
      </div>

      <div className="ws-status-divider" />

      {/* Cursor coords */}
      <div className="ws-status-item">
        <span>X</span>
        <span className="text-ws-text">{mousePos.x.toFixed(0)}</span>
        <span className="mx-0.5">·</span>
        <span>Y</span>
        <span className="text-ws-text">{mousePos.y.toFixed(0)}</span>
      </div>

      <div className="ws-status-divider" />

      {/* Element counts */}
      <div className="ws-status-item">
        <span>Walls:</span>
        <span className="text-ws-text">{wallCount}</span>
        <span className="mx-0.5">·</span>
        <span>Openings:</span>
        <span className="text-ws-text">{openingCount}</span>
      </div>

      <div className="ws-status-divider" />

      {/* Snap */}
      <div className={`ws-status-item ${snapEnabled ? 'active' : ''}`}>
        <span>{snapEnabled ? '⊕ Snap ON' : '⊗ Snap OFF'}</span>
      </div>

      {/* Right-side spacer / version */}
      <div className="ml-auto ws-status-item">
        <span>Vishvakarma.OS v1.0.0</span>
      </div>
    </div>
  );
}

// ── First-run onboarding panel ────────────────────────────────────────────────
function OnboardingPanel({ onLoadSample, onNewProject }: { onLoadSample: () => void; onNewProject: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
      <div
        className="pointer-events-auto w-full max-w-xs rounded-lg shadow-2xl overflow-hidden"
        style={{
          background: 'hsl(220 14% 16%)',
          border: '1px solid hsl(var(--ws-border))',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid hsl(var(--ws-border))' }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded"
            style={{ background: 'hsl(var(--ws-active-bg))' }}
          >
            <Layers className="h-5 w-5 text-ws-active" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ws-text">Welcome to Vishvakarma.OS</p>
            <p className="text-[11px] text-ws-text-faint">Professional Blueprint Editor</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-1 px-5 py-3">
          {[
            { icon: Move3d, label: 'Draw walls on the 2D canvas', sub: 'Wall tool · press W' },
            { icon: Pencil, label: 'Place doors and windows',     sub: 'Door (D) · Window (N)' },
            { icon: Zap,    label: 'Watch 3D update live',         sub: '3D viewport syncs in real-time' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-3 rounded py-2">
              <div
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded"
                style={{ background: 'hsl(var(--ws-hover))' }}
              >
                <Icon className="h-3 w-3 text-ws-text-dim" />
              </div>
              <div>
                <p className="text-xs font-medium text-ws-text">{label}</p>
                <p className="text-[10px] text-ws-text-faint">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div
          className="flex flex-col gap-2 px-5 py-4"
          style={{ borderTop: '1px solid hsl(var(--ws-border))' }}
        >
          <button
            className="flex h-8 w-full items-center justify-center gap-2 rounded text-xs font-semibold transition-colors"
            style={{
              background: 'hsl(var(--ws-active))',
              color: '#fff',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            onClick={onLoadSample}
          >
            <Package className="h-3.5 w-3.5" />
            Load Sample Project
          </button>
          <button
            className="flex h-8 w-full items-center justify-center gap-2 rounded text-xs font-medium transition-colors"
            style={{
              background: 'hsl(var(--ws-hover))',
              color: 'hsl(var(--ws-text))',
              border: '1px solid hsl(var(--ws-border))',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--ws-active-bg))'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--ws-hover))'; }}
            onClick={onNewProject}
          >
            <Plus className="h-3.5 w-3.5" />
            Create New Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Application menu bar ─────────────────────────────────────────────────────
type MenuBarProps = {
  projectName: string;
  hasProject: boolean;
  walls: Wall[];
  openings: Opening[];
  lighting: LightingConfig;
  snapEnabled: boolean;
  gridVisible: boolean;
  show3DView: boolean;
  currentTool: ToolType;
  historyIndex: number;
  historyLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onNew: () => void;
  onLoad: () => void;
  onSave: () => void;
  onExport: () => void;
  onLoadSample: () => void;
  onToggle3D: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onSelectTool: (tool: ToolType) => void;
  supabaseConnected: boolean | null;
};

function MenuBar({
  projectName, hasProject, historyIndex, historyLength,
  onUndo, onRedo, onNew, onLoad, onSave, onExport, onLoadSample,
  snapEnabled, gridVisible, show3DView, currentTool,
  onToggle3D, onToggleGrid, onToggleSnap, onSelectTool,
  supabaseConnected,
}: MenuBarProps) {
  return (
    <div
      className="ws-menubar flex h-9 shrink-0 items-center"
      style={{ borderBottom: '1px solid hsl(var(--ws-border))' }}
    >
      {/* App name / brand */}
      <div
        className="flex h-full shrink-0 items-center gap-2 px-3"
        style={{ borderRight: '1px solid hsl(var(--ws-border))' }}
      >
        <Layers className="h-3.5 w-3.5 text-ws-active" />
        <span className="text-[11px] font-bold tracking-tight text-ws-text">Vishvakarma</span>
      </div>

      {/* File menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ws-menu-item">
            File <ChevronDown className="h-2.5 w-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={onNew}>
            <Plus className="mr-2 h-3.5 w-3.5" />新建项目
            <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLoad}>
            <FolderOpen className="mr-2 h-3.5 w-3.5" />打开项目
            <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLoadSample}>
            <Package className="mr-2 h-3.5 w-3.5" />加载示例
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSave} disabled={!hasProject}>
            <Save className="mr-2 h-3.5 w-3.5" />保存
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExport}>
            <FileDown className="mr-2 h-3.5 w-3.5" />导出 JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ws-menu-item">
            Edit <ChevronDown className="h-2.5 w-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={onUndo} disabled={historyIndex <= 0}>
            <Undo2 className="mr-2 h-3.5 w-3.5" />撤销
            <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRedo} disabled={historyIndex >= historyLength - 1}>
            <Redo2 className="mr-2 h-3.5 w-3.5" />重做
            <DropdownMenuShortcut>⌘⇧Z</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ws-menu-item">
            View <ChevronDown className="h-2.5 w-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={onToggle3D}>
            <Box className="mr-2 h-3.5 w-3.5" />
            {show3DView ? '隐藏 3D 视图' : '显示 3D 视图'}
            <DropdownMenuShortcut>3</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onToggleGrid}>
            <LayoutGrid className="mr-2 h-3.5 w-3.5" />
            {gridVisible ? '隐藏网格' : '显示网格'}
            <DropdownMenuShortcut>G</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleSnap}>
            <Magnet className="mr-2 h-3.5 w-3.5" />
            {snapEnabled ? '关闭吸附' : '开启吸附'}
            <DropdownMenuShortcut>⇧S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <ZoomIn className="mr-2 h-3.5 w-3.5" />放大
            <DropdownMenuShortcut>⌘+</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <ZoomOut className="mr-2 h-3.5 w-3.5" />缩小
            <DropdownMenuShortcut>⌘-</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Maximize2 className="mr-2 h-3.5 w-3.5" />适应窗口
            <DropdownMenuShortcut>⌘0</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tools menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ws-menu-item">
            Tools <ChevronDown className="h-2.5 w-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={() => onSelectTool('select')}>
            <MousePointer2
              className="mr-2 h-3.5 w-3.5"
              style={{ color: currentTool === 'select' ? 'hsl(var(--ws-active))' : undefined }}
            />
            选择工具
            <DropdownMenuShortcut>V</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSelectTool('wall')}>
            <PenLine
              className="mr-2 h-3.5 w-3.5"
              style={{ color: currentTool === 'wall' ? 'hsl(var(--ws-active))' : undefined }}
            />
            绘制墙体
            <DropdownMenuShortcut>W</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSelectTool('door')}>
            <DoorOpen
              className="mr-2 h-3.5 w-3.5"
              style={{ color: currentTool === 'door' ? 'hsl(var(--ws-active))' : undefined }}
            />
            放置门
            <DropdownMenuShortcut>D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSelectTool('window')}>
            <AppWindow
              className="mr-2 h-3.5 w-3.5"
              style={{ color: currentTool === 'window' ? 'hsl(var(--ws-active))' : undefined }}
            />
            放置窗户
            <DropdownMenuShortcut>N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSelectTool('measure')}>
            <Ruler
              className="mr-2 h-3.5 w-3.5"
              style={{ color: currentTool === 'measure' ? 'hsl(var(--ws-active))' : undefined }}
            />
            测量工具
            <DropdownMenuShortcut>M</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Help menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ws-menu-item">
            Help <ChevronDown className="h-2.5 w-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem>
            <Info className="mr-2 h-3.5 w-3.5" />键盘快捷键
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Database className="mr-2 h-3.5 w-3.5" />Spec v1.0.0
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Project name + undo/redo + connection */}
      <div className="flex items-center gap-2 px-3">
        <span className="max-w-[180px] truncate font-technical text-[10px] text-ws-text">
          {projectName}
        </span>
        <Separator orientation="vertical" className="h-4 bg-ws-border" />
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-ws-text-faint transition-colors hover:bg-ws-hover hover:text-ws-text disabled:opacity-30"
          onClick={onUndo}
          disabled={historyIndex <= 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3 w-3" />
        </button>
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-ws-text-faint transition-colors hover:bg-ws-hover hover:text-ws-text disabled:opacity-30"
          onClick={onRedo}
          disabled={historyIndex >= historyLength - 1}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-3 w-3" />
        </button>
        <Separator orientation="vertical" className="h-4 bg-ws-border" />
        <SaveModeBadge connected={supabaseConnected} />
      </div>
    </div>
  );
}

// ── Mode sidebar (left, icon rail) ────────────────────────────────────────────
type EditorMode = '2d' | '3d' | 'materials' | 'settings';

const modes: { id: EditorMode; icon: React.ElementType; label: string }[] = [
  { id: '2d',        icon: Map,      label: '2D Plan'  },
  { id: '3d',        icon: Box,      label: '3D View'  },
  { id: 'materials', icon: Palette,  label: 'Materials'},
  { id: 'settings',  icon: Settings, label: 'Settings' },
];

function ModeSidebar({
  activeMode,
  onModeChange,
  show3DView,
}: {
  activeMode: EditorMode;
  onModeChange: (m: EditorMode) => void;
  show3DView: boolean;
}) {
  return (
    <div
      className="flex h-full w-12 shrink-0 flex-col py-2"
      style={{
        background: 'hsl(var(--ws-sidebar))',
        borderRight: '1px solid hsl(var(--ws-border))',
      }}
    >
      {modes.map(({ id, icon: Icon, label }) => {
        const isActive = activeMode === id || (id === '3d' && show3DView && activeMode === '2d');
        const isActivePrimary = activeMode === id;
        return (
          <button
            key={id}
            className={`ws-mode-button ${isActivePrimary ? 'active' : ''}`}
            onClick={() => onModeChange(id)}
            title={label}
            aria-label={label}
            aria-pressed={isActivePrimary}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-ws-active' : ''}`} />
            <span
              style={{
                fontSize: '8px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: isActivePrimary
                  ? 'hsl(var(--ws-active))'
                  : 'hsl(var(--ws-text-faint))',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Spec hash ────────────────────────────────────────────────────────────────
const SPEC_VERSION = '1.0.0';


// ── New Project dialog ────────────────────────────────────────────────────────
function NewProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onProjectCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Project name is required'); return; }

    const initialManifest: ProjectManifest = {
      version: '1.0.0',
      name,
      description,
      walls: [],
      openings: [],
      materials: [],
      floorMaterial: 'material-concrete',
      lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
      gridSize: 20,
      snapToGrid: true,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      },
    };

    try {
      await createProject(name, description || undefined, initialManifest);
      toast.success('Project created');
      onOpenChange(false);
      setName('');
      setDescription('');
      onProjectCreated();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 rounded px-2 text-[11px] font-medium text-ws-text-dim hover:bg-ws-hover hover:text-ws-text"
        >
          <Plus className="h-3 w-3" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Blueprint Project"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional project description"
              rows={3}
            />
          </div>
          <Button onClick={handleCreate} className="w-full">
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// EDITOR PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function EditorPage() {
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [show3DView, setShow3DView] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [unitSystem] = useState<UnitSystem>('metric');
  const [selectedWallId, setSelectedWallId] = useState<string>();
  const [selectedMaterial, setSelectedMaterial] = useState('material-paint');
  const [activeMode, setActiveMode] = useState<EditorMode>('2d');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const supabaseConnected = useSupabaseStatus();

  const [walls, setWalls] = useState<Wall[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [lighting, setLighting] = useState<LightingConfig>({
    sunAzimuth: 180,
    sunElevation: 45,
    timeOfDay: 12,
    intensity: 1,
  });

  const isEmpty = walls.length === 0 && openings.length === 0;
  const showOnboarding = isEmpty && !currentProject;

  // Undo/Redo
  const [history, setHistory] = useState<{ walls: Wall[]; openings: Opening[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = useCallback(() => {
    const newState = { walls, openings };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    setHistory(newHistory);
  }, [walls, openings, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setWalls(state.walls);
      setOpenings(state.openings);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setWalls(state.walls);
      setOpenings(state.openings);
    }
  }, [history, historyIndex]);

  // Mode sidebar → sync 3D view toggle
  const handleModeChange = (mode: EditorMode) => {
    setActiveMode(mode);
    if (mode === '3d') setShow3DView(true);
    if (mode === '2d') { /* keep 3D open alongside */ }
  };

  useEffect(() => { loadProjects(); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault(); redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWallId) {
        e.preventDefault();
        setWalls((prev) => prev.filter((w) => w.id !== selectedWallId));
        setOpenings((prev) => prev.filter((o) => o.wallId !== selectedWallId));
        setSelectedWallId(undefined);
        saveToHistory();
      } else if (e.key === 'v' || e.key === 'V') { setCurrentTool('select'); }
        else if (e.key === 'w' || e.key === 'W') { setCurrentTool('wall'); }
        else if (e.key === 'd' || e.key === 'D') { setCurrentTool('door'); }
        else if (e.key === 'n' || e.key === 'N') { setCurrentTool('window'); }
        else if (e.key === 'm' || e.key === 'M') { setCurrentTool('measure'); }
        else if (e.key === 'g' || e.key === 'G') { setGridVisible((prev) => !prev); }
        else if (e.key === 's' && e.shiftKey) { e.preventDefault(); setSnapEnabled((prev) => !prev); }
        else if (e.key === '3') { setShow3DView((prev) => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedWallId, saveToHistory]);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const loadSampleProject = async () => {
    try {
      const response = await fetch('/samples/sample-house-01.json');
      const sampleManifest: ProjectManifest = await response.json();
      setWalls(sampleManifest.walls);
      setOpenings(sampleManifest.openings);
      setLighting(sampleManifest.lighting);
      setGridVisible(sampleManifest.snapToGrid);
      setSnapEnabled(sampleManifest.snapToGrid);
      toast.success('Sample project loaded');
    } catch (error) {
      console.error('Failed to load sample project:', error);
      toast.error('Failed to load sample project');
    }
  };

  const handleWallAdd = (wall: Wall) => { setWalls([...walls, wall]); saveToHistory(); };
  const handleOpeningAdd = (opening: Opening) => { setOpenings([...openings, opening]); saveToHistory(); };

  const handleWallUpdate = (wallId: string, updates: Partial<Wall>) => {
    setWalls((prev) => prev.map((wall) => (wall.id === wallId ? { ...wall, ...updates } : wall)));
  };

  const handleOpeningUpdate = (openingId: string, updates: Partial<Opening>) => {
    setOpenings((prev) =>
      prev.map((opening) => (opening.id === openingId ? { ...opening, ...updates } : opening))
    );
  };

  const handleWallDelete = (wallId: string) => {
    setWalls((prev) => prev.filter((w) => w.id !== wallId));
    setOpenings((prev) => prev.filter((o) => o.wallId !== wallId));
    setSelectedWallId(undefined);
    saveToHistory();
  };

  const handleOpeningDelete = (openingId: string) => {
    setOpenings((prev) => prev.filter((o) => o.id !== openingId));
  };

  const buildManifest = (): ProjectManifest => ({
    version: SPEC_VERSION,
    name: currentProject?.name || 'Untitled Project',
    description: currentProject?.description,
    walls,
    openings,
    materials: [],
    floorMaterial: 'material-concrete',
    lighting,
    gridSize: 20,
    snapToGrid: snapEnabled,
    metadata: {
      created: currentProject?.created_at || new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  });

  const handleSaveProject = async () => {
    if (!currentProject) { toast.info('Please create a project first'); return; }
    try {
      const updated = await updateProject(currentProject.id, { manifest: buildManifest() });
      setCurrentProject(updated);
      toast.success('Project saved');
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    }
  };

  const handleLoadProject = (project: Project) => {
    setCurrentProject(project);
    setWalls(project.manifest.walls || []);
    setOpenings(project.manifest.openings || []);
    setLighting(project.manifest.lighting || lighting);
    setSnapEnabled(project.manifest.snapToGrid ?? true);
    setLoadDialogOpen(false);
    toast.success(`Loaded: ${project.name}`);
  };

  const handleExportJSON = () => {
    const manifest = buildManifest();
    const dataStr = JSON.stringify(manifest, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${manifest.name.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as JSON');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div
        className="flex h-screen flex-col overflow-hidden"
        style={{ background: 'hsl(var(--ws-canvas))' }}
      >
        {/* ── Menu Bar ── */}
        <MenuBar
          projectName={currentProject?.name || 'Untitled Project'}
          hasProject={Boolean(currentProject)}
          walls={walls}
          openings={openings}
          lighting={lighting}
          snapEnabled={snapEnabled}
          gridVisible={gridVisible}
          show3DView={show3DView}
          currentTool={currentTool}
          historyIndex={historyIndex}
          historyLength={history.length}
          onUndo={undo}
          onRedo={redo}
          onNew={() => setNewProjectOpen(true)}
          onLoad={() => setLoadDialogOpen(true)}
          onSave={handleSaveProject}
          onExport={handleExportJSON}
          onLoadSample={loadSampleProject}
          onToggle3D={() => { setShow3DView((v) => !v); }}
          onToggleGrid={() => setGridVisible((v) => !v)}
          onToggleSnap={() => setSnapEnabled((v) => !v)}
          onSelectTool={setCurrentTool}
          supabaseConnected={supabaseConnected}
        />

        {/* ── Sub-toolbar strip ── */}
        <div
          className="flex h-8 shrink-0 items-center gap-2 px-3"
          style={{
            background: 'hsl(var(--ws-toolbar))',
            borderBottom: '1px solid hsl(var(--ws-border))',
          }}
        >
          {/* Sync + keyboard shortcuts */}
          {show3DView && (
            <SyncIndicator wallCount={walls.length} openingCount={openings.length} />
          )}
          <div className="ml-auto flex items-center gap-1">
            <KeyboardShortcuts />
            <NewProjectDialog
              open={newProjectOpen}
              onOpenChange={setNewProjectOpen}
              onProjectCreated={loadProjects}
            />
            {/* Load dialog */}
            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1.5 rounded px-2 text-[11px] font-medium text-ws-text-dim hover:bg-ws-hover hover:text-ws-text"
                >
                  <FolderOpen className="h-3 w-3" />
                  Open
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Open Project</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-80">
                  {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
                      <p className="mt-3 text-sm text-muted-foreground">No saved projects yet</p>
                      <p className="mt-1 text-xs text-muted-foreground/60">Create a new project to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pr-2">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent hover:border-primary/40"
                          onClick={() => handleLoadProject(project)}
                        >
                          <p className="font-semibold text-foreground">{project.name}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {project.description || 'No description'}
                          </p>
                          <p className="mt-2 font-mono text-xs text-muted-foreground/60">
                            {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Main Editor Area ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Mode Sidebar */}
          <ModeSidebar
            activeMode={activeMode}
            onModeChange={handleModeChange}
            show3DView={show3DView}
          />

          {/* Tool Rail */}
          <ToolRail
            currentTool={currentTool}
            onToolChange={setCurrentTool}
            show3DView={show3DView}
            onToggle3DView={() => {
              setShow3DView(!show3DView);
              if (!show3DView) setActiveMode('3d');
            }}
            gridVisible={gridVisible}
            onToggleGrid={() => setGridVisible(!gridVisible)}
            snapEnabled={snapEnabled}
            onToggleSnap={() => setSnapEnabled(!snapEnabled)}
          />

          {/* Canvas + 3D split */}
          <div className="flex flex-1 min-w-0 overflow-hidden">

            {/* 2D Canvas pane */}
            <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
              {/* Pane header */}
              <div className="ws-pane-header">
                <span className="ws-pane-label">2D Blueprint</span>
                <span className="ws-pane-stat">
                  {walls.length}w · {openings.length}o
                </span>
              </div>

              {/* Canvas */}
              <div
                className="relative flex-1 overflow-auto"
                style={{ background: 'hsl(var(--ws-canvas))' }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
              >
                <BlueprintCanvas
                  walls={walls}
                  openings={openings}
                  currentTool={currentTool}
                  gridVisible={gridVisible}
                  snapEnabled={snapEnabled}
                  gridSize={20}
                  onWallAdd={handleWallAdd}
                  onOpeningAdd={handleOpeningAdd}
                  onWallSelect={setSelectedWallId}
                  selectedWallId={selectedWallId}
                  unitSystem={unitSystem}
                />
                {showOnboarding && (
                  <OnboardingPanel
                    onLoadSample={loadSampleProject}
                    onNewProject={() => setNewProjectOpen(true)}
                  />
                )}
              </div>
            </div>

            {/* 3D Viewport pane */}
            {show3DView && (
              <div
                className="flex w-80 shrink-0 flex-col md:w-96"
                style={{ borderLeft: '1px solid hsl(var(--ws-border))' }}
              >
                <div className="ws-pane-header">
                  <span className="ws-pane-label">3D Preview</span>
                  <span className="ws-pane-stat">Model Chamber</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Viewport3D walls={walls} openings={openings} lighting={lighting} />
                </div>
              </div>
            )}
          </div>

          {/* Right Properties Panel — light surface */}
          <div
            className="ws-panel-light flex w-72 shrink-0 flex-col overflow-hidden"
          >
            {/* Panel header */}
            <div
              className="flex h-8 shrink-0 items-center px-4"
              style={{ borderBottom: '1px solid hsl(0 0% 90%)', background: 'hsl(0 0% 98%)' }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'hsl(0 0% 50%)',
                }}
              >
                Properties
              </span>
            </div>

            {/* Scrollable panel content */}
            <ScrollArea className="flex-1">
              <div className="space-y-0">
                <PropertiesPanel
                  selectedWall={walls.find((w) => w.id === selectedWallId)}
                  openings={openings}
                  onWallUpdate={handleWallUpdate}
                  onOpeningUpdate={handleOpeningUpdate}
                  onWallDelete={handleWallDelete}
                  onOpeningDelete={handleOpeningDelete}
                />

                {/* Divider */}
                <div style={{ height: '1px', background: 'hsl(0 0% 90%)', margin: '0 16px' }} />

                <div className="px-4 py-3">
                  <p
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'hsl(0 0% 50%)',
                      marginBottom: '10px',
                    }}
                  >
                    Materials
                  </p>
                  <MaterialPicker
                    materials={[]}
                    selectedMaterial={selectedMaterial}
                    onMaterialSelect={setSelectedMaterial}
                  />
                </div>

                <div style={{ height: '1px', background: 'hsl(0 0% 90%)', margin: '0 16px' }} />

                <div className="px-4 py-3">
                  <p
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'hsl(0 0% 50%)',
                      marginBottom: '10px',
                    }}
                  >
                    Solar / Lighting
                  </p>
                  <SolarTimeline lighting={lighting} onLightingChange={setLighting} />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* ── Status Bar ── */}
        <StatusBar
          currentTool={currentTool}
          wallCount={walls.length}
          openingCount={openings.length}
          mousePos={mousePos}
          snapEnabled={snapEnabled}
        />
      </div>
    </AppLayout>
  );
}
