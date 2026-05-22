/* @refresh reset */
// Vishvakarma.OS — iPad-first blueprint editor workspace
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Box,
  CheckCircle2,
  FileDown,
  FolderOpen,
  Layers,
  MousePointer2,
  Plus,
  Save,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import AppLayout from '@/components/layouts/AppLayout';
import BlueprintCanvas from '@/components/editor/BlueprintCanvas';
import EditorCommandStrip from '@/components/editor/EditorCommandStrip';
import MaterialPicker from '@/components/editor/MaterialPicker';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import SolarTimeline from '@/components/editor/SolarTimeline';
import ToolRail from '@/components/editor/ToolRail';
import { createProject, getProjects, updateProject } from '@/db/api';
import type { LightingConfig, Opening, Project, ProjectManifest, ToolType, Wall } from '@/types';
import type { UnitSystem } from '@/utils/measurements';

const Viewport3D = lazy(() => import('@/components/editor/Viewport3D'));

const SPEC_VERSION = '1.0.0';
const DEFAULT_LIGHTING: LightingConfig = {
  sunAzimuth: 180,
  sunElevation: 45,
  timeOfDay: 12,
  intensity: 1,
};

function Viewport3DLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black/20 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
        <Box className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ws-text">Loading 3D engine</p>
        <p className="text-[11px] text-ws-text-faint">Three.js mounts only when 3D preview is opened.</p>
      </div>
    </div>
  );
}

function useSupabaseStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    setConnected(Boolean(url && key && url !== 'undefined' && key !== 'undefined'));
  }, []);

  return connected;
}

function SaveModeBadge({ connected }: { connected: boolean | null }) {
  if (connected === null) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-ws-border bg-black/20 px-3 py-1.5">
      {connected ? (
        <>
          <Wifi className="h-3.5 w-3.5 text-success" />
          <span className="font-technical text-[10px] text-success">Cloud Save</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 text-ws-text-faint" />
          <span className="font-technical text-[10px] text-ws-text-faint">Local Preview</span>
        </>
      )}
    </div>
  );
}

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
    select: 'Select — tap to inspect, drag handles to adjust',
    wall: 'Wall — tap start, tap end. Snap joins corners.',
    door: 'Door — tap a wall to place a door.',
    window: 'Window — tap a wall to place a window.',
    measure: 'Measure — hover or tap walls to inspect dimensions.',
  };

  return (
    <div className="ws-status-bar">
      <div className="ws-status-item active">
        <MousePointer2 className="h-2.5 w-2.5" />
        <span>{toolHints[currentTool]}</span>
      </div>
      <div className="ws-status-divider" />
      <div className="ws-status-item">
        <span>X</span><span className="text-ws-text">{mousePos.x.toFixed(0)}</span>
        <span className="mx-0.5">·</span>
        <span>Y</span><span className="text-ws-text">{mousePos.y.toFixed(0)}</span>
      </div>
      <div className="ws-status-divider" />
      <div className="ws-status-item">
        <span>Walls:</span><span className="text-ws-text">{wallCount}</span>
        <span className="mx-0.5">·</span>
        <span>Openings:</span><span className="text-ws-text">{openingCount}</span>
      </div>
      <div className="ws-status-divider" />
      <div className={`ws-status-item ${snapEnabled ? 'active' : ''}`}>
        <span>{snapEnabled ? '⊕ Snap ON' : '⊗ Snap OFF'}</span>
      </div>
      <div className="ml-auto ws-status-item">
        <span>Vishvakarma.OS v1.0.0</span>
      </div>
    </div>
  );
}

