import { CollabSession } from '@/collaboration/sync/CollabSession';
import type { Presence } from '@/collaboration/types';
import { DEFAULT_CAST_LENSES, mergeCastLenses } from '@/cast/CastLensState';
import {
  diffManifestIntents,
  snapshotManifestForDiff,
  type ManifestDiffSnapshot,
} from '@/cast/CastIntentRelay';
import {
  createCastSessionRequest,
  createLocalCastSession,
  endCastSessionRequest,
  joinCastRequest,
  publishLocalCastEnd,
  publishLocalViewerJoin,
  resolveLocalCastJoin,
  shouldUseLocalCastFallback,
} from '@/cast/castApi';
import { getLocalCastBus } from '@/cast/LocalCastBus';
import type {
  CastBroadcastState,
  CastChronoState,
  CastIntentEvent,
  CastJoinPayload,
  CastLensState,
  CastPinEvent,
  CastSessionRecord,
} from '@/cast/types';
import type { CastInviteRole } from '@/cast/castTier';
import type { LightingConfig, ProjectManifest, ViewportCameraState } from '@/types';

export type CastRole = 'presenter' | 'viewer';

export interface StartPresenterCastOptions {
  projectId: string;
  userId: string;
  userName: string;
  manifest: ProjectManifest;
  getIdToken: () => Promise<string>;
  onManifestChange?: (manifest: ProjectManifest, isRemote: boolean) => void;
}

export interface JoinViewerCastOptions {
  token: string;
  viewerName: string;
  onManifestChange?: (manifest: ProjectManifest, isRemote: boolean) => void;
}

const DEFAULT_CHRONO: CastChronoState = {
  locked: false,
  lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
};

export class CastSessionManager {
  private static instance: CastSessionManager | null = null;

  private role: CastRole | null = null;
  private session: CastSessionRecord | null = null;
  private shareToken: string | null = null;
  private shareUrl: string | null = null;
  private isLocal = false;
  private lenses: CastLensState = { ...DEFAULT_CAST_LENSES };
  private chrono: CastChronoState = { ...DEFAULT_CHRONO };
  private intentRelayEnabled = true;
  private intents: CastIntentEvent[] = [];
  private pins: CastPinEvent[] = [];
  private viewerCount = 0;
  private followPresenter = true;
  private lastDiffSnapshot: ManifestDiffSnapshot | null = null;
  private busUnsub: (() => void) | null = null;
  private castUnsub: (() => void) | null = null;
  private presenceUnsub: (() => void) | null = null;
  private broadcastStateCallbacks = new Set<(state: CastBroadcastState | null) => void>();
  private intentCallbacks = new Set<(events: CastIntentEvent[]) => void>();
  private viewerCountCallbacks = new Set<(count: number) => void>();
  private joinPayload: CastJoinPayload | null = null;
  private viewerRole: CastInviteRole = 'viewer';
  private presenterGetIdToken: (() => Promise<string>) | null = null;
  private viewerManifestHandler: ((manifest: ProjectManifest) => void) | null = null;

  static getInstance(): CastSessionManager {
    if (!CastSessionManager.instance) {
      CastSessionManager.instance = new CastSessionManager();
    }
    return CastSessionManager.instance;
  }

  static resetInstance(): void {
    void CastSessionManager.instance?.stop();
    CastSessionManager.instance = null;
  }

  getRole(): CastRole | null {
    return this.role;
  }

  getSession(): CastSessionRecord | null {
    return this.session;
  }

  getShareUrl(): string | null {
    return this.shareUrl;
  }

  getLenses(): CastLensState {
    return this.lenses;
  }

  getChrono(): CastChronoState {
    return this.chrono;
  }

  isIntentRelayEnabled(): boolean {
    return this.intentRelayEnabled;
  }

  getIntents(): CastIntentEvent[] {
    return this.intents;
  }

  getViewerCount(): number {
    return this.viewerCount;
  }

  isFollowingPresenter(): boolean {
    return this.followPresenter;
  }

  getViewerRole(): CastInviteRole {
    return this.viewerRole;
  }

  isLive(): boolean {
    return this.session?.status === 'live';
  }

  subscribeBroadcastState(callback: (state: CastBroadcastState | null) => void): () => void {
    this.broadcastStateCallbacks.add(callback);
    callback(this.buildBroadcastState());
    return () => this.broadcastStateCallbacks.delete(callback);
  }

