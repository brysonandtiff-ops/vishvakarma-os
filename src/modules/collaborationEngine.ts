/**
 * Collaboration Engine Module
 *
 * Facade over CollabSession for presence, messaging, and Yjs-backed manifest sync.
 */

import { backendStatus } from '@/backend/backendConfig';
import { getSupabaseAccessToken } from '@/backend/supabase/supabaseAccessToken';
import { CollabSession } from '@/collaboration/sync/CollabSession';
import { isCollabReadOnlyMode } from '@/collaboration/presenceReadOnly';
import type { Presence } from '@/collaboration/types';
import type { ProjectManifest } from '@/types';
import { acquireElementLock, releaseElementLock } from '@/modules/elementLock';

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  activeTool?: string;
  isOnline: boolean;
  lastSeen: number;
  focusedEntityId?: string;
}

export interface CollaborationMessage {
  type: 'operation' | 'cursor' | 'lock' | 'unlock' | 'presence' | 'chat';
  userId: string;
  timestamp: number;
  data: unknown;
}

export interface OperationMessage extends CollaborationMessage {
  type: 'operation';
  data: {
    operation: string;
    elementId?: string;
    elementType?: 'wall' | 'opening' | 'room' | 'window' | 'roof' | 'annotation';
    payload: unknown;
  };
}

export interface CursorMessage extends CollaborationMessage {
  type: 'cursor';
  data: {
    x: number;
    y: number;
    tool?: string;
    viewport?: Presence['viewport'];
  };
}

export interface LockMessage extends CollaborationMessage {
  type: 'lock' | 'unlock';
  data: {
    elementId: string;
    elementType: 'wall' | 'opening' | 'room' | 'window' | 'roof' | 'annotation';
  };
}

export interface PresenceMessage extends CollaborationMessage {
  type: 'presence';
  data: {
    status: 'online' | 'offline';
    name: string;
    color: string;
  };
}

export interface ChatMessage extends CollaborationMessage {
  type: 'chat';
  data: {
    message: string;
    userName: string;
  };
}

export type CollaborationCallback = (message: CollaborationMessage) => void;

type ManifestChangeHandler = (manifest: ProjectManifest, isRemote: boolean) => void;

async function requireSupabaseAccessToken() {
  const token = await getSupabaseAccessToken();
  if (!token) {
    throw new Error('Your secure Supabase session is unavailable. Sign in again and retry.');
  }
  return token;
}

export class CollaborationEngine {
  private static instance: CollaborationEngine | null = null;
  private users: Map<string, User> = new Map();
  private currentUserId: string | null = null;
  private callbacks: Set<CollaborationCallback> = new Set();
  private connected = false;
  private roomId: string | null = null;
  private heartbeatInterval: number | null = null;
  private session = CollabSession.getInstance();
  private manifestHandler: ManifestChangeHandler | null = null;
  private presenceUnsub: (() => void) | null = null;
  private sessionUnsub: (() => void) | null = null;
  private userColor = '#3b82f6';

  private constructor() {}

  static getInstance(): CollaborationEngine {
    if (!this.instance) {
      this.instance = new CollaborationEngine();
    }
    return this.instance;
  }

  async connect(
    roomId: string,
    userId: string,
    userName: string,
    options?: { initialManifest?: ProjectManifest; onManifestChange?: ManifestChangeHandler },
  ): Promise<void> {
    if (this.connected) {
      console.warn('Already connected to collaboration room');
      return;
    }

    this.roomId = roomId;
    this.currentUserId = userId;
    this.connected = true;
    this.userColor = this.generateUserColor();
    this.manifestHandler = options?.onManifestChange ?? null;

    this.users.set(userId, {
      id: userId,
      name: userName,
      color: this.userColor,
      isOnline: true,
      lastSeen: Date.now(),
    });

    this.broadcastPresence('online', userName, this.userColor);

    await this.session.connect({
      wsUrl: import.meta.env.VITE_COLLAB_WS_URL ?? 'ws://127.0.0.1:1234',
      projectId: roomId,
      userId,
      userName,
      getIdToken: requireSupabaseAccessToken,
      readOnly: isCollabReadOnlyMode(),
      initialManifest: options?.initialManifest,
      onManifestChange: (manifest, isRemote) => {
        this.manifestHandler?.(manifest, isRemote);
      },
      onPresenceChange: (presences) => {
        this.syncUsersFromPresences(presences, userName);
      },
    });

    this.sessionUnsub = this.session.subscribe((message) => {
      this.handleRemoteMessage(message);
    });

    this.presenceUnsub = this.session.subscribePresence((presences) => {
      this.syncUsersFromPresences(presences, userName);
    });

    if (!backendStatus.isConfigured) {
      console.warn('[Collaboration] Backend not configured — using local session delivery only.');
    }

    this.startHeartbeat();
    console.log(`Connected to room ${roomId} as ${userName}`);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    if (this.currentUserId) {
      const user = this.users.get(this.currentUserId);
      if (user) {
        this.broadcastPresence('offline', user.name, user.color);
      }
    }

    this.stopHeartbeat();
    this.presenceUnsub?.();
    this.sessionUnsub?.();
    this.presenceUnsub = null;
    this.sessionUnsub = null;
    await this.session.disconnect();

    this.connected = false;
    this.roomId = null;
    this.currentUserId = null;
    this.users.clear();
    this.manifestHandler = null;
    console.log('Disconnected from collaboration room');
  }

