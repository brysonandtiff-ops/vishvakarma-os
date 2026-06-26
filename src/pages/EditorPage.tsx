/* @refresh reset */
// Vishvakarma.OS — iPad-first blueprint editor workspace
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import PageMeta from '@/components/common/PageMeta';
import { roomTypeLabel, ROOM_TYPES, type RoomType } from '@/domain/rooms/roomType';
import { Box, SlidersHorizontal } from 'lucide-react';
import { useGovernanceNav } from '@/components/layouts/AppLayout';
import { useRegisterEditorSidebar } from '@/components/editor/EditorSidebarContext';
import BlueprintCanvas from '@/components/editor/BlueprintCanvas';
import CanvasMinimap from '@/components/editor/CanvasMinimap';
import EditorLayerPanel from '@/components/editor/EditorLayerPanel';
import EditorTopBar from '@/components/editor/EditorTopBar';
import RadialToolMenuTracker from '@/components/editor/RadialToolMenuTracker';
import MaterialPicker from '@/components/editor/MaterialPicker';
import CustomMaterialDialog from '@/components/editor/CustomMaterialDialog';
import FurniturePicker from '@/components/editor/FurniturePicker';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import SolarTimeline from '@/components/editor/SolarTimeline';
import ToolRail from '@/components/editor/ToolRail';
import { createProject, getProjects, updateProject } from '@/db/api';
import DraftRecoveryDialog from '@/components/editor/DraftRecoveryDialog';
import ExportFloorPlanDialog from '@/components/editor/ExportFloorPlanDialog';
import { usePlanTier } from '@/hooks/usePlanTier';
import ImportFloorPlanDialog from '@/components/editor/ImportFloorPlanDialog';
import NewProjectDialog from '@/components/editor/NewProjectDialog';
import SamplePickerDialog from '@/components/editor/SamplePickerDialog';
import AIDesignerDialog from '@/components/editor/ai-designer/AIDesignerDialog';
import ArchitectureBotWidget from '@/components/architecture-bot/ArchitectureBotWidget';
import { useArchitectureBot } from '@/components/architecture-bot/useArchitectureBot';
import { WelcomeOverlay } from '@/components/editor/WelcomeOverlay';
import { openTutorialHub, startTutorial, shouldAutoStartEssentials, useTutorial } from '@/tutorial/TutorialProvider';
import { VastuPanel } from '@/components/editor/panels/VastuPanel';
import { ComplianceBanner } from '@/components/editor/panels/ComplianceBanner';
import { CompliancePanel, useComplianceReport } from '@/components/editor/panels/CompliancePanel';
import {
  AgniThermalPanel,
  PanchatattvaPanel,
  TvashtarPanel,
  VayuJalaPanel,
} from '@/components/editor/panels/SimulationPanels';
import EditorPhasePills from '@/components/editor/EditorPhasePills';
import OpenProjectDialog from '@/components/editor/OpenProjectDialog';
import ProjectProofPanel from '@/components/editor/ProjectProofPanel';
import FloorSwitcher from '@/components/editor/FloorSwitcher';
import SaveModeBadge from '@/components/editor/SaveModeBadge';
import SaveStateBadge from '@/components/editor/SaveStateBadge';
import StatusBar from '@/components/editor/StatusBar';
import EditorCompassCost from '@/components/editor/EditorCompassCost';
import EditorPerfHud from '@/components/editor/EditorPerfHud';
import PerformanceProfilePanel from '@/components/editor/panels/PerformanceProfilePanel';
import EditorCollaborationBar, { useCollaborationCursorBroadcast } from '@/components/editor/EditorCollaborationBar';
import { useGeometryRevision } from '@/hooks/useGeometryRevision';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset';
import { mapPointerToCanvasBuffer } from '@/utils/canvasPointerCoords';
import { computeStepZoomFactor, computeZoomedViewport } from '@/utils/canvasViewportZoom';
import RemoteCursorsOverlay from '@/components/editor/collaboration/RemoteCursorsOverlay';
import type { Presence } from '@/collaboration/types';
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
  scheduleLocalDraftSave,
  type LocalDraftPayload,
} from '@/editor/localDraft';
import { buildProjectExportFilename, serializeProjectManifest } from '@/core/projectExport';
import { createLocalProject, isLocalProjectId } from '@/editor/localProject';
import { upsertLocalProject } from '@/editor/localProjects';
import { dismissOnboarding, consumeFreshSignIn, isOnboardingDismissed } from '@/editor/onboardingMemory';
import { loadSampleById } from '@/core/sampleCatalog';
import { useFloorPlanEngine } from '@/hooks/useFloorPlanEngine';
import type { Point2D, Project, ProjectManifest, SaveState } from '@/types';
import type { UnitSystem } from '@/utils/measurements';
import { shouldIgnoreKeyboardShortcuts } from '@/utils/keyboardShortcuts';
import { resolveJurisdiction, resolveRegionId } from '@/domain/projects/jurisdiction';
import type { ProjectJurisdiction } from '@/domain/projects/jurisdiction';
import { enforce } from '@/governance/core/enforcer';
import { getFailFindings } from '@/services/compliance/complianceGate';
import { filterWallsByFloor } from '@/utils/floorHelpers';
import { findAllRoomFaces, polygonCentroid } from '@/utils/roomCalculations';
import { playStudioSound } from '@/modules/studio-audio/audioEngine';
import { playMonsoonJali, stopMonsoonJali } from '@/modules/studio-audio/atmosphericMask';
import { frustrationDetector } from '@/modules/telemetry/frustrationDetector';
import ShunyaOverlay from '@/components/editor/ShunyaOverlay';