function OnboardingPanel({ onLoadSample, onNewProject }: { onLoadSample: () => void; onNewProject: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-3xl border border-primary/30 bg-black/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-primary/20 px-5 py-4">
          <div className="vish-logo-tile flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl p-1.5">
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official user-supplied logo" className="h-full w-full rounded-xl object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ws-text">Start your floor plan</p>
            <p className="text-[11px] text-ws-text-faint">Draw walls, place openings, preview in 3D.</p>
          </div>
        </div>

        <div className="space-y-2 px-5 py-4 text-xs text-ws-text-dim">
          <p><span className="text-primary">1.</span> Tap <strong>Wall</strong>, then tap start and end points.</p>
          <p><span className="text-primary">2.</span> Tap <strong>Door</strong> or <strong>Window</strong>, then tap a wall.</p>
          <p><span className="text-primary">3.</span> Use <strong>3D</strong>, <strong>Grid</strong>, and <strong>Snap</strong> from the command strip.</p>
        </div>

        <div className="grid gap-2 border-t border-primary/20 px-5 py-4">
          <Button onClick={onLoadSample} className="rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="mr-2 h-4 w-4" /> Load Sample Project
          </Button>
          <Button onClick={onNewProject} variant="outline" className="rounded-xl border-primary/30 bg-white/5 text-ws-text hover:bg-primary/15">
            <Plus className="mr-2 h-4 w-4" /> Create New Project
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onProjectCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    const initialManifest: ProjectManifest = {
      version: SPEC_VERSION,
      name,
      description,
      walls: [],
      openings: [],
      materials: [],
      floorMaterial: 'material-concrete',
      lighting: DEFAULT_LIGHTING,
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
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl md:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Start a new blueprint workspace with a clean canvas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Client floor plan" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea id="project-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional notes" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OpenProjectDialog({
  open,
  projects,
  onOpenChange,
  onLoadProject,
}: {
  open: boolean;
  projects: Project[];
  onOpenChange: (value: boolean) => void;
  onLoadProject: (project: Project) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Open Project</DialogTitle>
          <DialogDescription>Load a saved blueprint from your workspace.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-80 pr-3">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No saved projects yet</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Create a new project to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                  onClick={() => onLoadProject(project)}
                >
                  <p className="font-semibold text-foreground">{project.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{project.description || 'No description'}</p>
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
  );
}

function ExportFloorPlanDialog({
  open,
  onOpenChange,
  onExportJSON,
  projectName,
  wallCount,
  openingCount,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onExportJSON: () => void;
  projectName: string;
  wallCount: number;
  openingCount: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-primary/30 bg-stone-50 md:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="vish-logo-tile mb-2 flex h-16 w-16 items-center justify-center rounded-2xl p-1.5">
            <FileDown className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle>Export Floor Plan?</DialogTitle>
          <DialogDescription>
            Download a portable Vishvakarma project file for handoff, backup, or future import.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border bg-white/70 p-4 text-sm">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Project</span>
            <span className="font-medium">{projectName}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-muted p-3">
              <p className="text-2xl font-bold text-primary">{wallCount}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Walls</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-2xl font-bold text-primary">{openingCount}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Openings</p>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onExportJSON();
              onOpenChange(false);
            }}
            className="bg-primary text-primary-foreground"
          >
            Export JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EditorPage() {
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [show3DView, setShow3DView] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [unitSystem] = useState<UnitSystem>('metric');
  const [selectedWallId, setSelectedWallId] = useState<string>();
  const [selectedMaterial, setSelectedMaterial] = useState('material-paint');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [lighting, setLighting] = useState<LightingConfig>(DEFAULT_LIGHTING);
  const supabaseConnected = useSupabaseStatus();

  const projectName = currentProject?.name || 'Untitled Project';
  const showOnboarding = walls.length === 0 && openings.length === 0 && !currentProject;

  const buildManifest = useCallback((): ProjectManifest => ({
    version: SPEC_VERSION,
    name: projectName,
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
  }), [currentProject?.created_at, currentProject?.description, lighting, openings, projectName, snapEnabled, walls]);

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'v' || event.key === 'V') setCurrentTool('select');
      else if (event.key === 'w' || event.key === 'W') setCurrentTool('wall');
      else if (event.key === 'd' || event.key === 'D') setCurrentTool('door');
      else if (event.key === 'n' || event.key === 'N') setCurrentTool('window');
      else if (event.key === 'm' || event.key === 'M') setCurrentTool('measure');
      else if (event.key === 'g' || event.key === 'G') setGridVisible((value) => !value);
      else if (event.key === '3') setShow3DView((value) => !value);
      else if (event.key === 's' && event.shiftKey) {
        event.preventDefault();
        setSnapEnabled((value) => !value);
      }
      else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedWallId) {
        event.preventDefault();
        setWalls((items) => items.filter((wall) => wall.id !== selectedWallId));
        setOpenings((items) => items.filter((opening) => opening.wallId !== selectedWallId));
        setSelectedWallId(undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWallId]);

  const loadSampleProject = async () => {
    try {
      const response = await fetch('/samples/sample-house-01.json');
      const sampleManifest: ProjectManifest = await response.json();
      setCurrentProject(null);
      setWalls(sampleManifest.walls);
      setOpenings(sampleManifest.openings);
      setLighting(sampleManifest.lighting);
      setGridVisible(true);
      setSnapEnabled(sampleManifest.snapToGrid);
      toast.success('Sample project loaded');
    } catch (error) {
      console.error('Failed to load sample project:', error);
      toast.error('Failed to load sample project');
    }
  };

  const handleSaveProject = async () => {
    if (!currentProject) {
      toast.info('Create a project first, then save.');
      setNewProjectOpen(true);
      return;
    }

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
    setLighting(project.manifest.lighting || DEFAULT_LIGHTING);
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
    link.download = `${manifest.name.replace(/\s+/g, '-').toLowerCase()}-floor-plan.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Floor plan exported');
  };

  const selectedWall = useMemo(
    () => walls.find((wall) => wall.id === selectedWallId),
    [selectedWallId, walls]
  );

  return (
    <AppLayout>
      <div className="flex h-screen flex-col overflow-hidden bg-ws-canvas">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-ws-border bg-ws-menubar px-3">
          <div className="flex items-center gap-2 border-r border-ws-border pr-3">
            <div className="vish-logo-tile flex h-8 w-8 items-center justify-center rounded-xl p-1">
              <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official user-supplied logo" className="h-full w-full rounded-lg object-cover" />
            </div>
            <div>
              <p className="vish-wordmark text-[11px] font-bold tracking-[0.22em]">VISHVAKARMA.OS</p>
              <p className="font-technical text-[9px] uppercase tracking-[0.18em] text-ws-text-faint">3D Floor Planner</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm font-semibold text-ws-text">{projectName}</span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-technical text-[9px] uppercase tracking-wide text-primary">
              {walls.length} walls · {openings.length} openings
            </span>
          </div>

          <SaveModeBadge connected={supabaseConnected} />
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={() => setNewProjectOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={() => setLoadDialogOpen(true)}>
            <FolderOpen className="h-3.5 w-3.5" /> Open
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={handleSaveProject}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </header>

        <EditorCommandStrip
          currentTool={currentTool}
          onSelectTool={setCurrentTool}
          show3DView={show3DView}
          onToggle3D={() => setShow3DView((value) => !value)}
          gridVisible={gridVisible}
          onToggleGrid={() => setGridVisible((value) => !value)}
          snapEnabled={snapEnabled}
          onToggleSnap={() => setSnapEnabled((value) => !value)}
          onLoadSample={loadSampleProject}
          onExport={() => setExportDialogOpen(true)}
          wallCount={walls.length}
          openingCount={openings.length}
        />

        <div className="flex flex-1 overflow-hidden">
          <ToolRail
            currentTool={currentTool}
            onToolChange={setCurrentTool}
            show3DView={show3DView}
            onToggle3DView={() => setShow3DView((value) => !value)}
            gridVisible={gridVisible}
            onToggleGrid={() => setGridVisible((value) => !value)}
            snapEnabled={snapEnabled}
            onToggleSnap={() => setSnapEnabled((value) => !value)}
          />

          <div className="flex flex-1 min-w-0 overflow-hidden">
            <section className="flex flex-1 min-w-0 flex-col overflow-hidden">
              <div className="ws-pane-header">
                <span className="ws-pane-label">2D Blueprint</span>
                <span className="ws-pane-stat">Touch / Pencil ready</span>
              </div>
              <div
                className="relative flex-1 overflow-auto p-4"
                onPointerMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
                }}
              >
                <BlueprintCanvas
                  walls={walls}
                  openings={openings}
                  currentTool={currentTool}
                  gridVisible={gridVisible}
                  snapEnabled={snapEnabled}
                  gridSize={20}
                  onWallAdd={(wall) => setWalls((items) => [...items, wall])}
                  onOpeningAdd={(opening) => setOpenings((items) => [...items, opening])}
                  onWallSelect={setSelectedWallId}
                  selectedWallId={selectedWallId}
                  unitSystem={unitSystem}
                />
                {showOnboarding && <OnboardingPanel onLoadSample={loadSampleProject} onNewProject={() => setNewProjectOpen(true)} />}
              </div>
            </section>

            {show3DView && (
              <section className="flex w-80 shrink-0 flex-col border-l border-ws-border md:w-96">
                <div className="ws-pane-header">
                  <span className="ws-pane-label">3D Preview</span>
                  <span className="ws-pane-stat"><Box className="mr-1 inline h-3 w-3" /> Deferred WebGL</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Suspense fallback={<Viewport3DLoading />}>
                    <Viewport3D walls={walls} openings={openings} lighting={lighting} />
                  </Suspense>
                </div>
              </section>
            )}
          </div>

          <aside className="ws-panel-light flex w-72 shrink-0 flex-col overflow-hidden">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/70 bg-white/55 px-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Properties</span>
              {selectedWall ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Layers className="h-4 w-4 text-muted-foreground" />}
            </div>
            <ScrollArea className="flex-1">
              <PropertiesPanel
                selectedWall={selectedWall}
                openings={openings}
                onWallUpdate={(wallId, updates) => setWalls((items) => items.map((wall) => wall.id === wallId ? { ...wall, ...updates } : wall))}
                onOpeningUpdate={(openingId, updates) => setOpenings((items) => items.map((opening) => opening.id === openingId ? { ...opening, ...updates } : opening))}
                onWallDelete={(wallId) => {
                  setWalls((items) => items.filter((wall) => wall.id !== wallId));
                  setOpenings((items) => items.filter((opening) => opening.wallId !== wallId));
                  setSelectedWallId(undefined);
                }}
                onOpeningDelete={(openingId) => setOpenings((items) => items.filter((opening) => opening.id !== openingId))}
              />
              <div className="mx-4 h-px bg-border" />
              <div className="px-4 py-3">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Materials</p>
                <MaterialPicker materials={[]} selectedMaterial={selectedMaterial} onMaterialSelect={setSelectedMaterial} />
              </div>
              <div className="mx-4 h-px bg-border" />
              <div className="px-4 py-3">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Solar / Lighting</p>
                <SolarTimeline lighting={lighting} onLightingChange={setLighting} />
              </div>
            </ScrollArea>
          </aside>
        </div>

        <StatusBar
          currentTool={currentTool}
          wallCount={walls.length}
          openingCount={openings.length}
          mousePos={mousePos}
          snapEnabled={snapEnabled}
        />
      </div>

      <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} onProjectCreated={loadProjects} />
      <OpenProjectDialog open={loadDialogOpen} projects={projects} onOpenChange={setLoadDialogOpen} onLoadProject={handleLoadProject} />
      <ExportFloorPlanDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExportJSON={handleExportJSON}
        projectName={projectName}
        wallCount={walls.length}
        openingCount={openingCount}
      />
    </AppLayout>
  );
}
