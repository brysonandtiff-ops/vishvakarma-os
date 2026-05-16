// Main Blueprint Editor Page with Architect's Table theme
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Save, FolderOpen, FileDown, Plus, Info, Package, Undo2, Redo2,
  Database, Wifi, WifiOff, ArrowRight, Layers, Pencil, Move3d,
  Zap, RefreshCw,
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

// Supabase connected check
function useSupabaseStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    setConnected(Boolean(url && key && url !== 'undefined' && key !== 'undefined'));
  }, []);
  return connected;
}

// Sync pulse indicator — shows when walls count changes (2D→3D sync event)
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
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
      <span className="font-mono text-[10px] text-muted-foreground">2D</span>
      <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
      <span className="font-mono text-[10px] text-muted-foreground">3D</span>
      <span
        className={`h-2 w-2 rounded-full transition-colors duration-300 ${
          syncing ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      />
      {syncing && (
        <RefreshCw className="h-3 w-3 animate-spin text-primary" />
      )}
    </div>
  );
}

// Save mode badge
function SaveModeBadge({ connected, projectName }: { connected: boolean | null; projectName?: string }) {
  if (connected === null) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
      {connected ? (
        <>
          <Wifi className="h-3 w-3 text-success" />
          <span className="font-mono text-[10px] font-medium text-success">Supabase</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-muted-foreground/60" />
          <span className="font-mono text-[10px] text-muted-foreground">Local mode</span>
        </>
      )}
      {projectName && (
        <span className="max-w-[80px] truncate font-mono text-[10px] text-muted-foreground/60">
          · {projectName}
        </span>
      )}
    </div>
  );
}

// First-run onboarding panel shown when the canvas is empty and no project is loaded
function OnboardingPanel({ onLoadSample, onNewProject }: { onLoadSample: () => void; onNewProject: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card shadow-lg">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Welcome to Vishvakarma.OS</p>
              <p className="text-xs text-muted-foreground">Your architectural OS</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-px px-6 py-4">
          {[
            { icon: Move3d, label: 'Draw walls on the 2D canvas', sub: 'Use the Wall tool or press W' },
            { icon: Pencil, label: 'Place doors and windows', sub: 'Press D for door, N for window' },
            { icon: Zap, label: 'Watch the 3D model update live', sub: 'Model chamber syncs in real-time' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-3 rounded-lg px-2 py-2.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
          <Button size="sm" className="w-full gap-2" onClick={onLoadSample}>
            <Package className="h-3.5 w-3.5" />
            Load Sample Project
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={onNewProject}>
            <Plus className="h-3.5 w-3.5" />
            Create New Project
          </Button>
        </div>
      </div>
    </div>
  );
}

// Spec hash for Blueprint Editor v1.0.0
const SPEC_HASH = 'e8f4a2b9...d1e3f5';
const SPEC_VERSION = '1.0.0';

export default function EditorPage() {
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [show3DView, setShow3DView] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [selectedWallId, setSelectedWallId] = useState<string>();
  const [selectedMaterial, setSelectedMaterial] = useState('material-paint');

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const supabaseConnected = useSupabaseStatus();

  // Project manifest state
  const [walls, setWalls] = useState<Wall[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [lighting, setLighting] = useState<LightingConfig>({
    sunAzimuth: 180,
    sunElevation: 45,
    timeOfDay: 12,
    intensity: 1,
  });

  // Derived state
  const isEmpty = walls.length === 0 && openings.length === 0;
  const showOnboarding = isEmpty && !currentProject;

  // Undo/Redo state
  const [history, setHistory] = useState<{ walls: Wall[]; openings: Opening[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save to history when walls or openings change
  const saveToHistory = useCallback(() => {
    const newState = { walls, openings };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to 50 states
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

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Delete selected wall
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWallId) {
        e.preventDefault();
        setWalls((prev) => prev.filter((w) => w.id !== selectedWallId));
        setOpenings((prev) => prev.filter((o) => o.wallId !== selectedWallId));
        setSelectedWallId(undefined);
        saveToHistory();
      }
      // Tool shortcuts
      else if (e.key === 'v' || e.key === 'V') {
        setCurrentTool('select');
      } else if (e.key === 'w' || e.key === 'W') {
        setCurrentTool('wall');
      } else if (e.key === 'd' || e.key === 'D') {
        setCurrentTool('door');
      } else if (e.key === 'n' || e.key === 'N') {
        setCurrentTool('window');
      } else if (e.key === 'm' || e.key === 'M') {
        setCurrentTool('measure');
      }
      // View shortcuts
      else if (e.key === 'g' || e.key === 'G') {
        setGridVisible((prev) => !prev);
      } else if (e.key === 's' && e.shiftKey) {
        e.preventDefault();
        setSnapEnabled((prev) => !prev);
      } else if (e.key === '3') {
        setShow3DView((prev) => !prev);
      }
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
      
      // Load sample data into editor
      setWalls(sampleManifest.walls);
      setOpenings(sampleManifest.openings);
      setLighting(sampleManifest.lighting);
      setGridVisible(sampleManifest.snapToGrid);
      setSnapEnabled(sampleManifest.snapToGrid);
      
      toast.success('Sample project loaded successfully');
    } catch (error) {
      console.error('Failed to load sample project:', error);
      toast.error('Failed to load sample project');
    }
  };

  const handleWallAdd = (wall: Wall) => {
    setWalls([...walls, wall]);
    saveToHistory();
  };

  const handleOpeningAdd = (opening: Opening) => {
    setOpenings([...openings, opening]);
    saveToHistory();
  };

  const handleWallUpdate = (wallId: string, updates: Partial<Wall>) => {
    setWalls((prev) =>
      prev.map((wall) => (wall.id === wallId ? { ...wall, ...updates } : wall))
    );
  };

  const handleOpeningUpdate = (openingId: string, updates: Partial<Opening>) => {
    setOpenings((prev) =>
      prev.map((opening) =>
        opening.id === openingId ? { ...opening, ...updates } : opening
      )
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

  const handleSaveProject = async () => {
    const manifest: ProjectManifest = {
      version: '1.0.0',
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
    };

    try {
      if (currentProject) {
        const updated = await updateProject(currentProject.id, { manifest });
        setCurrentProject(updated);
        toast.success('Project saved successfully');
      } else {
        // Show dialog to create new project
        toast.info('Please create a new project first');
      }
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
    toast.success(`Loaded project: ${project.name}`);
  };

  const handleExportJSON = () => {
    const manifest: ProjectManifest = {
      version: '1.0.0',
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
    };

    const dataStr = JSON.stringify(manifest, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${manifest.name.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Project exported as JSON');
  };

  return (
    <AppLayout>
      <div className="flex h-screen flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-3 py-2 shadow-sm">
          <div className="flex min-w-0 items-center gap-3 pl-10 lg:pl-0">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-foreground text-balance">
                {currentProject?.name || 'Untitled Project'}
              </h2>
              {currentProject && (
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {currentProject.id.slice(0, 8)}…
                </p>
              )}
            </div>
            {/* Status pills */}
            <div className="hidden items-center gap-2 md:flex">
              {show3DView && (
                <SyncIndicator wallCount={walls.length} openingCount={openings.length} />
              )}
              <SaveModeBadge
                connected={supabaseConnected}
                projectName={currentProject?.name}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <KeyboardShortcuts />
            <div className="mx-1 h-5 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <div className="mx-1 h-5 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 touch-target"
              onClick={loadSampleProject}
            >
              <Package className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sample</span>
            </Button>
            <NewProjectDialog
              open={newProjectOpen}
              onOpenChange={setNewProjectOpen}
              onProjectCreated={loadProjects}
            />
            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 touch-target">
                  <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Load</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Load Project</DialogTitle>
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
            <Button
              variant="outline"
              size="sm"
              className="h-8 touch-target"
              onClick={handleSaveProject}
              disabled={!currentProject}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 touch-target"
              onClick={handleExportJSON}
            >
              <FileDown className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tool Rail */}
          <ToolRail
            currentTool={currentTool}
            onToolChange={setCurrentTool}
            show3DView={show3DView}
            onToggle3DView={() => setShow3DView(!show3DView)}
            gridVisible={gridVisible}
            onToggleGrid={() => setGridVisible(!gridVisible)}
            snapEnabled={snapEnabled}
            onToggleSnap={() => setSnapEnabled(!snapEnabled)}
          />

          {/* Canvas + 3D split area */}
          <div className="flex flex-1 min-w-0 overflow-hidden">
            {/* 2D Canvas pane */}
            <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
              {/* Pane header */}
              <div className="flex h-8 shrink-0 items-center border-b border-border bg-muted/40 px-3">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  2D Blueprint
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">
                  {walls.length} walls · {openings.length} openings
                </span>
              </div>
              <div className="relative flex-1 overflow-auto p-3">
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
              <div className="flex w-80 shrink-0 flex-col border-l border-border md:w-96">
                <div className="flex h-8 shrink-0 items-center border-b border-border bg-muted/40 px-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    3D Preview
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">
                    Model Chamber
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Viewport3D walls={walls} openings={openings} lighting={lighting} />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="flex w-72 shrink-0 flex-col gap-3 overflow-auto border-l border-border bg-card p-3">
            <PropertiesPanel
              selectedWall={walls.find((w) => w.id === selectedWallId)}
              openings={openings}
              onWallUpdate={handleWallUpdate}
              onOpeningUpdate={handleOpeningUpdate}
              onWallDelete={handleWallDelete}
              onOpeningDelete={handleOpeningDelete}
            />
            <MaterialPicker
              materials={[]}
              selectedMaterial={selectedMaterial}
              onMaterialSelect={setSelectedMaterial}
            />
            <SolarTimeline lighting={lighting} onLightingChange={setLighting} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

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
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    const initialManifest: ProjectManifest = {
      version: '1.0.0',
      name,
      description,
      walls: [],
      openings: [],
      materials: [],
      floorMaterial: 'material-concrete',
      lighting: {
        sunAzimuth: 180,
        sunElevation: 45,
        timeOfDay: 12,
        intensity: 1,
      },
      gridSize: 20,
      snapToGrid: true,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      },
    };

    try {
      await createProject(name, description || undefined, initialManifest);
      toast.success('Project created successfully');
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
        <Button variant="default" size="sm" className="touch-target">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
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