  subscribeIntents(callback: (events: CastIntentEvent[]) => void): () => void {
    this.intentCallbacks.add(callback);
    callback(this.intents);
    return () => this.intentCallbacks.delete(callback);
  }

  subscribeViewerCount(callback: (count: number) => void): () => void {
    this.viewerCountCallbacks.add(callback);
    callback(this.viewerCount);
    return () => this.viewerCountCallbacks.delete(callback);
  }

  async startPresenter(options: StartPresenterCastOptions): Promise<{ shareUrl: string; token: string }> {
    if (this.isLive()) {
      throw new Error('Cast session already live');
    }

    this.role = 'presenter';
    this.presenterGetIdToken = options.getIdToken;
    this.lastDiffSnapshot = snapshotManifestForDiff(options.manifest);
    this.lenses = { ...DEFAULT_CAST_LENSES };
    this.chrono = {
      locked: false,
      lighting: { ...options.manifest.lighting },
    };

    if (shouldUseLocalCastFallback()) {
      const local = createLocalCastSession(options.projectId);
      this.isLocal = true;
      this.shareToken = local.token;
      this.shareUrl = local.shareUrl;
      this.session = {
        id: local.sessionId,
        projectId: options.projectId,
        hostUserId: options.userId,
        status: 'live',
        presenterLensState: this.lenses,
        chronoState: this.chrono,
        intentRelayEnabled: true,
        chronoLockEnabled: false,
        viewerCount: 0,
        createdAt: new Date().toISOString(),
      };
    } else {
      const idToken = await options.getIdToken();
      const created = await createCastSessionRequest({
        projectId: options.projectId,
        idToken,
      });
      this.isLocal = false;
      this.session = created.session;
      this.shareToken = created.token;
      this.shareUrl = created.shareUrl;
      this.lenses = created.session.presenterLensState;
      this.chrono = created.session.chronoState;
      this.intentRelayEnabled = created.session.intentRelayEnabled;
    }

    await this.connectCollab({
      projectId: options.projectId,
      userId: options.userId,
      userName: options.userName,
      getIdToken: options.getIdToken,
      initialManifest: options.manifest,
      onManifestChange: (manifest, isRemote) => {
        if (!isRemote && this.role === 'presenter') {
          this.handlePresenterManifestChange(manifest);
        }
        options.onManifestChange?.(manifest, isRemote);
      },
      authMode: 'supabase',
      castRole: 'presenter',
    });

    this.bindLocalBus();
    this.bindCastAwareness(options.userId);
    this.emitBroadcastState();

    getLocalCastBus().publish({
      type: 'manifest',
      projectId: options.projectId,
      manifest: options.manifest,
    });

    return { shareUrl: this.shareUrl!, token: this.shareToken! };
  }

  async joinViewer(options: JoinViewerCastOptions): Promise<CastJoinPayload> {
    if (this.isLive()) {
      await this.stop();
    }

    this.role = 'viewer';
    this.followPresenter = true;
    this.viewerManifestHandler = options.onManifestChange
      ? (manifest) => options.onManifestChange?.(manifest, true)
      : null;

    const local = resolveLocalCastJoin(options.token);
    if (local) {
      this.isLocal = true;
      this.shareToken = local.token;
      this.shareUrl = local.shareUrl;
      this.session = {
        id: local.sessionId,
        projectId: local.projectId,
        hostUserId: 'local-presenter',
        status: 'live',
        presenterLensState: { ...DEFAULT_CAST_LENSES },
        chronoState: { ...DEFAULT_CHRONO },
        intentRelayEnabled: true,
        chronoLockEnabled: false,
        viewerCount: 0,
        createdAt: new Date().toISOString(),
      };
      this.joinPayload = {
        session: this.session,
        projectId: local.projectId,
        projectName: 'Live cast',
        role: 'viewer',
        wsUrl: '',
        token: local.token,
        manifest: null,
      };
      publishLocalViewerJoin(local.sessionId);
    } else {
      const joined = await joinCastRequest(options.token);
      this.isLocal = false;
      this.joinPayload = joined;
      this.session = joined.session;
      this.shareToken = options.token;
      this.lenses = joined.session.presenterLensState;
      this.chrono = joined.session.chronoState;
      this.viewerRole = joined.role;
    }

    const viewerId = `cast-viewer-${crypto.randomUUID().slice(0, 8)}`;

    await this.connectCollab({
      projectId: this.session!.projectId,
      userId: viewerId,
      userName: options.viewerName,
      getIdToken: async () => options.token,
      initialManifest: (this.joinPayload?.manifest as ProjectManifest | null | undefined) ?? undefined,
      onManifestChange: (manifest, isRemote) => {
        if (isRemote) {
          options.onManifestChange?.(manifest, isRemote);
        }
      },
      authMode: 'cast',
      readOnly: true,
      castRole: 'viewer',
    });

    this.bindLocalBus();
    this.bindCastAwareness(viewerId);
    this.emitBroadcastState();

    return this.joinPayload!;
  }

