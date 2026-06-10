import { backendStatus } from '@/backend/backendConfig';
import { resolveFirebaseSessionForFirestore } from '@/backend/firebase/firebaseAuthGateway';
import { ManifestCollabBridge } from '@/collaboration/crdt/manifestBridge';
import type { CollabSessionOptions, Presence } from '@/collaboration/types';
import type { CollaborationMessage } from '@/modules/collaborationEngine';
import type { ProjectManifest } from '@/types';
import { FirebaseSnapshotProvider } from './FirebaseSnapshotProvider';
import { LocalCollabTransportAdapter, type CollabTransportAdapter } from './CollabTransportAdapter';
import { YjsWebSocketProvider } from './YjsWebSocketProvider';

function getCollabWsUrl(): string {
  const envUrl = import.meta.env.VITE_COLLAB_WS_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim();
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}:1234`;
  }
  return 'ws://127.0.0.1:1234';
}

export class CollabSession {
  private static instance: CollabSession | null = null;
  private bridge: ManifestCollabBridge | null = null;
  private transport: CollabTransportAdapter = new LocalCollabTransportAdapter();
  private yjsProvider: YjsWebSocketProvider | null = null;
  private snapshotProvider = new FirebaseSnapshotProvider();
  private connected = false;
  private roomId: string | null = null;
  private currentUserId: string | null = null;
  private messageCallbacks = new Set<(message: CollaborationMessage) => void>();
  private presenceCallbacks = new Set<(presences: Presence[]) => void>();
  private options: CollabSessionOptions | null = null;

  static getInstance(): CollabSession {
    if (!CollabSession.instance) {
      CollabSession.instance = new CollabSession();
    }
    return CollabSession.instance;
  }

  static resetInstance(): void {
    if (CollabSession.instance) {
      void CollabSession.instance.disconnect();
      CollabSession.instance = null;
    }
  }

  getBridge(): ManifestCollabBridge | null {
    return this.bridge;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  async connect(options: CollabSessionOptions): Promise<void> {
    if (this.connected) return;

    this.options = options;
    this.roomId = options.projectId;
    this.currentUserId = options.userId;

    this.bridge = new ManifestCollabBridge(options.initialManifest);
    this.bridge.setActive(true);
    this.bridge.setRemoteListener((manifest, isRemote) => {
      options.onManifestChange?.(manifest, isRemote);
      if (!isRemote) {
        this.snapshotProvider.scheduleSnapshot();
      }
    });

    this.snapshotProvider.bind(options.projectId, this.bridge);
    if (backendStatus.isConfigured) {
      try {
        await this.snapshotProvider.restoreSnapshot(options.projectId, this.bridge);
      } catch {
        // Cold start — seed from initial manifest.
      }
    }

    const useRemote =
      backendStatus.isConfigured &&
      typeof import.meta.env.VITE_COLLAB_WS_URL === 'string' &&
      import.meta.env.VITE_COLLAB_WS_URL.trim().length > 0;

    if (useRemote) {
      this.yjsProvider = new YjsWebSocketProvider({
        doc: this.bridge.getDoc(),
        wsUrl: getCollabWsUrl(),
        projectId: options.projectId,
        userId: options.userId,
        userName: options.userName,
        getIdToken: options.getIdToken,
      });
      await this.yjsProvider.connect();
      this.transport = {
        connect: async () => this.yjsProvider?.connect(),
        disconnect: async () => this.yjsProvider?.disconnect(),
        isConnected: () => this.yjsProvider?.isConnected() ?? false,
        broadcast: (message) => this.yjsProvider?.broadcast(message),
        subscribe: (callback) => this.yjsProvider?.subscribeMessages(callback) ?? (() => {}),
        updatePresence: (presence) => this.yjsProvider?.updatePresence(presence),
        getPresences: () => this.yjsProvider?.getPresences() ?? [],
      };
      this.yjsProvider.subscribePresence((presences) => {
        for (const callback of this.presenceCallbacks) {
          callback(presences);
        }
        options.onPresenceChange?.(presences);
      });
    } else {
      this.transport = new LocalCollabTransportAdapter();
      await this.transport.connect();
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.bridge) {
      try {
        await this.snapshotProvider.flushSnapshot();
      } catch {
        // Best-effort snapshot on disconnect.
      }
    }

    await this.transport.disconnect();
    await this.yjsProvider?.disconnect();
    this.yjsProvider = null;
    this.snapshotProvider.destroy();
    this.bridge?.destroy();
    this.bridge = null;
    this.connected = false;
    this.roomId = null;
    this.currentUserId = null;
    this.options = null;
    this.transport = new LocalCollabTransportAdapter();
  }

  applyPartial(partial: Partial<ProjectManifest>, label = 'Edit'): void {
    this.bridge?.applyPartial(partial, label);
  }

  toManifest(): ProjectManifest | null {
    return this.bridge?.toManifest() ?? null;
  }

  broadcast(message: CollaborationMessage): void {
    this.transport.broadcast(message);
    for (const callback of this.messageCallbacks) {
      callback(message);
    }
  }

  subscribe(callback: (message: CollaborationMessage) => void): () => void {
    this.messageCallbacks.add(callback);
    const transportUnsub = this.transport.subscribe(callback);
    return () => {
      this.messageCallbacks.delete(callback);
      transportUnsub();
    };
  }

  subscribePresence(callback: (presences: Presence[]) => void): () => void {
    this.presenceCallbacks.add(callback);
    if (this.yjsProvider) {
      return this.yjsProvider.subscribePresence(callback);
    }
    callback([]);
    return () => this.presenceCallbacks.delete(callback);
  }

  updatePresence(partial: Partial<Presence>): void {
    this.transport.updatePresence(partial);
  }

  getPresences(): Presence[] {
    return this.transport.getPresences();
  }

  getAwareness() {
    return this.yjsProvider?.getAwareness() ?? null;
  }
}
