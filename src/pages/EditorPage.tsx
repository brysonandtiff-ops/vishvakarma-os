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
  HardDrive,
  Layers,
  MousePointer2,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import AppLayout from '@/components/layouts/AppLayout';
import BlueprintCanvas from '@/components/editor/BlueprintCanvas';
import EditorCommandStrip from '@/components/editor/EditorCommandStrip';
import KeyboardShortcuts from '@/components/editor/KeyboardShortcuts';
import MaterialPicker from '@/components/editor/MaterialPicker';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import SolarTimeline from '@/components/editor/SolarTimeline';
import ToolRail from '@/components/editor/ToolRail';
import { createProject, getProjects, updateProject } from '@/db/api';
import DraftRecoveryDialog from '@/components/editor/DraftRecoveryDialog';
import ExportFloorPlanDialog from '@/components/editor/ExportFloorPlanDialog';
import NewProjectDialog from '@/components/editor/NewProjectDialog';
import OnboardingPanel from '@/components/editor/OnboardingPanel';
import OpenProjectDialog from '@/components/editor/OpenProjectDialog';
import ProjectProofPanel from '@/components/editor/ProjectProofPanel';
import SaveModeBadge from '@/components/editor/SaveModeBadge';
import SaveStateBadge from '@/components/editor/SaveStateBadge';
import StatusBar from '@/components/editor/StatusBar';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import { useSupabaseStatus } from '@/hooks/useSupabaseStatus';
import {
  buildDraftPayload,
  clearLocalDraft,
  hasMeaningfulDraftContent,
  readLocalDraft,
  saveLocalDraft,
  type LocalDraftPayload,
} from '@/editor/localDraft';
import type { DimensionAnnotation, Label, LightingConfig, Opening, Project, ProjectManifest, SaveState, ToolType, Wall } from '@/types';
import type { UnitSystem } from '@/utils/measurements';

const Viewport3D = lazy(() => import('@/components/editor/Viewport3D'));

const SPEC_VERSION = '1.0.0';
const DEFAULT_LIGHTING: LightingConfig = {
  sunAzimuth: 180,
  sunElevation: 45,
  timeOfDay: 12,
  intensity: 1,
};

