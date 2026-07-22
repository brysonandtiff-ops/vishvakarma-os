import { WebsocketProvider } from 'y-websocket';
import type * as Y from 'yjs';
import {
  DEFAULT_PRESENCE_VIEWPORT,
  type CastAwarenessState,
  type CollabTransportConfig,
  type Presence,
} from '@/collaboration/types';
import type { CastBroadcastState } from '@/cast/types';
import type { CollaborationMessage } from '@/modules/collaborationEngine';

export interface YjsProviderOptions extends CollabTransportConfig {
  doc: Y.Doc;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
  authMode?: 'supabase' | 'cast';
  castRole?: Presence['castRole'];
}

export class YjsWebSocketProvider {
  private provider: WebsocketProvider | null = null;
  private awareness: WebsocketProvider['awareness'] | null = null;
  private messageCallbacks = new Set<(message: CollaborationMessage) => void>();
  private presenceCallbacks = new Set<(presences: Presence[]) => void>();
  private castCallbacks = new Set<(state: CastBroadcastState | null) => void>();
  private userColor: string;
  private connected = false;

  constructor(private options: YjsProviderOptions) {
    this.userColor = this.generateUserColor();
  }

  async connect(): Promise<void> {
    if (this.provider) return;

    const token = await this.options.getIdToken();
    const roomName = `project-${this.options.projectId}`;
    const authParam = this.options.authMode === 'cast' ? 'castToken' : 'token';

    this.options.onStatusChange?.('connecting');

    this.provider = new WebsocketProvider(
      this.options.wsUrl.replace(/\/$/, ''),
      roomName,
      this.options.doc,
      {
        params: {
          [authParam]: token,
          token,
          userId: this.options.userId,
          userName: this.options.userName,
          castRole: this.options.castRole ?? '',
        },
        connect: true,
      }
    );

    this.awareness = this.provider.awareness;

    this.awareness.setLocalStateField('user', {
      userId: this.options.userId,
      name: this.options.userName,
      color: this.userColor,
      cursor: { x: 0, y: 0 },
      viewport: DEFAULT_PRESENCE_VIEWPORT,
      activeTool: 'select',
      lastSeen: Date.now(),
      castRole: this.options.castRole,
      followPresenter: this.options.castRole === 'viewer',
    });

    this.provider.on('status', (event: { status: string }) => {
      this.connected = event.status === 'connected';
      this.options.onStatusChange?.(
        event.status === 'connected'
          ? 'connected'
          : event.status === 'connecting'
            ? 'connecting'
            : 'disconnected'
      );
      if (this.connected) {
        this.emitPresences();
      }
    });

    this.awareness.on('change', () => {
      this.emitPresences();
      this.emitCastStates();
    });

  }

  async disconnect(): Promise<void> {
    this.provider?.destroy();
    this.provider = null;
    this.awareness = null;
    this.connected = false;
    this.options.onStatusChange?.('disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  getAwareness(): WebsocketProvider['awareness'] | null {
    return this.awareness;
  }

  subscribeMessages(callback: (message: CollaborationMessage) => void): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  subscribePresence(callback: (presences: Presence[]) => void): () => void {
    this.presenceCallbacks.add(callback);
    callback(this.getPresences());
    return () => this.presenceCallbacks.delete(callback);
  }

  subscribeCastState(callback: (state: CastBroadcastState | null) => void): () => void {
    this.castCallbacks.add(callback);
    callback(this.getRemoteCastState());
    return () => this.castCallbacks.delete(callback);
  }

  updateCastState(state: CastBroadcastState): void {
    if (!this.awareness) return;
    this.awareness.setLocalStateField('cast', state as unknown as CastAwarenessState);
  }

  broadcast(message: CollaborationMessage): void {
    for (const callback of this.messageCallbacks) {
      callback(message);
    }
  }

  updatePresence(partial: Partial<Presence>): void {
    if (!this.awareness) return;
    const current = (this.awareness.getLocalState()?.user as Presence | undefined) ?? {
      userId: this.options.userId,
      name: this.options.userName,
      color: this.userColor,
      cursor: { x: 0, y: 0 },
      viewport: DEFAULT_PRESENCE_VIEWPORT,
      lastSeen: Date.now(),
    };
    this.awareness.setLocalStateField('user', {
      ...current,
      ...partial,
      lastSeen: Date.now(),
    });
  }

  getPresences(): Presence[] {
    if (!this.awareness) return [];
    const result: Presence[] = [];
    this.awareness.getStates().forEach((state, clientId) => {
      const user = state.user as Presence | undefined;
      if (!user) return;
      if (user.userId === this.options.userId && this.options.castRole !== 'presenter') return;
      if (this.awareness && this.awareness.meta.has(clientId)) {
        result.push({ ...user, lastSeen: user.lastSeen ?? Date.now() });
      }
    });
    return result;
  }

  getRemoteCastState(): CastBroadcastState | null {
    if (!this.awareness) return null;
    let found: CastBroadcastState | null = null;
    this.awareness.getStates().forEach((state, clientId) => {
      if (!this.awareness?.meta.has(clientId)) return;
      const cast = state.cast as CastBroadcastState | undefined;
      const user = state.user as Presence | undefined;
      if (cast && user?.castRole === 'presenter') {
        found = cast;
      }
    });
    return found;
  }

  private emitCastStates(): void {
    const state = this.getRemoteCastState();
    for (const callback of this.castCallbacks) {
      callback(state);
    }
  }

  private emitPresences(): void {
    const presences = this.getPresences();
    for (const callback of this.presenceCallbacks) {
      callback(presences);
    }
  }

  private generateUserColor(): string {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
