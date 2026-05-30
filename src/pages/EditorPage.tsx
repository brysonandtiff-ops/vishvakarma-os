/* @refresh reset */
// Vishvakarma.OS — iPad-first blueprint editor workspace
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Box, FolderOpen, Save } from 'lucide-react';
import AppLayout, { useGovernanceNav } from '@/components/layouts/AppLayout';
import BlueprintCanvas from '@/components/editor/BlueprintCanvas';
import EditorTopBar from '@/components/editor/EditorTopBar';
import RadialToolMenu from '@/components/editor/RadialToolMenu';
import KeyboardShortcuts from '@/components/editor/KeyboardShortcuts';
import MaterialPicker from '@/components/editor/MaterialPicker';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import SolarTimeline from '@/components/editor/SolarTimeline';
import ToolRail from '@/components/editor/ToolRail';
import { createProject, getProjects, updateProject } from '@/db/api';
import DraftRecoveryDialog from '@/components/editor/DraftRecoveryDialog';
import ExportFloorPlanDialog from '@/components/editor/ExportFloorPlanDialog';
import ImportFloorPlanDialog from '@/components/editor/ImportFloorPlanDialog';
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
import { isLocalProjectId } from '@/editor/localProject';
import { VersionControlHooks } from '@/modules/versionControlHooks';
import type { DimensionAnnotation, Label as RoomLabel, LightingConfig, Opening, Project, ProjectManifest, SaveState, ToolType, Wall } from '@/types';
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
  return (
    <AppLayout immersive>
      <EditorWorkspace />
    </AppLayout>
  );
}