export default function EditorPage() {
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [show3DView, setShow3DView] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [unitSystem] = useState<UnitSystem>('metric');
  const [selectedWallId, setSelectedWallId] = useState<string>();
  const [selectedOpeningId, setSelectedOpeningId] = useState<string>();
  const [selectedMaterial, setSelectedMaterial] = useState('material-paint');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [recoveryDraft, setRecoveryDraft] = useState<LocalDraftPayload | null>(null);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [demoProjectName, setDemoProjectName] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [dimensions, setDimensions] = useState<DimensionAnnotation[]>([]);
  const [lighting, setLighting] = useState<LightingConfig>(DEFAULT_LIGHTING);
  const supabaseConnected = useSupabaseStatus();

  const projectName = currentProject?.name || demoProjectName || 'Untitled Project';
  const showOnboarding = walls.length === 0 && openings.length === 0 && !currentProject;

  const buildManifest = useCallback((): ProjectManifest => ({
    version: SPEC_VERSION,
    name: projectName,
    description: currentProject?.description,
    walls,
    openings,
    labels,
    dimensions,
    materials: [],
    floorMaterial: 'material-concrete',
    lighting,
    gridSize: 20,
    snapToGrid: snapEnabled,
    metadata: {
      created: currentProject?.created_at || new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  }), [currentProject?.created_at, currentProject?.description, dimensions, labels, lighting, openings, projectName, snapEnabled, walls]);

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
    const draft = readLocalDraft();
    if (draft && hasMeaningfulDraftContent(draft)) {
      setRecoveryDraft(draft);
      setRecoveryDialogOpen(true);
      setLastDraftSavedAt(draft.savedAt);
      setSaveState('local-draft');
    }
  }, []);

  useEffect(() => {
    const hasContent = walls.length > 0 || openings.length > 0;
    if (!hasContent) return;

    setHasUnsavedChanges(true);
    setSaveState((state) => (state === 'cloud-saved' ? 'unsaved' : state === 'restored-draft' ? 'restored-draft' : 'unsaved'));

    const saveDraft = () => {
      const payload = buildDraftPayload({
        projectId: currentProject?.id ?? null,
        projectName,
        description: currentProject?.description,
        walls,
        openings,
        lighting,
        snapEnabled,
      });

      if (saveLocalDraft(payload)) {
        setLastDraftSavedAt(payload.savedAt);
        setSaveState((state) => (state === 'cloud-saved' ? 'cloud-saved' : 'local-draft'));
      }
    };

    const timer = window.setTimeout(saveDraft, 1200);
    const interval = window.setInterval(saveDraft, 5000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [currentProject?.description, currentProject?.id, lighting, openings, projectName, snapEnabled, walls]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
      setDemoProjectName(sampleManifest.name || 'Demo Blueprint');
      setWalls(sampleManifest.walls);
      setOpenings(sampleManifest.openings);
      setLabels(sampleManifest.labels ?? []);
      setDimensions(sampleManifest.dimensions ?? []);
      setLighting(sampleManifest.lighting);
      setGridVisible(true);
      setSnapEnabled(sampleManifest.snapToGrid);
      setHasUnsavedChanges(true);
      setSaveState('local-draft');
      toast.success('Demo blueprint loaded with Project Proof active');
    } catch (error) {
      console.error('Failed to load sample project:', error);
      toast.error('Failed to load sample project');
    }
  };

  const restoreLocalDraft = () => {
    if (!recoveryDraft) return;

    setCurrentProject(null);
    setDemoProjectName(recoveryDraft.projectName);
    setWalls(recoveryDraft.manifest.walls);
    setOpenings(recoveryDraft.manifest.openings);
    setLabels(recoveryDraft.manifest.labels ?? []);
    setDimensions(recoveryDraft.manifest.dimensions ?? []);
    setLighting(recoveryDraft.manifest.lighting);
    setSnapEnabled(recoveryDraft.manifest.snapToGrid);
    setGridVisible(true);
    setHasUnsavedChanges(true);
    setSaveState('restored-draft');
    setLastDraftSavedAt(recoveryDraft.savedAt);
    setRecoveryDialogOpen(false);
    toast.success('Local draft restored');
  };

  const discardLocalDraft = () => {
    clearLocalDraft();
    setRecoveryDialogOpen(false);
    setRecoveryDraft(null);
    if (walls.length === 0 && openings.length === 0) {
      setDemoProjectName(null);
      setSaveState('clean');
      setLastDraftSavedAt(null);
      setHasUnsavedChanges(false);
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
      setDemoProjectName(null);
      clearLocalDraft();
      setSaveState('cloud-saved');
      setLastDraftSavedAt(null);
      setHasUnsavedChanges(false);
      toast.success('Project saved');
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    }
  };

  const handleLoadProject = (project: Project) => {
    clearLocalDraft();
    setCurrentProject(project);
    setDemoProjectName(null);
    setWalls(project.manifest.walls || []);
    setOpenings(project.manifest.openings || []);
    setLabels(project.manifest.labels ?? []);
    setDimensions(project.manifest.dimensions ?? []);
    setLighting(project.manifest.lighting || DEFAULT_LIGHTING);
    setSnapEnabled(project.manifest.snapToGrid ?? true);
    setLoadDialogOpen(false);
    setSaveState('cloud-saved');
    setLastDraftSavedAt(null);
    setHasUnsavedChanges(false);
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
    <AppLayout> {/* AppLayout provides the main sidebar and notifications */}
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
          <SaveStateBadge state={saveState} lastDraftAt={lastDraftSavedAt} />
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={() => setNewProjectOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={() => setLoadDialogOpen(true)}>
            <FolderOpen className="h-3.5 w-3.5" /> Open
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={handleSaveProject}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <KeyboardShortcuts />
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
                  labels={labels}
                  dimensions={dimensions}
                  currentTool={currentTool}
                  gridVisible={gridVisible}
                  snapEnabled={snapEnabled}
                  gridSize={20}
                  onWallAdd={(wall) => setWalls((items) => [...items, wall])}
                  onOpeningAdd={(opening) => setOpenings((items) => [...items, opening])}
                  onOpeningUpdate={(openingId, updates) => setOpenings((items) => items.map((opening) => opening.id === openingId ? { ...opening, ...updates } : opening))}
                  onLabelAdd={(label) => setLabels((items) => [...items, label])}
                  onDimensionAdd={(dimension) => setDimensions((items) => [...items, dimension])}
                  onWallSelect={setSelectedWallId}
                  onOpeningSelect={setSelectedOpeningId}
                  selectedWallId={selectedWallId}
                  selectedOpeningId={selectedOpeningId}
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
              <ProjectProofPanel
                projectName={projectName}
                wallCount={walls.length}
                openingCount={openings.length}
                saveState={saveState}
                lastDraftAt={lastDraftSavedAt}
                supabaseConnected={supabaseConnected}
                snapEnabled={snapEnabled}
              />
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

      <DraftRecoveryDialog
        open={recoveryDialogOpen}
        draft={recoveryDraft}
        onRestore={restoreLocalDraft}
        onDiscard={discardLocalDraft}
      />
      <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} onProjectCreated={loadProjects} />
      <OpenProjectDialog open={loadDialogOpen} projects={projects} onOpenChange={setLoadDialogOpen} onLoadProject={handleLoadProject} />
      <ExportFloorPlanDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExportJSON={handleExportJSON}
        projectName={projectName}
        wallCount={walls.length}
        openingCount={openings.length}
      />
    </AppLayout>
  );
}
