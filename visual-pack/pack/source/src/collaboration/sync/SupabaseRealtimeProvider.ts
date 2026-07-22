import { getSupabaseClient } from '@/backend/supabase/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import * as Y from 'yjs';
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

export class SupabaseRealtimeProvider {
  private channel: RealtimeChannel | null = null;
  private messageCallbacks = new Set<(message: CollaborationMessage) => void>();
  private presenceCallbacks = new Set<(presences: Presence[]) => void>();
  private castCallbacks = new Set<(state: CastBroadcastState | null) => void>();
  private userColor: string;
  private connected = false;
  private presences: Presence[] = [];
  private localPresenceState: Presence;

  constructor(private options: YjsProviderOptions) {
    this.userColor = this.generateUserColor();
    this.localPresenceState = {
      userId: this.options.userId,
      name: this.options.userName,
      color: this.userColor,
      cursor: { x: 0, y: 0 },
      viewport: DEFAULT_PRESENCE_VIEWPORT,
      activeTool: 'select',
      lastSeen: Date.now(),
      castRole: this.options.castRole,
      followPresenter: this.options.castRole === 'viewer',
    };
  }

  async connect(): Promise<void> {
    if (this.channel) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[SupabaseRealtimeProvider] Supabase client not configured.');
      this.connected = false;
      this.options.onStatusChange?.('disconnected');
      return;
    }

    const channelName = `project-room-${this.options.projectId}`;
    this.options.onStatusChange?.('connecting');

    // Create the channel
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: this.options.userId },
      },
    });

    this.channel = channel;

    // Yjs sync broadcast handlers
    channel.on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
      if (payload && typeof payload.update === 'string') {
        try {
          const update = this.base64ToUint8Array(payload.update);
          Y.applyUpdate(this.options.doc, update, this);
        } catch (error) {
          console.error('[SupabaseRealtimeProvider] Failed to apply Yjs update:', error);
        }
      }
    });

    // Custom collaboration message broadcast handler
    channel.on('broadcast', { event: 'collab-msg' }, ({ payload }) => {
      const message = payload as CollaborationMessage;
      for (const callback of this.messageCallbacks) {
        callback(message);
      }
    });

    // Cast state broadcast handler
    channel.on('broadcast', { event: 'cast-state' }, ({ payload }) => {
      const state = payload as CastBroadcastState | null;
      for (const callback of this.castCallbacks) {
        callback(state);
      }
    });

    // Presence synchronizer
    channel.on('presence', { event: 'sync' }, () => {
      const stateMap = channel.presenceState();
      const nextPresences: Presence[] = [];

      for (const key of Object.keys(stateMap)) {
        const list = stateMap[key] as any[];
        if (list) {
          for (const presence of list) {
            // Exclude current user from presences overlay to avoid drawing double cursor
            if (presence.userId === this.options.userId && this.options.castRole !== 'presenter') {
              continue;
            }
            nextPresences.push({
              ...presence,
              lastSeen: presence.lastSeen ?? Date.now(),
            });
          }
        }
      }

      this.presences = nextPresences;
      for (const callback of this.presenceCallbacks) {
        callback(nextPresences);
      }
    });

    // Attach Yjs update event listener
    this.options.doc.on('update', this.onDocUpdate);

    return new Promise((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.connected = true;
          this.options.onStatusChange?.('connected');
          void channel.track(this.localPresenceState);
          resolve();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.connected = false;
          this.options.onStatusChange?.('disconnected');
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    this.options.doc.off('update', this.onDocUpdate);

    if (this.channel) {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.removeChannel(this.channel);
      }
      this.channel = null;
    }

    this.connected = false;
    this.options.onStatusChange?.('disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  getAwareness(): null {
    // Awareness is replaced by Supabase Presence sync
    return null;
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
    if (this.channel) {
      void this.channel.send({
        type: 'broadcast',
        event: 'cast-state',
        payload: state,
      });
    }
  }

  broadcast(message: CollaborationMessage): void {
    // Deliver locally
    for (const callback of this.messageCallbacks) {
      callback(message);
    }
    // Broadcast to remote co-designers
    if (this.channel) {
      void this.channel.send({
        type: 'broadcast',
        event: 'collab-msg',
        payload: message,
      });
    }
  }

  updatePresence(partial: Partial<Presence>): void {
    this.localPresenceState = {
      ...this.localPresenceState,
      ...partial,
      lastSeen: Date.now(),
    };

    if (this.channel && this.connected) {
      void this.channel.track(this.localPresenceState);
    }
  }

  getPresences(): Presence[] {
    return this.presences;
  }

  getRemoteCastState(): CastBroadcastState | null {
    // Find presenter's cast state from presences list
    const presenter = this.presences.find((p) => p.castRole === 'presenter');
    return presenter ? null : null; // fallback or track presenter's castState separately if needed
  }

  private onDocUpdate = (update: Uint8Array, origin: any) => {
    if (origin === this) return; // Prevent infinite loop back from remote sync
    if (this.channel && this.connected) {
      const base64 = this.uint8ArrayToBase64(update);
      void this.channel.send({
        type: 'broadcast',
        event: 'yjs-update',
        payload: { update: base64 },
      });
    }
  };

  private uint8ArrayToBase64(arr: Uint8Array): string {
    let binary = '';
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8Array(str: string): Uint8Array {
    const binary = atob(str);
    const len = binary.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = binary.charCodeAt(i);
    }
    return arr;
  }

  private generateUserColor(): string {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
