// Core type definitions for Vishvakarma.OS

// ============================================================================
// PROJECT MANIFEST TYPES
// ============================================================================

export interface Point2D {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number;
  height: number;
  material: string;
  floorIndex?: number;
  fachwerk?: boolean;
}

export interface Opening {
  id: string;
  type: 'door' | 'window';
  wallId: string;
  position: number; // Position along wall (0-1)
  width: number;
  height: number;
  sillHeight?: number; // For windows
}

export interface Material {
  id: string;
  name: string;
  type: 'paint' | 'wood' | 'concrete' | 'stone' | 'tile' | 'metal' | 'glass' | 'custom';
  color: string;
  roughness: number;
  metalness?: number;
  textureUrl?: string;
}

export interface FixtureItem {
  id: string;
  type: 'point' | 'spot' | 'ceiling';
  position: Point2D;
  intensity?: number;
  floorIndex?: number;
}

export interface BuildingFloor {
  id: string;
  name: string;
  elevation: number;
}

export interface TerrainPatch {
  id: string;
  points: Point2D[];
  elevation: number;
  floorIndex?: number;
}

export interface LightingConfig {
  sunAzimuth: number; // 0-360 degrees
  sunElevation: number; // 0-90 degrees
  timeOfDay: number; // 0-24 hours
  intensity: number; // 0-1
}

export interface Label {
  id: string;
  text: string;
  position: Point2D;
  fontSize?: number;
  color?: string;
}

export interface DimensionAnnotation {
  id: string;
  start: Point2D;
  end: Point2D;
  offset?: number;
}

export interface Room {
  id: string;
  name: string;
  wallIds: string[];
  center?: Point2D;
  area?: number;
  roomType?: string;
  floorIndex?: number;
}

export interface FurnitureItem {
  id: string;
  type: string;
  position: Point2D;
  rotation?: number;
  width?: number;
  depth?: number;
  modelUrl?: string;
  modelScale?: number;
  floorIndex?: number;
}

export interface MepSymbol {
  id: string;
  type: 'outlet' | 'switch' | 'hvac' | 'panel';
  position: Point2D;
  floorIndex?: number;
}

export interface PlumbingRun {
  id: string;
  points: Point2D[];
}

export interface LandscapeElement {
  id: string;
  type: string;
  position: Point2D;
  width?: number;
  depth?: number;
  rotation?: number;
  modelUrl?: string;
  modelScale?: number;
  floorIndex?: number;
}

export interface CostItem {
  id: string;
  label: string;
  amount: number;
}

export interface Staircase {
  id: string;
  position: Point2D;
  direction: number;
  floorIndex?: number;
}

export interface EditorLayerVisibility {
  walls: boolean;
  openings: boolean;
  rooms: boolean;
  furniture: boolean;
  dimensions: boolean;
  labels: boolean;
  mep: boolean;
  landscape: boolean;
  terrain: boolean;
  vastuOverlay: boolean;
}

export const DEFAULT_LAYER_VISIBILITY: EditorLayerVisibility = {
  walls: true,
  openings: true,
  rooms: true,
  furniture: true,
  dimensions: true,
  labels: true,
  mep: true,
  landscape: true,
  terrain: true,
  vastuOverlay: true,
};

export interface CeilingZone {
  id: string;
  roomId?: string;
  type: 'flat' | 'tray' | 'coffered' | 'vaulted';
}

export interface Roof {
  id: string;
  footprint: Point2D[];
  pitch: number;
  material: string;
  floorIndex?: number;
}

export interface ViewportCameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  panX?: number;
  panY?: number;
  canvasZoom?: number;
}

export interface CanvasViewportState {
  panX: number;
  panY: number;
  zoom: number;
}

export type WorkspaceMode = 'draft' | 'mep' | 'interior' | 'landscape' | 'walk';

export type CanvasInteractionState =
  | 'IDLE'
  | 'DRAWING_WALL'
  | 'PLACING_DOOR'
  | 'PLACING_WINDOW'
  | 'PLACING_FURNITURE'
  | 'SELECTING'
  | 'PANNING'
  | 'MEASURING';