  getCollabSession(): CollabSession {
    return this.session;
  }

  applyManifestPartial(partial: Partial<ProjectManifest>, label = 'Edit'): void {
    this.session.applyPartial(partial, label);
  }

  broadcastOperation(
    operation: string,
    elementId: string | undefined,
    elementType: OperationMessage['data']['elementType'],
    payload: unknown,
  ): void {
    if (!this.connected || !this.currentUserId) {
      console.warn('Not connected to collaboration room');
      return;
    }

    const message: OperationMessage = {
      type: 'operation',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { operation, elementId, elementType, payload },
    };

    this.broadcast(message);
  }

  broadcastCursor(
    x: number,
    y: number,
    tool?: string,
    viewport?: Presence['viewport'],
  ): void {
    if (!this.connected || !this.currentUserId) return;

    const message: CursorMessage = {
      type: 'cursor',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { x, y, tool, viewport },
    };

    const user = this.users.get(this.currentUserId);
    if (user) {
      user.cursor = { x, y };
      user.activeTool = tool;
      user.lastSeen = Date.now();
    }

    this.session.updatePresence({
      cursor: { x, y },
      activeTool: tool,
      viewport,
    });

    this.broadcast(message);
  }

  broadcastLock(
    elementId: string,
    elementType: LockMessage['data']['elementType'],
  ): void {
    if (!this.connected || !this.currentUserId) return;
    acquireElementLock(elementId, this.currentUserId, elementType);

    this.broadcast({
      type: 'lock',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { elementId, elementType },
    });
  }

  broadcastUnlock(
    elementId: string,
    elementType: LockMessage['data']['elementType'],
  ): void {
    if (!this.connected || !this.currentUserId) return;
    releaseElementLock(elementId, this.currentUserId);

    this.broadcast({
      type: 'unlock',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { elementId, elementType },
    });
  }

  broadcastChat(message: string, userName: string): void {
    if (!this.connected || !this.currentUserId) return;
    this.broadcast({
      type: 'chat',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { message, userName },
    });
  }

  subscribe(callback: CollaborationCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  isConnected(): boolean {
    return this.connected;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  private broadcast(message: CollaborationMessage): void {
    this.session.sendMessage(message);
    this.callbacks.forEach((callback) => callback(message));
  }

  private handleRemoteMessage(message: CollaborationMessage): void {
    if (message.userId === this.currentUserId) return;

    switch (message.type) {
      case 'cursor': {
        const cursorMessage = message as CursorMessage;
        const user = this.users.get(message.userId);
        if (user) {
          user.cursor = {
            x: cursorMessage.data.x,
            y: cursorMessage.data.y,
          };
          user.activeTool = cursorMessage.data.tool;
          user.lastSeen = Date.now();
        }
        break;
      }
      case 'lock': {
        const lockMessage = message as LockMessage;
        acquireElementLock(
          lockMessage.data.elementId,
          message.userId,
          lockMessage.data.elementType,
        );
        break;
      }
      case 'unlock': {
        const unlockMessage = message as LockMessage;
        releaseElementLock(unlockMessage.data.elementId, message.userId);
        break;
      }
      case 'presence': {
        const presenceMessage = message as PresenceMessage;
        if (presenceMessage.data.status === 'offline') {
          this.users.delete(message.userId);
        } else {
          this.users.set(message.userId, {
            id: message.userId,
            name: presenceMessage.data.name,
            color: presenceMessage.data.color,
            isOnline: true,
            lastSeen: Date.now(),
          });
        }
        break;
      }
      default:
        break;
    }

    this.callbacks.forEach((callback) => callback(message));
  }

  private syncUsersFromPresences(presences: Presence[], fallbackName: string) {
    const next = new Map<string, User>();
    for (const presence of presences) {
      next.set(presence.userId, {
        id: presence.userId,
        name: presence.userName || fallbackName,
        color: presence.color || this.generateUserColor(),
        cursor: presence.cursor,
        activeTool: presence.activeTool,
        focusedEntityId: presence.focusedEntityId,
        isOnline: true,
        lastSeen: presence.lastSeen ?? Date.now(),
      });
    }
    this.users = next;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (!this.currentUserId) return;
      const user = this.users.get(this.currentUserId);
      if (!user) return;
      user.lastSeen = Date.now();
      this.session.updatePresence({ lastSeen: user.lastSeen });
    }, 30_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private generateUserColor(): string {
    const colors = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#84cc16',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export const collaborationEngine = CollaborationEngine.getInstance();

export async function connectToRoom(
  roomId: string,
  userId: string,
  userName: string,
  options?: { initialManifest?: ProjectManifest; onManifestChange?: ManifestChangeHandler },
): Promise<CollaborationEngine> {
  const engine = CollaborationEngine.getInstance();
  await engine.connect(roomId, userId, userName, options);
  return engine;
}

export async function disconnectFromRoom(): Promise<void> {
  await CollaborationEngine.getInstance().disconnect();
}
