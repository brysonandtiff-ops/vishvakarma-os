/* @refresh reset */
// Vishvakarma.OS — iPad-first blueprint editor workspace
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { Box, FolderOpen, Loader2, Save, Sparkles } from 'lucide-react';
import AppLayout, { useGovernanceNav } from '@/components/layouts/AppLayout';
import BlueprintCanvas from '@/components/editor/BlueprintCanvas';
import EditorTopBar from '@/components/editor/EditorTopBar';
import RadialToolMenu from '@/components/editor/RadialToolMenu';
import KeyboardShortcuts from '@/components/editor/KeyboardShortcuts';
import MaterialPicker from '@/components/editor/MaterialPicker';
import CustomMaterialDialog from '@/components/editor/CustomMaterialDialog';
import FurniturePicker from '@/components/editor/FurniturePicker';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import SolarTimeline from '@/components/editor/SolarTimeline';
import ToolRail from '@/components/editor/ToolRail';
import { createProject, getProjects, updateProject } from '@/db/api';
import DraftRecoveryDialog from '@/components/editor/DraftRecoveryDialog';
import EditorMenuSheet from '@/components/editor/EditorMenuSheet';
import ExportFloorPlanDialog from '@/components/editor/ExportFloorPlanDialog';
import ImportFloorPlanDialog from '@/components/editor/ImportFloorPlanDialog';
import NewProjectDialog from '@/components/editor/NewProjectDialog';
import AIDesignerDialog from '@/components/editor/ai-designer/AIDesignerDialog';
import OnboardingPanel from '@/components/editor/OnboardingPanel';
import { WelcomeOverlay } from '@/components/editor/WelcomeOverlay';
import { VastuPanel } from '@/components/editor/panels/VastuPanel';
import {
  AgniThermalPanel,
  AkashaCastPanel,
  PanchatattvaPanel,
  TvashtarPanel,
  VayuJalaPanel,
} from '@/components/editor/panels/SimulationPanels';
import EditorPhasePills from '@/components/editor/EditorPhasePills';
import EditorCommandStrip from '@/components/editor/EditorCommandStrip';
import OpenProjectDialog from '@/components/editor/OpenProjectDialog';
import ProjectProofPanel from '@/components/editor/ProjectProofPanel';
import FloorSwitcher from '@/components/editor/FloorSwitcher';
import SaveModeBadge from '@/components/editor/SaveModeBadge';
import SaveStateBadge from '@/components/editor/SaveStateBadge';
import StatusBar from '@/components/editor/StatusBar';
import EditorCompassCost from '@/components/editor/EditorCompassCost';
import EditorCollaborationBar, { useCollaborationCursorBroadcast } from '@/components/editor/EditorCollaborationBar';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSaveStatus } from '@/hooks/useCloudSaveStatus';
import {
  buildDraftPayloadFromManifest,
  clearLocalDraft,
  hasMeaningfulDraftContent,
  readLocalDraft,
  saveLocalDraft,
  type LocalDraftPayload,
} from '@/editor/localDraft';
import { buildProjectExportFilename, serializeProjectManifest } from '@/core/projectExport';
import { createLocalProject, isLocalProjectId } from '@/editor/localProject';
import { upsertLocalProject } from '@/editor/localProjects';
import { dismissOnboarding, isOnboardingDismissed } from '@/editor/onboardingMemory';
import { useFloorPlanEngine } from '@/hooks/useFloorPlanEngine';
import type { Point2D, Project, ProjectManifest, SaveState } from '@/types';
import type { UnitSystem } from '@/utils/measurements';
import { shouldIgnoreKeyboardShortcuts } from '@/utils/keyboardShortcuts';

const Viewport3D = lazy(() => import('@/components/editor/Viewport3D'));

export default function EditorPage() {
  return (
    <AppLayout immersive>
      <EditorWorkspace />
    </AppLayout>
  );
}

