import type {
  DimensionAnnotation,
  Label,
  Opening,
  Point2D,
  Roof,
  Room,
  ViewportCameraState,
  Wall,
} from '@/types';

export type CollaborativeEntityType =
  | 'wall'
  | 'room'
  | 'window'
  | 'roof'
  | 'annotation';

export type AnnotationPayload =
  | { kind: 'dimension'; data: DimensionAnnotation }
  | { kind: 'label'; data: Label };

export type CollaborativeEntityData =
  | Wall
  | Room
  | Opening
  | Roof
  | AnnotationPayload;

export interface CollaborativeEntity {
  id: string;
  type: CollaborativeEntityType;
  floorIndex?: number;
  data: CollaborativeEntityData;
  updatedAt: number;
  updatedBy: string;
}

export type CastPresenceRole = 'presenter' | 'viewer';

export interface Presence {
  userId: string;
  name: string;
  color: string;
  cursor: Point2D;
  viewport: ViewportCameraState;
  activeTool?: string;
  focusedEntityId?: string;
  lastSeen: number;
  castRole?: CastPresenceRole;
  followPresenter?: boolean;
}

export interface CastAwarenessState {
  sessionId: string;
  presenterUserId: string;
  lenses: Record<string, unknown>;
  chrono: Record<string, unknown>;
  intentRelayEnabled: boolean;
  viewport?: ViewportCameraState;
}

export const DEFAULT_PRESENCE_VIEWPORT: ViewportCameraState = {
  position: [0, 10, 10],
  target: [0, 0, 0],
  zoom: 1,
};

export interface CollabTransportConfig {
  wsUrl: string;
  projectId: string;
  userId: string;
  userName: string;
  getIdToken: () => Promise<string>;
}

export interface CollabSessionOptions extends CollabTransportConfig {
  initialManifest?: import('@/types').ProjectManifest;
  onManifestChange?: (manifest: import('@/types').ProjectManifest, isRemote: boolean) => void;
  onPresenceChange?: (presences: Presence[]) => void;
  authMode?: 'supabase' | 'cast';
  readOnly?: boolean;
  castRole?: CastPresenceRole;
}