const Viewport3D = lazy(() => import('@/components/editor/Viewport3D'));

export default function EditorPage() {
  return <EditorWorkspace />;
}

function EditorWorkspace() {
  const { updateEditorSnapshot } = useTutorial();
  const location = useLocation();
  const planTier = usePlanTier();
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
    staircases,
    landscapeElements,
    terrain,
    costItems,
    materials,
    dimensionVisibility,
    northOrientation,
    lighting,
    gridSize,
    session,
    revision,
    canUndo,
    canRedo,
    engine,
    setTool,
    setWorkspaceMode,
  } = useFloorPlanEngine();

  const [collabPresences, setCollabPresences] = useState<Presence[]>([]);
  const broadcastCollaborationCursor = useCollaborationCursorBroadcast(
    session.currentTool,
    engine.getManifest().camera
  );
  const handlePointerCanvasMove = useCallback(
    (point: { x: number; y: number }) => {
      broadcastCollaborationCursor(point);
      const now = performance.now();
      if (now - lastMouseUiUpdateRef.current > 120) {
        lastMouseUiUpdateRef.current = now;
        setMousePos(point);
      }
    },
    [broadcastCollaborationCursor],
  );
  const currentTool = session.currentTool;
  const show3DView = session.show3DView;
  const gridVisible = session.gridVisible;
  const snapEnabled = session.snapEnabled;
  const selectedWallId = session.selectedWallId;
  const selectedWallIds = session.selectedWallIds;
  const selectedOpeningId = session.selectedOpeningId;
  const workspaceMode = session.workspaceMode;
  const zenMode = session.zenMode;
  const presentationLock = session.presentationLock;
  const canvasViewport = session.canvasViewport;
  const layerVisibility = session.layerVisibility;
  const showAllFloorsIn3D = session.showAllFloorsIn3D;
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const { bottomInset: keyboardBottomInset } = useVisualViewportInset();

  const [unitSystem] = useState<UnitSystem>('metric');
  const [selectedMaterial, setSelectedMaterial] = useState('material-paint');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const lastMouseUiUpdateRef = useRef(0);
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
  const [freshSignIn] = useState(() => consumeFreshSignIn());
  const [welcomeOpen, setWelcomeOpen] = useState(() => !isOnboardingDismissed());
  const [propertiesSheetOpen, setPropertiesSheetOpen] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<string | undefined>();
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | undefined>();
  const [savingProject, setSavingProject] = useState(false);
  const [customMaterialOpen, setCustomMaterialOpen] = useState(false);
  const [expand3DPanel, setExpand3DPanel] = useState(false);
  const [samplePickerOpen, setSamplePickerOpen] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [pendingRoomType, setPendingRoomType] = useState<string>('Bedroom');
  const [monsoonActive, setMonsoonActive] = useState(false);
  const [pranaActive, setPranaActive] = useState(false);
  const [frustrated, setFrustrated] = useState(false);

  useEffect(() => {
    frustrationDetector.start(() => {
      setFrustrated(true);
    });
    return () => {
      frustrationDetector.stop();
    };
  }, []);

  useEffect(() => {
    if (pranaActive) {
      document.documentElement.setAttribute('data-prana-active', 'true');
    } else {
      document.documentElement.removeAttribute('data-prana-active');
    }
  }, [pranaActive]);

  const handleToggleMonsoon = useCallback(() => {
    setMonsoonActive((active) => {
      if (active) {
        stopMonsoonJali();
      } else {
        playMonsoonJali();
      }
      return !active;
    });
  }, []);

  const handleTogglePrana = useCallback(() => {
    setPranaActive((active) => !active);
  }, []);

  const cloudSave = useCloudSaveStatus();
  const { user } = useAuth();

  const projectName = currentProject?.name || demoProjectName || session.projectName;
  const showOnboarding =
    !freshSignIn && walls.length === 0 && openings.length === 0 && !currentProject;

  const maybeStartEssentialsTour = useCallback(() => {
    if (shouldAutoStartEssentials()) {
      startTutorial('essentials', { autoStart: true });
    }
  }, []);

  useEffect(() => {
    updateEditorSnapshot({
      currentTool,
      wallsCount: walls.length,
      openingsCount: openings.length,
      show3DView,
      hasUnsavedChanges,
      exportDialogOpen,
      workspaceMode,
      labelsCount: labels.length,
      dimensionsCount: dimensions.length,
    });
  }, [
    currentTool,
    walls.length,
    openings.length,
    show3DView,
    hasUnsavedChanges,
    exportDialogOpen,
    workspaceMode,
    labels.length,
    dimensions.length,
    updateEditorSnapshot,
  ]);

  const handleMinimapPan = useCallback(
    (point: { x: number; y: number }) => {
      const stage = canvasStageRef.current;
      const width = stage?.clientWidth ?? 800;
      const height = stage?.clientHeight ?? 600;
      const zoom = canvasViewport.zoom;
      engine.setCanvasViewport({
        panX: width / 2 - point.x * zoom,
        panY: height / 2 - point.y * zoom,
      });
    },
    [canvasViewport.zoom, engine],
  );

  const handleStepZoom = useCallback(
    (direction: 'in' | 'out') => {
      const canvasEl = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
      if (!canvasEl) {
        const factor = computeStepZoomFactor(direction);
        engine.setCanvasViewport({ zoom: canvasViewport.zoom * factor });
        return;
      }
      const rect = canvasEl.getBoundingClientRect();
      const anchorBuffer = mapPointerToCanvasBuffer(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect,
        canvasEl.width,
        canvasEl.height,
      );
      const factor = computeStepZoomFactor(direction);
      engine.setCanvasViewport(
        computeZoomedViewport(
          canvasViewport,
          canvasViewport.zoom * factor,
          anchorBuffer.x,
          anchorBuffer.y,
        ),
      );
    },
    [canvasViewport, engine],
  );

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
      const roomType = pendingRoomType as RoomType;
      const labelName = roomTypeLabel(roomType);
      const room = engine.detectRoomAtPoint(point, labelName, roomType);
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
      playStudioSound('resonance432');
      try { navigator.vibrate?.(40); } catch {}
      toast.success(`Detected ${room.name}${room.area ? ` (${room.area.toFixed(1)} m²)` : ''}`);
    },
    [engine, pendingRoomType],
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
    if (import.meta.env.VITE_E2E_ALLOW_LOCAL_ACCESS !== 'true') return;
    (window as Window & { __vishFloorPlanEngine?: typeof engine }).__vishFloorPlanEngine = engine;
    return () => {
      delete (window as Window & { __vishFloorPlanEngine?: typeof engine }).__vishFloorPlanEngine;
    };
  }, [engine]);

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

      if (scheduleLocalDraftSave(payload)) {
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
        importDialogOpen
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
      } else if (event.key === 'c' || event.key === 'C') {
        event.preventDefault();
        setTool('column');
      } else if (event.key === 'u' || event.key === 'U') {
        event.preventDefault();
        setTool('stair');
      } else if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        setTool('pan');
      } else if (event.key === 'g' || event.key === 'G') {
        event.preventDefault();
        engine.setGridVisible(!gridVisible);
      } else if (event.key === '3') {
        event.preventDefault();
        engine.setShow3D(!show3DView);
      } else if (event.key === 's' && event.shiftKey) {
        event.preventDefault();
        engine.setSnapEnabled(!snapEnabled);
      } else if ((event.key === 'Delete' || event.key === 'Backspace')) {
        const wallIds = selectedWallIds?.length
          ? selectedWallIds
          : selectedWallId
            ? [selectedWallId]
            : [];
        if (wallIds.length > 0) {
          event.preventDefault();
          for (const wallId of wallIds) {
            engine.removeWall(wallId);
          }
          engine.clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
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
    selectedWallIds,
    setTool,
    show3DView,
    snapEnabled,
  ]);

  const applySampleManifest = useCallback(
    (
      sampleManifest: ProjectManifest,
      options: { mode: 'fresh' | 'overlay'; closeSamplePicker?: boolean },
    ) => {
      clearLocalDraft();
      const displayName = sampleManifest.name || 'Demo Blueprint';

      if (options.mode === 'fresh') {
        setCurrentProject(null);
        setDemoProjectName(displayName);
      } else if (!currentProject) {
        setDemoProjectName(displayName);
      }

      applyManifest({
        ...sampleManifest,
        name: options.mode === 'fresh' ? displayName : (currentProject?.name ?? displayName),
        description:
          options.mode === 'fresh'
            ? sampleManifest.description
            : (currentProject?.description ?? sampleManifest.description),
      });
      engine.setGridVisible(true);
      setHasUnsavedChanges(true);
      setSaveState(
        options.mode === 'fresh' || !currentProject
          ? 'local-draft'
          : isLocalProjectId(currentProject.id)
            ? 'local-draft'
            : 'cloud-saved',
      );
      if (options.closeSamplePicker) {
        setSamplePickerOpen(false);
      }
      toast.success(`${displayName} loaded with Project Proof active`);
    },
    [applyManifest, currentProject, engine],
  );

  const loadSampleBySampleId = async (sampleId: string) => {
    setLoadingSample(true);
    try {
      const sampleManifest = await loadSampleById(sampleId);
      applySampleManifest(sampleManifest, { mode: 'overlay', closeSamplePicker: true });
    } catch (error) {
      console.error('Failed to load sample project:', error);
      toast.error('Failed to load sample project');
    } finally {
      setLoadingSample(false);
    }
  };

  const openSamplePicker = () => {
    setSamplePickerOpen(true);
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
    setLoadingProject(true);
    toast.message('Loading project…', { description: project.name });
    clearLocalDraft();
    setCurrentProject(project);
    setDemoProjectName(null);
    applyManifest(project.manifest);
    setLoadDialogOpen(false);
    setSaveState(isLocalProjectId(project.id) ? 'local-draft' : 'cloud-saved');
    setLastDraftSavedAt(null);
    setHasUnsavedChanges(false);
    setLoadingProject(false);
    toast.success(`Loaded: ${project.name}`);
  }, [applyManifest]);

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
      const roomCount = manifest.rooms?.length ?? 0;
      toast.success(
        roomCount > 0
          ? `Loaded AI design: ${name} (${roomCount} rooms with types)`
          : `Loaded AI design: ${name}`,
      );
    },
    [applyManifest],
  );

  const handleSampleManifestOpen = useCallback(
    (manifest: ProjectManifest, name: string) => {
      applySampleManifest({ ...manifest, name }, { mode: 'fresh' });
    },
    [applySampleManifest],
  );

  useEffect(() => {
    const state = location.state as {
      loadProject?: Project;
      loadManifest?: ProjectManifest;
      projectName?: string;
      manifestSource?: 'sample' | 'ai';
    } | null;
    if (state?.loadProject) {
      handleLoadProject(state.loadProject);
      window.history.replaceState({}, document.title);
    } else if (state?.loadManifest) {
      const name = state.projectName ?? state.loadManifest.name;
      if (state.manifestSource === 'sample') {
        handleSampleManifestOpen(state.loadManifest, name);
      } else {
        handleAIDesignerOpenInEditor(state.loadManifest, name);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleLoadProject, handleAIDesignerOpenInEditor, handleSampleManifestOpen]);

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
      const enforcementResult = enforce(manifest);
      if (!enforcementResult.success) {
        toast.error(`Export blocked: ${enforcementResult.errors.join('; ')}`);
        return;
      }
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

  const hasPropertiesSelection = Boolean(
    selectedWallId || selectedOpeningId || selectedLabelId || selectedFixtureId,
  );

  useEffect(() => {
    if (hasPropertiesSelection && window.matchMedia('(max-width: 767px)').matches) {
      setPropertiesSheetOpen(true);
    }
  }, [hasPropertiesSelection, selectedWallId, selectedOpeningId, selectedLabelId, selectedFixtureId]);

  useEffect(() => {
    if (selectedWall?.material) {
      setSelectedMaterial(selectedWall.material);
    }
  }, [selectedWall?.id, selectedWall?.material]);

  const showRadialMenu = ['wall', 'door', 'window', 'measure', 'text', 'dimension', 'column', 'stair'].includes(currentTool);
  const geometryRevision = useGeometryRevision();
  const geometryManifest = useMemo(
    () => engine.getGeometryManifest(),
    [engine, geometryRevision],
  );
  const complianceReport = useComplianceReport(geometryManifest, {
    projectId: currentProject?.id,
    projectName,
  }, 0, geometryRevision);
  const complianceFailSummary = getFailFindings(complianceReport)[0]?.message;

  const handleDetectAllRooms = useCallback(() => {
    const manifest = engine.getManifest();
    const floorWalls = filterWallsByFloor(manifest.walls, activeFloorIndex);
    const faces = findAllRoomFaces(floorWalls);
    let count = 0;

    for (const face of faces) {
      const center = polygonCentroid(face.vertices);
      if (!center) continue;
      const key = face.wallIds.join(',');
      const existing = engine.getManifest().rooms ?? [];
      if (existing.some((room) => room.wallIds.join(',') === key)) continue;
      const room = engine.detectRoomAtPoint(center, `Room ${count + 1}`);
      if (room) count += 1;
    }

    return count;
  }, [activeFloorIndex, engine]);

  const handleRepairGovernanceState = useCallback(() => {
    let count = 0;
    try {
      if (localStorage.getItem('governance-event-log') === null) {
        localStorage.setItem('governance-event-log', JSON.stringify([]));
        count += 1;
      }
      if (localStorage.getItem('version-control-state') === null) {
        localStorage.setItem(
          'version-control-state',
          JSON.stringify({ history: [], currentIndex: -1, maxHistory: 50 }),
        );
        count += 1;
      }
      if (localStorage.getItem('theme') === null) {
        localStorage.setItem('theme', 'dark');
        count += 1;
      }
      if (localStorage.getItem('accessibility-settings') === null) {
        localStorage.setItem(
          'accessibility-settings',
          JSON.stringify({
            highContrast: false,
            reducedMotion: false,
            screenReaderEnabled: false,
            keyboardNavigationEnabled: true,
          }),
        );
        count += 1;
      }
    } catch {
      // localStorage may be unavailable
    }
    return count;
  }, []);

  const handleOpenCompliancePanel = useCallback(() => {
    document.querySelector('[data-testid="compliance-panel"]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, []);

  const architectureBotCallbacks = useMemo(
    () => ({
      onDetectAllRooms: handleDetectAllRooms,
      onUpdateWall: (wallId: string, updates: { height: number }) => engine.updateWall(wallId, updates),
      onUpdateOpening: (openingId: string, updates: { width: number }) =>
        engine.updateOpening(openingId, updates),
      onUpdateRoom: (roomId: string, updates: { name: string }) => engine.updateRoom(roomId, updates),
      onSetJurisdiction: (jurisdiction: ProjectJurisdiction) => engine.setJurisdiction(jurisdiction),
      onRepairGovernanceState: handleRepairGovernanceState,
      onOpenCopilot: () => setAiDesignerOpen(true),
      onOpenCompliance: handleOpenCompliancePanel,
    }),
    [engine, handleDetectAllRooms, handleOpenCompliancePanel, handleRepairGovernanceState],
  );

  const architectureBot = useArchitectureBot({
    manifest: geometryManifest,
    projectId: currentProject?.id,
    projectName,
    revision: geometryRevision,
    callbacks: architectureBotCallbacks,
  });

  const editorSidebarConfig = useMemo(
    () => ({
      onNewProject: () => setNewProjectOpen(true),
      onOpenProject: () => setLoadDialogOpen(true),
      onSave: () => void handleSaveProject(),
      onImport: () => setImportDialogOpen(true),
      onExport: () => setExportDialogOpen(true),
      onLoadSample: openSamplePicker,
      onAIDesigner: () => setAiDesignerOpen(true),
      onToggle3D: () => engine.setShow3D(!show3DView),
      onToggleGrid: () => engine.setGridVisible(!gridVisible),
      show3DView,
      gridVisible,
      savingProject,
    }),
    [
      engine,
      gridVisible,
      handleSaveProject,
      openSamplePicker,
      savingProject,
      show3DView,
    ],
  );
  useRegisterEditorSidebar(editorSidebarConfig);

  const collabManifest = useMemo(() => engine.buildManifest(), [engine, geometryRevision, revision]);
  const exportManifest = useMemo(() => buildManifest(), [buildManifest, geometryRevision, revision]);
  const deferredWalls = useDeferredValue(walls);
  const deferredOpenings = useDeferredValue(openings);
  const deferredFurniture = useDeferredValue(furniture);
  const deferredRooms = useDeferredValue(rooms);
  const deferredFixtures = useDeferredValue(fixtures);
  const deferredStaircases = useDeferredValue(staircases);
  const deferredTerrain = useDeferredValue(terrain);
  const deferredLandscape = useDeferredValue(landscapeElements);
  const deferredMepSymbols = useDeferredValue(mepSymbols);

  const fileStrip = (
    <>
      <SaveModeBadge connected={cloudSave.connected} label={cloudSave.label} />
      <FloorSwitcher
        floors={floors}
        activeFloorIndex={activeFloorIndex}
        onFloorChange={(index) => engine.setActiveFloorIndex(index)}
        onAddFloor={() => engine.addFloor()}
      />
      <EditorCollaborationBar
        projectId={currentProject?.id}
        projectName={projectName}
        manifest={collabManifest}
        onPresenceChange={setCollabPresences}
      />
      <SaveStateBadge state={saveState} lastDraftAt={lastDraftSavedAt} />
    </>
  );

  const morePanel = (
    <div className="space-y-3 px-0 py-2">
      <div className="px-4">
        <EditorLayerPanel
          layers={layerVisibility}
          onChange={(patch) => engine.setLayerVisibility(patch)}
        />
      </div>
      <div className="mx-4 h-px bg-border" />
      <PerformanceProfilePanel />
      <div className="mx-4 h-px bg-border" />
      {workspaceMode === 'mep' && (
        <div className="px-4">
          <TvashtarPanel manifest={geometryManifest} />
        </div>
      )}
      {(workspaceMode === 'draft' || currentTool === 'vastu') && <VastuPanel manifest={geometryManifest} />}
      <div className="space-y-3 px-4">
        <VayuJalaPanel manifest={geometryManifest} />
        <AgniThermalPanel manifest={geometryManifest} />
        <PanchatattvaPanel manifest={geometryManifest} />
      </div>
      <ProjectProofPanel
        projectName={projectName}
        wallCount={walls.length}
        openingCount={openings.length}
        saveState={saveState}
        lastDraftAt={lastDraftSavedAt}
        cloudConnected={cloudSave.connected}
        cloudSaveLabel={cloudSave.label}
        snapEnabled={snapEnabled}
        complianceStatus={complianceReport.overall}
        complianceSummary={
          complianceReport.blocked
            ? 'Export blocked — resolve failures'
            : complianceReport.overall === 'warning'
              ? 'Advisory warnings present'
              : 'NCC audit passing'
        }
      />
      <div className="mx-4 h-px bg-border" />
      <CompliancePanel
        manifest={geometryManifest}
        projectId={currentProject?.id}
        projectName={projectName}
      />
      <div className="mx-4 h-px bg-border" />
      <div className="px-4 py-3" data-tutorial="materials-panel">
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
            <FurniturePicker
              onSelectTool={() => setTool('furniture')}
              highlightIndian={resolveJurisdiction(engine.getManifest()) === 'in'}
            />
          </div>
        </>
      )}
      <div className="mx-4 h-px bg-border" />
      <div className="px-4 py-3">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Solar / Lighting</p>
        <SolarTimeline
          lighting={lighting}
          onLightingChange={(value) => {
            engine.setLighting(value);
            void import('@/cast/CastSessionManager').then(({ getCastSessionManager }) => {
              getCastSessionManager().updatePresenterLighting(value);
            });
          }}
        />
      </div>
    </div>
  );

  const propertiesPanel = (
    <PropertiesPanel
      currentTool={currentTool}
      selectedWall={selectedWall}
      selectedLabel={selectedLabel}
      selectedFixture={fixtures.find((f) => f.id === selectedFixtureId)}
      selectedRoom={
        rooms.find((r) => selectedLabelId === `label-${r.id}`) ??
        rooms.find((r) => selectedLabel?.text === r.name)
      }
      onRoomUpdate={(roomId, updates) => engine.updateRoom(roomId, updates)}
      pendingRoomType={pendingRoomType}
      onPendingRoomTypeChange={setPendingRoomType}
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
      unitSystem={unitSystem}
      morePanel={morePanel}
    />
  );

  return (
    <>
      <PageMeta
        title={`${projectName || 'Blueprint Editor'} — Vishvakarma.OS`}
        description="Draw floor plans, inspect the Sacred 3D View, and export client-ready packages in the Vishvakarma.OS blueprint editor."
      />
      <div
        className="vish-editor-shell flex h-full min-h-0 flex-col overflow-hidden bg-ws-canvas"
        data-3d-expanded={expand3DPanel ? 'true' : undefined}
      >
        <EditorTopBar
          projectName={projectName}
          show3DView={show3DView}
          expand3DPanel={expand3DPanel}
          onToggleExpand3D={() => setExpand3DPanel((value) => !value)}
          workspaceMode={workspaceMode}
          zenMode={zenMode}
          presentationLock={presentationLock}
          onWorkspaceModeChange={setWorkspaceMode}
          onToggleZen={() => engine.setZenMode(!zenMode)}
          onTogglePresentationLock={() => engine.setPresentationLock(!presentationLock)}
          onToggle3D={() => {
            engine.setShow3D(!show3DView);
            if (show3DView) setExpand3DPanel(false);
          }}
          gridVisible={gridVisible}
          onToggleGrid={() => engine.setGridVisible(!gridVisible)}
          onNewProject={() => setNewProjectOpen(true)}
          onExport={() => setExportDialogOpen(true)}
          onImport={() => setImportDialogOpen(true)}
          onOpenProject={() => setLoadDialogOpen(true)}
          onSaveProject={() => void handleSaveProject()}
          onLoadSample={openSamplePicker}
          onOpenAIDesigner={() => setAiDesignerOpen(true)}
          onOpenArchitectureBot={() => {
            architectureBot.openPanel();
          }}
          savingProject={savingProject}
          onOpenEditorMenu={openNav}
          onOpenGovernance={openNav}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          fileStrip={fileStrip}
          monsoonActive={monsoonActive}
          onToggleMonsoon={handleToggleMonsoon}
          pranaActive={pranaActive}
          onTogglePrana={handleTogglePrana}
        />
        <ComplianceBanner report={complianceReport} />

        <div className="flex flex-1 overflow-hidden">
          {!presentationLock && (
          <ToolRail
            currentTool={currentTool}
            workspaceMode={workspaceMode}
            onToolChange={setTool}
          />
          )}

          <div className="flex flex-1 min-w-0 overflow-hidden">
            <section className="flex flex-1 min-w-0 flex-col overflow-hidden">
              <div
                ref={canvasStageRef}
                className="vish-canvas-stage relative flex-1 overflow-auto p-4"
                style={
                  keyboardBottomInset > 80
                    ? { paddingBottom: keyboardBottomInset + 16 }
                    : undefined
                }
              >
                {loadingProject && (
                  <div className="vish-editor-loading-overlay absolute inset-0 z-30 flex items-center justify-center bg-ws-canvas/70 backdrop-blur-[2px]">
                    <p className="rounded-lg border border-ws-border bg-ws-toolbar px-4 py-2 text-sm font-medium text-ws-text">
                      Loading project…
                    </p>
                  </div>
                )}
                <p className="vish-editor-mantra-watermark" aria-hidden="true">
                  ॐ वास्तु · शिल्प · प्रमाण
                </p>
                {walls.length === 0 && !showOnboarding && (
                  <div className="vish-canvas-empty-hint" aria-hidden="true">
                    <div className="vish-canvas-empty-hint__card">
                      <p className="vish-canvas-empty-hint__title">Drafting board ready</p>
                      <p className="vish-canvas-empty-hint__body">
                        Press W for Wall, C for Column, or load a sample blueprint to begin drafting.
                      </p>
                      <button
                        type="button"
                        className="vish-canvas-empty-hint__tour-link"
                        onClick={() => openTutorialHub()}
                      >
                        Take the tour
                      </button>
                    </div>
                  </div>
                )}
                <AppErrorBoundary title="Blueprint canvas error">
                <BlueprintCanvas
                  walls={walls}
                  openings={openings}
                  labels={labels}
                  dimensions={dimensions}
                  dimensionVisibility={dimensionVisibility}
                  rooms={rooms}
                  furniture={furniture}
                  staircases={staircases}
                  mepSymbols={mepSymbols}
                  fixtures={fixtures}
                  landscapeElements={landscapeElements}
                  terrain={terrain}
                  northOrientation={northOrientation}
                  currentTool={currentTool}
                  gridVisible={gridVisible}
                  snapEnabled={snapEnabled}
                  gridSize={gridSize}
                  onWallAdd={(wall) => {
                    engine.addWall(wall);
                    playStudioSound('wallPlace');
                  }}
                  onWallUpdate={(wallId, updates) => engine.updateWall(wallId, updates)}
                  onOpeningAdd={(opening) => engine.addOpening(opening)}
                  onOpeningUpdate={(openingId, updates) => engine.updateOpening(openingId, updates)}
                  onLabelAdd={(label) => engine.addLabel(label)}
                  onLabelUpdate={(labelId, updates) => engine.updateLabel(labelId, updates)}
                  onDimensionAdd={(dimension) => engine.addDimension({ ...dimension, offset: dimension.offset ?? 24 })}
                  onRoomDetect={handleRoomDetect}
                  onFurnitureAdd={(item) => engine.addFurniture(item)}
                  onFurnitureUpdate={(furnitureId, updates) => engine.updateFurniture(furnitureId, updates)}
                  onStaircaseAdd={(staircase) => engine.addStaircase(staircase)}
                  onMepSymbolAdd={(symbol) => engine.addMepSymbol(symbol)}
                  onFixtureAdd={(fixture) => engine.addFixture(fixture)}
                  selectedFixtureId={selectedFixtureId}
                  onFixtureSelect={setSelectedFixtureId}
                  onLandscapeAdd={(element) => engine.addLandscapeElement(element)}
                  onTerrainAdd={(patch) => engine.addTerrainPatch(patch)}
                  onPointerCanvasMove={handlePointerCanvasMove}
                  onWallSelect={(id) => engine.setSelection(id, undefined)}
                  onWallsSelect={(ids) => engine.setWallSelection(ids)}
                  onOpeningSelect={(id) => engine.setSelection(undefined, id)}
                  selectedWallId={selectedWallId}
                  selectedWallIds={selectedWallIds}
                  selectedOpeningId={selectedOpeningId}
                  selectedLabelId={selectedLabelId}
                  onLabelSelect={setSelectedLabelId}
                  unitSystem={unitSystem}
                  canvasViewport={canvasViewport}
                  onCanvasViewportChange={(viewport) => engine.setCanvasViewport(viewport)}
                  onResetViewport={() => engine.resetCanvasViewport()}
                  manifestWalls={engine.getManifest().walls}
                  layerVisibility={layerVisibility}
                  interactionLocked={presentationLock}
                />
                </AppErrorBoundary>
                {!presentationLock && walls.length > 0 && (
                  <CanvasMinimap
                    walls={walls}
                    rooms={rooms}
                    roomWallSource={engine.getManifest().walls}
                    canvasViewport={canvasViewport}
                    canvasSize={{
                      width: canvasStageRef.current?.clientWidth ?? 800,
                      height: canvasStageRef.current?.clientHeight ?? 600,
                    }}
                    onPanToWorld={handleMinimapPan}
                  />
                )}
                <EditorCompassCost
                  northOrientation={northOrientation}
                  jurisdiction={resolveJurisdiction(engine.getManifest())}
                  regionId={resolveRegionId(engine.getManifest())}
                  costItems={costItems}
                  costRange={engine.getManifest().metadata.costIntelligence}
                  onNorthChange={(degrees) => engine.setNorthOrientation(degrees)}
                  onJurisdictionChange={(j: ProjectJurisdiction) => engine.setJurisdiction(j)}
                  onRegionChange={(regionId) => engine.setRegionId(regionId)}
                />
                <RemoteCursorsOverlay
                  presences={collabPresences}
                  currentUserId={user?.id}
                />
                <EditorPerfHud />
                <EditorPhasePills />
                <RadialToolMenuTracker
                  visible={showRadialMenu}
                  containerRef={canvasStageRef}
                  currentTool={currentTool}
                  onSelectTool={setTool}
                />
                <WelcomeOverlay
                  open={welcomeOpen && showOnboarding}
                  returningUser={freshSignIn}
                  hasCloudProjects={Boolean(user && projects.length > 0)}
                  onOpenProjects={() => setLoadDialogOpen(true)}
                  onDismiss={() => {
                    dismissOnboarding();
                    setWelcomeOpen(false);
                  }}
                  onNewProject={() => {
                    setNewProjectOpen(true);
                    dismissOnboarding();
                    setWelcomeOpen(false);
                    maybeStartEssentialsTour();
                  }}
                  onLoadSample={() => {
                    openSamplePicker();
                    dismissOnboarding();
                    setWelcomeOpen(false);
                    maybeStartEssentialsTour();
                  }}
                />
                <ArchitectureBotWidget
                  visible={!presentationLock && !(welcomeOpen && showOnboarding)}
                  panelOpen={architectureBot.panelOpen}
                  issues={architectureBot.issues}
                  issueCount={architectureBot.issueCount}
                  animationState={architectureBot.animationState}
                  fixing={architectureBot.fixing}
                  onTogglePanel={architectureBot.togglePanel}
                  onClosePanel={architectureBot.closePanel}
                  onFixEverything={() => void architectureBot.fixEverything()}
                  onOpenCopilot={() => setAiDesignerOpen(true)}
                  onOpenCompliance={handleOpenCompliancePanel}
                />
              </div>
            </section>

            {show3DView && (
              <section
                className={`vish-3d-viewport-pane vish-realism-viewport-frame flex shrink-0 flex-col border-l border-ws-border transition-all duration-300 ease-in-out ${
                  presentationLock ? 'w-full md:w-[32rem] lg:w-[40rem]' : 'w-80 md:w-96'
                } ${expand3DPanel ? 'flex-1 !w-auto' : ''}`}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '400px 100%' } as React.CSSProperties}
                data-tutorial="viewport-3d"
              >
                <div className="ws-pane-header">
                  <span className="ws-pane-label">3D Preview</span>
                  <span className="ws-pane-stat"><Box className="mr-1 inline h-3 w-3" /> Live sync</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Suspense fallback={<Viewport3DLoading />}>
                    <Viewport3D
                      walls={deferredWalls}
                      openings={deferredOpenings}
                      lighting={lighting}
                      furniture={deferredFurniture}
                      materials={materials}
                      mepSymbols={deferredMepSymbols}
                      fixtures={deferredFixtures}
                      landscapeElements={deferredLandscape}
                      terrain={deferredTerrain}
                      rooms={deferredRooms}
                      staircases={deferredStaircases}
                      floorMaterial={engine.getManifest().floorMaterial}
                      walkMode={workspaceMode === 'walk'}
                      presentationLock={presentationLock}
                      floors={engine.getManifest().floors ?? []}
                      activeFloorIndex={engine.getManifest().activeFloorIndex ?? 0}
                      showAllFloorsIn3D={showAllFloorsIn3D}
                      onShowAllFloorsIn3DChange={(value) => engine.setShowAllFloorsIn3D(value)}
                      manifestWalls={engine.getManifest().walls}
                      manifestOpenings={engine.getManifest().openings}
                      manifestRooms={engine.getManifest().rooms ?? []}
                      manifestFurniture={engine.getManifest().furniture ?? []}
                      manifestMepSymbols={engine.getManifest().mepSymbols ?? []}
                      manifestFixtures={engine.getManifest().fixtures ?? []}
                      manifestStaircases={engine.getManifest().staircases ?? []}
                      geometryRevision={geometryRevision}
                    />
                  </Suspense>
                </div>
              </section>
            )}
          </div>

          {!presentationLock && !zenMode && !expand3DPanel && (
          <aside className="vish-dark-panel vish-paper-grain ws-panel-dark hidden w-72 shrink-0 flex-col overflow-hidden md:flex">
            {propertiesPanel}
          </aside>
          )}
        </div>

        {!presentationLock && !zenMode && (
          <>
            <button
              type="button"
              className="vish-properties-fab touch-target fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-ws-border bg-ws-toolbar text-ws-text shadow-lg md:hidden"
              aria-label="Open properties panel"
              onClick={() => setPropertiesSheetOpen(true)}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
            <Sheet open={propertiesSheetOpen} onOpenChange={setPropertiesSheetOpen}>
              <SheetContent side="bottom" className="vish-dark-panel ws-panel-dark max-h-[85dvh] overflow-y-auto p-0 md:hidden">
                <SheetHeader className="border-b border-ws-border px-4 py-3 text-left">
                  <SheetTitle className="text-sm font-semibold text-ws-text">Properties</SheetTitle>
                </SheetHeader>
                {propertiesPanel}
              </SheetContent>
            </Sheet>
          </>
        )}

        <StatusBar
          currentTool={currentTool}
          workspaceMode={workspaceMode}
          wallCount={walls.length}
          openingCount={openings.length}
          mousePos={mousePos}
          snapEnabled={snapEnabled}
          dimensionVisibility={dimensionVisibility}
          canvasZoom={canvasViewport.zoom}
          onToggleDimensions={() => engine.setDimensionVisibility(!engine.getDimensionVisibility())}
          onResetViewport={() => engine.resetCanvasViewport()}
          onZoomIn={() => handleStepZoom('in')}
          onZoomOut={() => handleStepZoom('out')}
        />
      </div>

      <DraftRecoveryDialog
        open={recoveryDialogOpen}
        draft={recoveryDraft}
        onRestore={restoreLocalDraft}
        onDiscard={discardLocalDraft}
        onDismiss={() => setRecoveryDialogOpen(false)}
      />
      <SamplePickerDialog
        open={samplePickerOpen}
        onOpenChange={setSamplePickerOpen}
        loading={loadingSample}
        onSelect={loadSampleBySampleId}
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
        manifest={exportManifest}
        projectName={projectName}
        wallCount={walls.length}
        openingCount={openings.length}
        tier={planTier}
        exportBlocked={complianceReport.blocked}
        exportBlockReason={complianceFailSummary}
      />
      <CustomMaterialDialog
        open={customMaterialOpen}
        onOpenChange={setCustomMaterialOpen}
        onCreate={(material) => engine.addMaterial(material)}
        userId={user?.id}
      />
      {frustrated && <ShunyaOverlay onClose={() => setFrustrated(false)} />}
    </>
  );
}