  async stop(): Promise<void> {
    if (this.session && this.role === 'presenter' && !this.isLocal) {
      try {
        const collab = CollabSession.getInstance();
        const token = await this.resolvePresenterToken();
        if (token) {
          await endCastSessionRequest({ sessionId: this.session.id, idToken: token });
        }
        void collab;
      } catch {
        // best effort
      }
    }

    if (this.session && this.isLocal && this.role === 'presenter') {
      publishLocalCastEnd(this.session.id);
    }

    this.busUnsub?.();
    this.castUnsub?.();
    this.presenceUnsub?.();
    this.busUnsub = null;
    this.castUnsub = null;
    this.presenceUnsub = null;

    await CollabSession.getInstance().disconnect();

    this.role = null;
    this.session = null;
    this.shareToken = null;
    this.shareUrl = null;
    this.viewerCount = 0;
    this.intents = [];
    this.pins = [];
    this.joinPayload = null;
    this.emitBroadcastState();
    this.emitViewerCount();
    this.emitIntents();
  }

  setLenses(patch: Partial<CastLensState>): void {
    if (this.role !== 'presenter') return;
    this.lenses = mergeCastLenses(this.lenses, patch);
    this.publishBroadcast();
  }

  setChrono(chrono: Partial<CastChronoState>): void {
    if (this.role !== 'presenter') return;
    this.chrono = {
      ...this.chrono,
      ...chrono,
      lighting: chrono.lighting ? { ...chrono.lighting } : this.chrono.lighting,
    };
    this.publishBroadcast();
  }

  setIntentRelayEnabled(enabled: boolean): void {
    if (this.role !== 'presenter') return;
    this.intentRelayEnabled = enabled;
    this.publishBroadcast();
  }

  updatePresenterViewport(viewport: ViewportCameraState): void {
    if (this.role !== 'presenter') return;
    const collab = CollabSession.getInstance();
    collab.updatePresence({ viewport });
    this.publishBroadcast(viewport);
  }

  updatePresenterLighting(lighting: LightingConfig): void {
    if (this.role !== 'presenter') return;
    if (this.chrono.locked) {
      this.setChrono({ lighting: { ...lighting } });
    }
  }

  setFollowPresenter(value: boolean): void {
    this.followPresenter = value;
  }

  addPin(pin: Omit<CastPinEvent, 'id' | 'timestamp'>): void {
    const next: CastPinEvent = {
      ...pin,
      id: `pin-${Date.now()}`,
      timestamp: Date.now(),
    };
    this.pins = [...this.pins, next];
    getLocalCastBus().publish({
      type: 'pin',
      sessionId: this.session?.id ?? '',
      pin: next,
    });
  }

  private async resolvePresenterToken(): Promise<string | null> {
    if (!this.presenterGetIdToken) return null;
    try {
      return await this.presenterGetIdToken();
    } catch {
      return null;
    }
  }

  private async connectCollab(options: {
    projectId: string;
    userId: string;
    userName: string;
    getIdToken: () => Promise<string>;
    initialManifest?: ProjectManifest;
    onManifestChange?: (manifest: ProjectManifest, isRemote: boolean) => void;
    authMode?: 'supabase' | 'cast';
    readOnly?: boolean;
    castRole?: 'presenter' | 'viewer';
  }): Promise<void> {
    const collab = CollabSession.getInstance();
    await collab.connect({
      wsUrl: import.meta.env.VITE_COLLAB_WS_URL ?? '',
      projectId: options.projectId,
      userId: options.userId,
      userName: options.userName,
      getIdToken: options.getIdToken,
      initialManifest: options.initialManifest,
      onManifestChange: options.onManifestChange,
      authMode: options.authMode,
      readOnly: options.readOnly,
      castRole: options.castRole,
    });

    if (options.readOnly) {
      collab.getBridge()?.setActive(false);
    }
  }

