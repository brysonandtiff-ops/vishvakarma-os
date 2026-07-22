import type { EditorLayerVisibility, LightingConfig, ProjectManifest, ViewportCameraState } from '@/types';
import type { CastInviteRole } from '@/cast/castTier';

export type CastSessionStatus = 'live' | 'ended';

export interface CastLensState {
  thermal: boolean;
  vayu: boolean;
  vastu: boolean;
  mep: boolean;
  compliance: boolean;
  panchatattva: boolean;
  layers: Partial<EditorLayerVisibility>;
}

export interface CastChronoState {
  locked: boolean;
  lighting: LightingConfig;
}

export interface CastBroadcastState {
  sessionId: string;
  presenterUserId: string;
  lenses: CastLensState;
  chrono: CastChronoState;
  intentRelayEnabled: boolean;
  viewport?: ViewportCameraState;
}

export interface CastSessionRecord {
  id: string;
  projectId: string;
  hostUserId: string;
  status: CastSessionStatus;
  presenterLensState: CastLensState;
  chronoState: CastChronoState;
  intentRelayEnabled: boolean;
  chronoLockEnabled: boolean;
  viewerCount: number;
  createdAt: string;
  endedAt?: string | null;
}

export interface CastJoinPayload {
  session: CastSessionRecord;
  projectId: string;
  projectName: string;
  role: CastInviteRole;
  wsUrl: string;
  token: string;
  manifest?: ProjectManifest | null;
}

export type CastIntentEventType = 'walls' | 'openings' | 'lighting' | 'rooms' | 'general';

export interface CastIntentEvent {
  id: string;
  type: CastIntentEventType;
  message: string;
  timestamp: number;
  scores?: {
    vastuDelta?: number;
    thermalBefore?: number;
    thermalAfter?: number;
    panchatattvaBefore?: number;
    panchatattvaAfter?: number;
  };
}

export type CastPinEvent = {
  id: string;
  roomId?: string;
  elementId?: string;
  message: string;
  authorName: string;
  timestamp: number;
};

export interface CastEvidenceRoll {
  sessionId: string;
  projectId: string;
  startedAt: string;
  endedAt?: string | null;
  intents: CastIntentEvent[];
  pins: CastPinEvent[];
  lensSnapshots: Array<{ timestamp: number; lenses: CastLensState }>;
}

export interface LocalCastSession {
  sessionId: string;
  projectId: string;
  token: string;
  shareUrl: string;
  isLocal: boolean;
}