function EditorWorkspace() {
  const location = useLocation();
  const { openNav } = useGovernanceNav();
  const {
    walls,
    openings,
    floors,
    activeFloorIndex,
    labels,
    dimensions,
    rooms,
    furniture,
    mepSymbols,
    fixtures,
    landscapeElements,
    costItems,
    materials,
    dimensionVisibility,
    northOrientation,
    lighting,
    gridSize,
    session,
    canUndo,
    canRedo,
    engine,
    setTool,
    setWorkspaceMode,
  } = useFloorPlanEngine();

  const broadcastCollaborationCursor = useCollaborationCursorBroadcast(session.currentTool);
  const currentTool = session.currentTool;
  const show3DView = session.show3DView;
  const gridVisible = session.gridVisible;
  const snapEnabled = session.snapEnabled;
  const selectedWallId = session.selectedWallId;
  const selectedOpeningId = session.selectedOpeningId;
  const workspaceMode = session.workspaceMode;
  const zenMode = session.zenMode;
  const presentationLock = session.presentationLock;

  const [unitSystem] = useState<UnitSystem>('metric');
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
  const [aiDesignerOpen, setAiDesignerOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editorMenuOpen, setEditorMenuOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(() => !isOnboardingDismissed());
  const [selectedLabelId, setSelectedLabelId] = useState<string | undefined>();
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | undefined>();
  const [savingProject, setSavingProject] = useState(false);
  const [customMaterialOpen, setCustomMaterialOpen] = useState(false);
  const cloudSave = useCloudSaveStatus();
  const { user } = useAuth();

  const projectName = currentProject?.name || demoProjectName || session.projectName;
  const showOnboarding = walls.length === 0 && openings.length === 0 && !currentProject;

  const buildManifest = useCallback((): ProjectManifest => {
    const manifest = engine.buildManifest();
    return {
      ...manifest,
      metadata: {
        ...manifest.metadata,
        created: currentProject?.created_at || manifest.metadata.created,
        modified: new Date().toISOString(),
      },
    };
  }, [currentProject?.created_at, engine]);

  const applyManifest = useCallback(
    (manifest: ProjectManifest) => {
      engine.loadManifest(manifest, manifest.name);
    },
    [engine],
  );

  const handleUndo = useCallback(() => {
    engine.undo();
  }, [engine]);

  const handleRedo = useCallback(() => {
    engine.redo();
  }, [engine]);

  const handleMaterialSelect = useCallback(
    (materialId: string) => {
      setSelectedMaterial(materialId);
      if (!selectedWallId) return;
      engine.updateWall(selectedWallId, { material: materialId });
    },
    [engine, selectedWallId],
  );

  const handleRoomDetect = useCallback(
    (point: Point2D) => {
      const room = engine.detectRoomAtPoint(point);
      if (!room) {
        toast.message('Room tool', { description: 'Click inside an enclosed wall loop to detect a room.' });
        return;
      }
      engine.addLabel({
        id: `label-${room.id}`,
        text: room.name,
        position: room.center ?? point,
        fontSize: 14,
        color: '#6b4f2a',
      });
      toast.success(`Detected ${room.name}${room.area ? ` (${room.area.toFixed(1)} m²)` : ''}`);
    },
    [engine],
  );

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
      const payload = buildDraftPayloadFromManifest({
        projectId: currentProject?.id ?? null,
        projectName,
        manifest: buildManifest(),
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
      if (shouldIgnoreKeyboardShortcuts(event)) return;
      if (
        recoveryDialogOpen ||
        newProjectOpen ||
        loadDialogOpen ||
        exportDialogOpen ||
        importDialogOpen ||
        editorMenuOpen
      ) {
        return;
      }

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
      if (event.key === 'v' || event.key === 'V') {
        event.preventDefault();
        setTool('select');
      } else if (event.key === 'w' || event.key === 'W') {
        event.preventDefault();
        setTool('wall');
      } else if (event.key === 'd' && event.shiftKey) {
        event.preventDefault();
        engine.setDimensionVisibility(!engine.getDimensionVisibility());
      } else if (event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        setTool('door');
      } else if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        setTool('window');
      } else if (event.key === 'm' || event.key === 'M') {
        if (event.shiftKey) {
          event.preventDefault();
          setTool('dimension');
        } else {
          event.preventDefault();
          setTool('measure');
        }
      } else if (event.key === 't' || event.key === 'T') {
        event.preventDefault();
        setTool('text');
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        setTool('furniture');
      } else if (event.key === 'g' || event.key === 'G') {
        event.preventDefault();
        engine.setGridVisible(!gridVisible);
      } else if (event.key === '3') {
        event.preventDefault();
        engine.setShow3D(!show3DView);
      } else if (event.key === 's' && event.shiftKey) {
        event.preventDefault();
        engine.setSnapEnabled(!snapEnabled);
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedWallId) {
        event.preventDefault();
        engine.removeWall(selectedWallId);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    editorMenuOpen,
    engine,
    exportDialogOpen,
    gridVisible,
    handleRedo,
    handleUndo,
    importDialogOpen,
    loadDialogOpen,
    newProjectOpen,
    recoveryDialogOpen,
    selectedWallId,
    setTool,
    show3DView,
    snapEnabled,
  ]);

  const loadSampleProject = async () => {
    try {
      const response = await fetch('/samples/sample-house-01.json');
      const sampleManifest: ProjectManifest = await response.json();
      if (!currentProject) {
        setDemoProjectName(sampleManifest.name || 'Demo Blueprint');
      }
      applyManifest({
        ...sampleManifest,
        name: currentProject?.name ?? sampleManifest.name,
        description: currentProject?.description ?? sampleManifest.description,
      });
      engine.setGridVisible(true);
      setHasUnsavedChanges(true);
      setSaveState(
        currentProject
          ? isLocalProjectId(currentProject.id)
            ? 'local-draft'
            : 'cloud-saved'
          : 'local-draft',
      );
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
    applyManifest(recoveryDraft.manifest);
    engine.setGridVisible(true);
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

    setSavingProject(true);
    if (isLocalProjectId(currentProject.id)) {
      const updatedManifest = buildManifest();
      const updatedProject: Project = {
        ...currentProject,
        name: updatedManifest.name,
        description: updatedManifest.description,
        manifest: updatedManifest,
        updated_at: new Date().toISOString(),
      };
      setCurrentProject(updatedProject);
      upsertLocalProject(updatedProject);
      clearLocalDraft();
      setSaveState('local-draft');
      setLastDraftSavedAt(null);
      setHasUnsavedChanges(false);
      toast.success('Project saved locally');
      setSavingProject(false);
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
      const message = error instanceof Error ? error.message : 'Failed to save project';
      toast.error(message);
    } finally {
      setSavingProject(false);
    }
  };

  const selectedLabel = useMemo(
    () => labels.find((label) => label.id === selectedLabelId),
    [labels, selectedLabelId],
  );

  const handleLoadProject = useCallback((project: Project) => {
    clearLocalDraft();
    setCurrentProject(project);
    setDemoProjectName(null);
    applyManifest(project.manifest);
    setLoadDialogOpen(false);
    setSaveState(isLocalProjectId(project.id) ? 'local-draft' : 'cloud-saved');
    setLastDraftSavedAt(null);
    setHasUnsavedChanges(false);
    toast.success(`Loaded: ${project.name}`);
  }, [applyManifest]);

  useEffect(() => {
    const pending = (location.state as { loadProject?: Project } | null)?.loadProject;
    if (pending) {
      handleLoadProject(pending);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleLoadProject]);

  const handleProjectCreated = (project: Project) => {
    void loadProjects();
    handleLoadProject(project);
  };

  const handleImportedManifest = (manifest: ProjectManifest) => {
    clearLocalDraft();
    setCurrentProject(null);
    setDemoProjectName(manifest.name);
    applyManifest(manifest);
    setHasUnsavedChanges(true);
    setSaveState('local-draft');
    toast.success(`Imported ${manifest.name}`);
  };

  const handleAIDesignerOpenInEditor = useCallback(
    (manifest: ProjectManifest, name: string) => {
      clearLocalDraft();
      setCurrentProject(null);
      setDemoProjectName(name);
      applyManifest({ ...manifest, name });
      setHasUnsavedChanges(true);
      setSaveState('local-draft');
      toast.success(`Loaded AI design: ${name}`);
    },
    [applyManifest],
  );

  const handleAIDesignerSaveProject = useCallback(
    async (manifest: ProjectManifest, name: string) => {
      const project = backendStatus.isConfigured
        ? await createProject(name, manifest.description, manifest)
        : createLocalProject(name, manifest.description, manifest);
      if (!backendStatus.isConfigured) {
        upsertLocalProject(project);
      }
      handleProjectCreated(project);
    },
    [handleProjectCreated],
  );

  const handleExportJSON = () => {
    try {
      const manifest = buildManifest();
      const dataStr = serializeProjectManifest(manifest);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = buildProjectExportFilename(manifest);
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Export Package saved as JSON');
    } catch {
      toast.error('JSON export failed');
    }
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

  const manifest = buildManifest();

  const fileStrip = (
    <>
      <SaveModeBadge connected={cloudSave.connected} label={cloudSave.label} />
      <FloorSwitcher
        floors={floors}
        activeFloorIndex={activeFloorIndex}
        onFloorChange={(index) => engine.setActiveFloorIndex(index)}
        onAddFloor={() => engine.addFloor()}
      />
      <EditorCollaborationBar projectName={projectName} />
      <SaveStateBadge state={saveState} lastDraftAt={lastDraftSavedAt} />
      <Button variant="ghost" size="sm" className="touch-target h-7 min-h-[44px] gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={() => setLoadDialogOpen(true)}>
        <FolderOpen className="h-3.5 w-3.5" /> Open
      </Button>
      <Button variant="ghost" size="sm" className="touch-target h-7 min-h-[44px] gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={handleSaveProject} disabled={savingProject}>
        {savingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
      </Button>
      <Button variant="ghost" size="sm" className="touch-target h-7 min-h-[44px] gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={loadSampleProject}>
        Sample
      </Button>
      <Button variant="ghost" size="sm" data-testid="editor-ai-designer" className="touch-target h-7 min-h-[44px] gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text" onClick={() => setAiDesignerOpen(true)}>
        <Sparkles className="h-3.5 w-3.5" /> AI
      </Button>
      <KeyboardShortcuts />
    </>
  );

  const morePanel = (
    <>
      <EditorCommandStrip wallCount={walls.length} openingCount={openings.length} />
      {workspaceMode === 'mep' && <TvashtarPanel manifest={manifest} />}
      {(workspaceMode === 'draft' || currentTool === 'vastu') && <VastuPanel manifest={manifest} />}
      <VayuJalaPanel manifest={manifest} />
      <AgniThermalPanel manifest={manifest} />
      <PanchatattvaPanel />
      <AkashaCastPanel />
      <ProjectProofPanel
        projectName={projectName}
        wallCount={walls.length}
        openingCount={openings.length}
        saveState={saveState}
        lastDraftAt={lastDraftSavedAt}
        cloudConnected={cloudSave.connected}
        cloudSaveLabel={cloudSave.label}
        snapEnabled={snapEnabled}
      />
      <div className="mx-4 h-px bg-border" />
      <div className="px-4 py-3">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Materials</p>
        <MaterialPicker
          materials={materials}
          selectedMaterial={selectedMaterial}
          onMaterialSelect={handleMaterialSelect}
          onCreateCustom={() => setCustomMaterialOpen(true)}
        />
      </div>
      {workspaceMode === 'interior' && (
        <>
          <div className="mx-4 h-px bg-border" />
          <div className="px-4 py-3">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Furniture</p>
            <FurniturePicker onSelectTool={() => setTool('furniture')} />
          </div>
        </>
      )}
      <div className="mx-4 h-px bg-border" />
      <div className="px-4 py-3">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Solar / Lighting</p>
        <SolarTimeline lighting={lighting} onLightingChange={(value) => engine.setLighting(value)} />
      </div>
    </>
  );

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-ws-canvas">
        <EditorTopBar
          projectName={projectName}
          show3DView={show3DView}
          workspaceMode={workspaceMode}
          zenMode={zenMode}
          presentationLock={presentationLock}
          onWorkspaceModeChange={setWorkspaceMode}
          onToggleZen={() => engine.setZenMode(!zenMode)}
          onTogglePresentationLock={() => engine.setPresentationLock(!presentationLock)}
          onToggle3D={() => engine.setShow3D(!show3DView)}
          gridVisible={gridVisible}
          onToggleGrid={() => engine.setGridVisible(!gridVisible)}
          onNewProject={() => setNewProjectOpen(true)}
          onExport={() => setExportDialogOpen(true)}
          onImport={() => setImportDialogOpen(true)}
          onOpenEditorMenu={() => setEditorMenuOpen(true)}
          onOpenGovernance={openNav}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          fileStrip={fileStrip}
        />

        <div className="flex flex-1 overflow-hidden">
          <ToolRail
            currentTool={currentTool}
            workspaceMode={workspaceMode}
            onToolChange={setTool}
          />

          <div className="flex flex-1 min-w-0 overflow-hidden">
            <section className="flex flex-1 min-w-0 flex-col overflow-hidden">
              <div
                className="vish-canvas-stage relative flex-1 overflow-auto p-4"
                onPointerMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
                }}
              >
                <AppErrorBoundary title="Blueprint canvas error">
                <BlueprintCanvas
                  walls={walls}
                  openings={openings}
                  labels={labels}
                  dimensions={dimensions}
                  dimensionVisibility={dimensionVisibility}
                  rooms={rooms}
                  furniture={furniture}
                  mepSymbols={mepSymbols}
                  fixtures={fixtures}
                  landscapeElements={landscapeElements}
                  northOrientation={northOrientation}
                  currentTool={currentTool}
                  gridVisible={gridVisible}
                  snapEnabled={snapEnabled}
                  gridSize={gridSize}
                  onWallAdd={(wall) => engine.addWall(wall)}
                  onOpeningAdd={(opening) => engine.addOpening(opening)}
                  onOpeningUpdate={(openingId, updates) => engine.updateOpening(openingId, updates)}
                  onLabelAdd={(label) => engine.addLabel(label)}
                  onLabelUpdate={(labelId, updates) => engine.updateLabel(labelId, updates)}
                  onDimensionAdd={(dimension) => engine.addDimension({ ...dimension, offset: dimension.offset ?? 24 })}
                  onRoomDetect={handleRoomDetect}
                  onFurnitureAdd={(item) => engine.addFurniture(item)}
                  onFurnitureUpdate={(furnitureId, updates) => engine.updateFurniture(furnitureId, updates)}
                  onMepSymbolAdd={(symbol) => engine.addMepSymbol(symbol)}
                  onFixtureAdd={(fixture) => engine.addFixture(fixture)}
                  selectedFixtureId={selectedFixtureId}
                  onFixtureSelect={setSelectedFixtureId}
                  onLandscapeAdd={(element) => engine.addLandscapeElement(element)}
                  onPointerCanvasMove={broadcastCollaborationCursor}
                  onWallSelect={(id) => engine.setSelection(id, undefined)}
                  onOpeningSelect={(id) => engine.setSelection(undefined, id)}
                  selectedWallId={selectedWallId}
                  selectedOpeningId={selectedOpeningId}
                  selectedLabelId={selectedLabelId}
                  onLabelSelect={setSelectedLabelId}
                  unitSystem={unitSystem}
                />
                </AppErrorBoundary>
                <EditorCompassCost
                  northOrientation={northOrientation}
                  costItems={costItems}
                  onNorthChange={(degrees) => engine.setNorthOrientation(degrees)}
                />
                <EditorPhasePills />
                <RadialToolMenu
                  visible={showRadialMenu}
                  x={mousePos.x}
                  y={mousePos.y}
                  currentTool={currentTool}
                  onSelectTool={setTool}
                />
                {showOnboarding && !welcomeOpen && (
                  <OnboardingPanel
                    onLoadSample={loadSampleProject}
                    onNewProject={() => setNewProjectOpen(true)}
                    showLocalDraftNotice={!backendStatus.isConfigured}
                  />
                )}
                <WelcomeOverlay
                  open={welcomeOpen && showOnboarding}
                  onDismiss={() => {
                    dismissOnboarding();
                    setWelcomeOpen(false);
                  }}
                  onNewProject={() => setNewProjectOpen(true)}
                  onLoadSample={loadSampleProject}
                />
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
                    <Viewport3D
                      walls={walls}
                      openings={openings}
                      lighting={lighting}
                      furniture={furniture}
                      materials={materials}
                      mepSymbols={mepSymbols}
                      fixtures={fixtures}
                      landscapeElements={landscapeElements}
                      walkMode={workspaceMode === 'walk'}
                      presentationLock={presentationLock}
                    />
                  </Suspense>
                </div>
              </section>
            )}
          </div>

          <aside className="vish-dark-panel ws-panel-dark flex w-72 shrink-0 flex-col overflow-hidden">
            <PropertiesPanel
              currentTool={currentTool}
              selectedWall={selectedWall}
              selectedLabel={selectedLabel}
              selectedFixture={fixtures.find((f) => f.id === selectedFixtureId)}
              selectedRoom={rooms.find((r) => selectedLabel?.text === r.name)}
              openings={openings}
              onWallUpdate={(wallId, updates) => engine.updateWall(wallId, updates)}
              onOpeningUpdate={(openingId, updates) => engine.updateOpening(openingId, updates)}
              onWallDelete={(wallId) => engine.removeWall(wallId)}
              onOpeningDelete={(openingId) => engine.removeOpening(openingId)}
              onLabelUpdate={(labelId, updates) => engine.updateLabel(labelId, updates)}
              onLabelDelete={(labelId) => {
                engine.removeLabel(labelId);
                setSelectedLabelId(undefined);
              }}
              onFixtureUpdate={(fixtureId, updates) => engine.updateFixture(fixtureId, updates)}
              onFixtureDelete={(fixtureId) => {
                engine.removeFixture(fixtureId);
                setSelectedFixtureId(undefined);
              }}
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
          dimensionVisibility={dimensionVisibility}
          onToggleDimensions={() => engine.setDimensionVisibility(!engine.getDimensionVisibility())}
        />
      </div>

      <EditorMenuSheet
        open={editorMenuOpen}
        onOpenChange={setEditorMenuOpen}
        onNewProject={() => setNewProjectOpen(true)}
        onOpenProject={() => setLoadDialogOpen(true)}
        onSave={handleSaveProject}
        onImport={() => setImportDialogOpen(true)}
        onExport={() => setExportDialogOpen(true)}
        onLoadSample={() => void loadSampleProject()}
        onAIDesigner={() => setAiDesignerOpen(true)}
        onToggle3D={() => engine.setShow3D(!show3DView)}
        onToggleGrid={() => engine.setGridVisible(!gridVisible)}
        show3DView={show3DView}
        gridVisible={gridVisible}
      />
      <DraftRecoveryDialog
        open={recoveryDialogOpen}
        draft={recoveryDraft}
        onRestore={restoreLocalDraft}
        onDiscard={discardLocalDraft}
        onDismiss={() => setRecoveryDialogOpen(false)}
      />
      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        onProjectCreated={handleProjectCreated}
        onOpenAIDesigner={() => setAiDesignerOpen(true)}
      />
      <AIDesignerDialog
        open={aiDesignerOpen}
        onOpenChange={setAiDesignerOpen}
        onOpenInEditor={handleAIDesignerOpenInEditor}
        onSaveProject={handleAIDesignerSaveProject}
      />
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
        manifest={manifest}
        projectName={projectName}
        wallCount={walls.length}
        openingCount={openings.length}
      />
      <CustomMaterialDialog
        open={customMaterialOpen}
        onOpenChange={setCustomMaterialOpen}
        onCreate={(material) => engine.addMaterial(material)}
        userId={user?.id}
      />
    </>
  );
}