  private handlePresenterManifestChange(manifest: ProjectManifest): void {
    if (!this.intentRelayEnabled || !this.lastDiffSnapshot) {
      this.lastDiffSnapshot = snapshotManifestForDiff(manifest);
      return;
    }

    const after = snapshotManifestForDiff(manifest);
    const events = diffManifestIntents(this.lastDiffSnapshot, after, manifest);
    this.lastDiffSnapshot = after;

    if (events.length === 0) return;

    this.intents = [...events, ...this.intents].slice(0, 100);
    this.emitIntents();
    getLocalCastBus().publish({
      type: 'intent',
      sessionId: this.session?.id ?? '',
      events,
    });

    if (this.isLocal) {
      getLocalCastBus().publish({
        type: 'manifest',
        projectId: this.session?.projectId ?? '',
        manifest,
      });
    }
  }

  private bindLocalBus(): void {
    this.busUnsub?.();
    this.busUnsub = getLocalCastBus().subscribe((message) => {
      if (!this.session || message.type === 'session_end') {
        if (message.type === 'session_end' && this.session?.id === message.sessionId) {
          void this.stop();
        }
        return;
      }

      if ('sessionId' in message && message.sessionId && message.sessionId !== this.session.id) return;

      switch (message.type) {
        case 'broadcast':
          if (this.role === 'viewer') {
            this.lenses = message.state.lenses;
            this.chrono = message.state.chrono;
            this.intentRelayEnabled = message.state.intentRelayEnabled;
            this.emitBroadcastState();
          }
          break;
        case 'intent':
          if (this.role === 'viewer') {
            this.intents = [...message.events, ...this.intents].slice(0, 100);
            this.emitIntents();
          }
          break;
        case 'pin':
          this.pins = [...this.pins, message.pin];
          break;
        case 'viewer_join':
          if (this.role === 'presenter') {
            this.viewerCount += 1;
            this.emitViewerCount();
          }
          break;
        case 'manifest':
          if (
            this.role === 'viewer' &&
            this.session &&
            message.projectId === this.session.projectId &&
            message.manifest
          ) {
            this.viewerManifestHandler?.(message.manifest as ProjectManifest);
          }
          break;
        default:
          break;
      }
    });
  }

  private bindCastAwareness(userId: string): void {
    const collab = CollabSession.getInstance();
    this.castUnsub?.();
    this.castUnsub = collab.subscribeCastState((state) => {
      if (this.role === 'viewer' && state && state.presenterUserId !== userId) {
        this.lenses = state.lenses;
        this.chrono = state.chrono;
        this.intentRelayEnabled = state.intentRelayEnabled;
        this.emitBroadcastState();
      }
    });

    if (this.role === 'presenter') {
      this.publishBroadcast();
    }

    this.presenceUnsub?.();
    this.presenceUnsub = collab.subscribePresence((presences) => {
      if (this.role === 'presenter') {
        const viewers = presences.filter((p) => p.castRole === 'viewer').length;
        this.viewerCount = viewers;
        this.emitViewerCount();
      }
    });
  }

  private publishBroadcast(viewport?: ViewportCameraState): void {
    const state = this.buildBroadcastState(viewport);
    if (!state) return;
    getLocalCastBus().publish({ type: 'broadcast', state });
    CollabSession.getInstance().updateCastState(state);
    this.emitBroadcastState();
  }

  private buildBroadcastState(viewport?: ViewportCameraState): CastBroadcastState | null {
    if (!this.session || !this.role) return null;
    return {
      sessionId: this.session.id,
      presenterUserId: this.role === 'presenter' ? this.session.hostUserId : '',
      lenses: this.lenses,
      chrono: this.chrono,
      intentRelayEnabled: this.intentRelayEnabled,
      viewport,
    };
  }

  private emitBroadcastState(): void {
    const state = this.buildBroadcastState();
    for (const callback of this.broadcastStateCallbacks) {
      callback(state);
    }
  }

  private emitIntents(): void {
    for (const callback of this.intentCallbacks) {
      callback(this.intents);
    }
  }

  private emitViewerCount(): void {
    for (const callback of this.viewerCountCallbacks) {
      callback(this.viewerCount);
    }
  }

  getPresenterPresence(presences: Presence[]): Presence | null {
    return presences.find((p) => p.castRole === 'presenter') ?? presences[0] ?? null;
  }
}

export function getCastSessionManager(): CastSessionManager {
  return CastSessionManager.getInstance();
}