export interface ProjectManifest {
  version: string;
  name: string;
  description?: string;
  walls: Wall[];
  openings: Opening[];
  labels?: Label[];
  dimensions?: DimensionAnnotation[];
  rooms?: Room[];
  furniture?: FurnitureItem[];
  mepSymbols?: MepSymbol[];
  plumbingRuns?: PlumbingRun[];
  landscapeElements?: LandscapeElement[];
  measurements?: DimensionAnnotation[];
  costItems?: CostItem[];
  staircases?: Staircase[];
  ceilingZones?: CeilingZone[];
  camera?: ViewportCameraState;
  materials: Material[];
  floorMaterial: string;
  lighting: LightingConfig;
  gridSize: number;
  snapToGrid: boolean;
  northOrientation?: number;
  jurisdiction?: 'au' | 'in';
  regionId?: string;
  dimensionVisibility?: boolean;
  fixtures?: FixtureItem[];
  floors?: BuildingFloor[];
  activeFloorIndex?: number;
  terrain?: TerrainPatch[];
  roofs?: Roof[];
  metadata: {
    created: string;
    modified: string;
    author?: string;
    archived?: boolean;
    aiDesigner?: Record<string, unknown>;
    copilot?: Record<string, unknown>;
    optimization?: Record<string, unknown>;
    costIntelligence?: {
      bestCase: number;
      worstCase: number;
      confidence: number;
      expected: number;
    };
    systemVersions?: Record<string, string>;
    systemMapVersion?: string;
  };
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface CollabSnapshot {
  state: string;
  updatedAt: string;
  revision: number;
}

export interface ProjectCollaborator {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  invitedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  manifest: ProjectManifest;
  created_at: string;
  updated_at: string;
  ownerId?: string;
  collaborators?: string[];
  collabSnapshot?: CollabSnapshot;
}

export interface Spec {
  id: string;
  name: string; // Changed from title to name for consistency
  category: string;
  content: string;
  version: string;
  status: 'draft' | 'approved' | 'deprecated' | 'locked'; // Added 'locked' status
  created_at: string;
  updated_at: string;
}

export interface RegistryEntry {
  id: string;
  name: string;
  type: 'component' | 'feature' | 'tool';
  description?: string;
  metadata?: Record<string, unknown>;
  status: 'active' | 'deprecated';
  created_at: string;
}

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bugfix' | 'enhancement';
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requester?: string;
  reviewer?: string;
  created_at: string;
  reviewed_at?: string;
  implemented_at?: string;
}

export interface Release {
  id: string;
  version: string;
  title: string;
  description?: string;
  change_requests: string[];
  status: 'planned' | 'in_progress' | 'released';
  evidence_pack?: Record<string, unknown>;
  released_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: 'project' | 'spec' | 'registry' | 'change_request' | 'release' | 'optimization_batch';
  entity_id?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface RouteManifestEntry {
  id: string;
  path: string;
  name: string;
  component: string;
  category: 'editor' | 'governance' | 'system';
  visible: boolean;
  order_index: number;
  created_at: string;
}

// ============================================================================
// EDITOR STATE TYPES
// ============================================================================

export type ToolType =
  | 'select'
  | 'pan'
  | 'wall'
  | 'door'
  | 'window'
  | 'measure'
  | 'text'
  | 'dimension'
  | 'room'
  | 'column'
  | 'stair'
  | 'furniture'
  | 'mep'
  | 'vastu'
  | 'landscape'
  | 'terrain';

export interface EditorState {
  currentTool: ToolType;
  selectedWallId?: string;
  selectedWallIds?: string[];
  selectedOpeningId?: string;
  isDrawing: boolean;
  show3DView: boolean;
  gridVisible: boolean;
  snapEnabled: boolean;
}

export interface ViewportCamera {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface ProjectFormData {
  name: string;
  description?: string;
}

export interface SpecFormData {
  title: string;
  category: string;
  content: string;
  version: string;
  status: 'draft' | 'approved' | 'deprecated';
}

export interface ChangeRequestFormData {
  title: string;
  description: string;
  type: 'feature' | 'bugfix' | 'enhancement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requester?: string;
}

export interface ReleaseFormData {
  version: string;
  title: string;
  description?: string;
  change_requests: string[];
}