function EditorWorkspace() {
  const { openNav } = useGovernanceNav();
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [labels, setLabels] = useState<RoomLabel[]>([]);
  const [dimensions, setDimensions] = useState<DimensionAnnotation[]>([]);
  const [lighting, setLighting] = useState<LightingConfig>(DEFAULT_LIGHTING);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const supabaseConnected = useSupabaseStatus();
  const versionControlRef = useRef<VersionControlHooks | null>(null);
  const skipVersionSnapshotRef = useRef(false);

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

  const applyManifest = useCallback((manifest: ProjectManifest) => {
    setWalls(manifest.walls);
    setOpenings(manifest.openings);
    setLabels(manifest.labels ?? []);
    setDimensions(manifest.dimensions ?? []);
    setLighting(manifest.lighting || DEFAULT_LIGHTING);
    setSnapEnabled(manifest.snapToGrid ?? true);
    setGridVisible(true);
  }, []);

  const refreshUndoRedo = useCallback(() => {
    const versionControl = versionControlRef.current;
    if (!versionControl) return;
    setCanUndo(versionControl.canUndo());
    setCanRedo(versionControl.canRedo());
  }, []);

  const resetVersionHistory = useCallback((manifest: ProjectManifest) => {
    const versionControl = versionControlRef.current;
    if (!versionControl) return;
    skipVersionSnapshotRef.current = true;
    versionControl.clearVersionHistory();
    versionControl.saveVersion(manifest, 'Loaded', false);
    versionControl.updateCurrentManifest(manifest);
    skipVersionSnapshotRef.current = false;
    refreshUndoRedo();
  }, [refreshUndoRedo]);

  useEffect(() => {
    const versionControl = new VersionControlHooks({
      autoSaveEnabled: false,
      autoSaveInterval: 30000,
      maxVersions: 50,
      persistToLocalStorage: false,
    });
    versionControl.initialize();
    versionControlRef.current = versionControl;

    const initialManifest: ProjectManifest = {
      version: SPEC_VERSION,
      name: 'Untitled Project',
      walls: [],
      openings: [],
      labels: [],
      dimensions: [],
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
    versionControl.saveVersion(initialManifest, 'Initial', false);
    versionControl.updateCurrentManifest(initialManifest);
    refreshUndoRedo();

    return () => versionControl.cleanup();
  }, [refreshUndoRedo]);

  const pushVersionSnapshot = useCallback(
    (manifest: ProjectManifest) => {
      const versionControl = versionControlRef.current;
      if (!versionControl || skipVersionSnapshotRef.current) return;
      versionControl.saveVersion(manifest, 'Editor snapshot');
      versionControl.updateCurrentManifest(manifest);
      refreshUndoRedo();
    },
    [refreshUndoRedo],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      pushVersionSnapshot(buildManifest());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [walls, openings, labels, dimensions, lighting, snapEnabled, pushVersionSnapshot, buildManifest]);

  const handleUndo = useCallback(() => {
    const versionControl = versionControlRef.current;
    if (!versionControl?.canUndo()) return;
    const restored = versionControl.undo();
    if (!restored) return;
    skipVersionSnapshotRef.current = true;
    applyManifest(restored);
    skipVersionSnapshotRef.current = false;
    refreshUndoRedo();
  }, [applyManifest, refreshUndoRedo]);

  const handleRedo = useCallback(() => {
    const versionControl = versionControlRef.current;
    if (!versionControl?.canRedo()) return;
    const restored = versionControl.redo();
    if (!restored) return;
    skipVersionSnapshotRef.current = true;
    applyManifest(restored);
    skipVersionSnapshotRef.current = false;
    refreshUndoRedo();
  }, [applyManifest, refreshUndoRedo]);

  const handleMaterialSelect = useCallback((materialId: string) => {
    setSelectedMaterial(materialId);
    if (!selectedWallId) return;
    setWalls((items) =>
      items.map((wall) => (wall.id === selectedWallId ? { ...wall, material: materialId } : wall)),
    );
  }, [selectedWallId]);

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
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }
      if (mod && (event.key.toLowerCase() === 'z' && event.shiftKey || event.key.toLowerCase() === 'y')) {
        event.preventDefault();
        handleRedo();
        return;
      }
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
  }, [handleRedo, handleUndo, selectedWallId]);

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
      resetVersionHistory(sampleManifest);
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
    resetVersionHistory(recoveryDraft.manifest);
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

    if (isLocalProjectId(currentProject.id)) {
      const updatedManifest = buildManifest();
      setCurrentProject({
        ...currentProject,
        name: updatedManifest.name,
        description: updatedManifest.description,
        manifest: updatedManifest,
        updated_at: new Date().toISOString(),
      });
      clearLocalDraft();
      setSaveState('local-draft');
      setLastDraftSavedAt(null);
      setHasUnsavedChanges(false);
      toast.success('Project saved locally');
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
    applyManifest(project.manifest);
    resetVersionHistory(project.manifest);
    setLoadDialogOpen(false);
    setSaveState(isLocalProjectId(project.id) ? 'local-draft' : 'cloud-saved');
    setLastDraftSavedAt(null);
    setHasUnsavedChanges(false);
    toast.success(`Loaded: ${project.name}`);
  };

  const handleProjectCreated = (project: Project) => {
    void loadProjects();
    handleLoadProject(project);
  };

  const handleImportedManifest = (manifest: ProjectManifest) => {
    clearLocalDraft();
    setCurrentProject(null);
    setDemoProjectName(manifest.name);
    applyManifest(manifest);
    resetVersionHistory(manifest);
    setHasUnsavedChanges(true);
    setSaveState('local-draft');
    toast.success(`Imported ${manifest.name}`);
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

  useEffect(() => {
    if (selectedWall?.material) {
      setSelectedMaterial(selectedWall.material);
    }
  }, [selectedWall?.id, selectedWall?.material]);

  const showRadialMenu = currentTool === 'wall' || currentTool === 'door' || currentTool === 'window';

  const morePanel = (
    <>
      <ProjectProofPanel
        projectName={projectName}
        wallCount={walls.length}
        openingCount={openings.length}
        saveState={saveState}
        lastDraftAt={lastDraftSavedAt}
        supabaseConnected={supabaseConnected}
        snapEnabled={snapEnabled}
      />
      <div className="mx-4 h-px bg-border" />
      <div className="px-4 py-3">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Materials</p>
        <MaterialPicker materials={[]} selectedMaterial={selectedMaterial} onMaterialSelect={handleMaterialSelect} />
      </div>
      <div className="mx-4 h-px bg-border" />
      <div className="px-4 py-3">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Solar / Lighting</p>
        <SolarTimeline lighting={lighting} onLightingChange={setLighting} />
      </div>
    </>
  );

  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden bg-ws-canvas">
        <EditorTopBar
          projectName={projectName}
          show3DView={show3DView}
          onToggle3D={() => setShow3DView((value) => !value)}
          gridVisible={gridVisible}
          onToggleGrid={() => setGridVisible((value) => !value)}
          onNewProject={() => setNewProjectOpen(true)}
          onExport={() => setExportDialogOpen(true)}
          onImport={() => setImportDialogOpen(true)}
          onOpenGovernance={openNav}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        <div className="flex shrink-0 items-center gap-2 border-b border-ws-border bg-ws-menubar px-3 py-1.5">
          <SaveModeBadge connected={supabaseConnected} />
          <SaveStateBadge state={saveState} lastDraftAt={lastDraftSavedAt} />
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={() => setLoadDialogOpen(true)}>
            <FolderOpen className="h-3.5 w-3.5" /> Open
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={handleSaveProject}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={loadSampleProject}>
            Sample
          </Button>
          <KeyboardShortcuts />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <ToolRail currentTool={currentTool} onToolChange={setCurrentTool} />

          <div className="flex flex-1 min-w-0 overflow-hidden">
            <section className="flex flex-1 min-w-0 flex-col overflow-hidden">
              <div
                className="vish-canvas-stage relative flex-1 overflow-auto p-4"
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
                <RadialToolMenu
                  visible={showRadialMenu}
                  x={mousePos.x}
                  y={mousePos.y}
                  currentTool={currentTool}
                  onSelectTool={setCurrentTool}
                />
                {showOnboarding && <OnboardingPanel onLoadSample={loadSampleProject} onNewProject={() => setNewProjectOpen(true)} />}
              </div>
            </section>

            {show3DView && (
              <section className="flex w-80 shrink-0 flex-col border-l border-ws-border md:w-96">
                <div className="ws-pane-header">
                  <span className="ws-pane-label">3D Preview</span>
                  <span className="ws-pane-stat"><Box className="mr-1 inline h-3 w-3" /> Live sync</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Suspense fallback={<Viewport3DLoading />}>
                    <Viewport3D walls={walls} openings={openings} lighting={lighting} />
                  </Suspense>
                </div>
              </section>
            )}
          </div>

          <aside className="vish-dark-panel ws-panel-dark flex w-72 shrink-0 flex-col overflow-hidden">
            <PropertiesPanel
              currentTool={currentTool}
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
              morePanel={morePanel}
            />
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
      <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} onProjectCreated={handleProjectCreated} />
      <ImportFloorPlanDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImported={handleImportedManifest}
      />
      <OpenProjectDialog open={loadDialogOpen} projects={projects} onOpenChange={setLoadDialogOpen} onLoadProject={handleLoadProject} />
      <ExportFloorPlanDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExportJSON={handleExportJSON}
        projectName={projectName}
        wallCount={walls.length}
        openingCount={openings.length}
      />
    </>
  );
}
