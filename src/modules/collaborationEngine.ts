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

    try {
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
    } catch (error) {
      this.connected = false;
      this.roomId = null;
      this.currentUserId = null;
      this.users.clear();
      this.manifestHandler = null;
      throw error;
    }

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
      userId: this.currentUserId,
      name: user?.name ?? 'Architect',
      color: user?.color ?? this.userColor,
      cursor: { x, y },
      activeTool: tool,
      ...(viewport ? { viewport } : {}),
      lastSeen: Date.now(),
    });

    this.broadcast(message);
  }

  broadcastLock(
    elementId: string,
    elementType: LockMessage['data']['elementType'],
  ): void {
    if (!this.connected || !this.currentUserId) return;

    const message: LockMessage = {
      type: 'lock',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { elementId, elementType },
    };

    this.session.updatePresence({ focusedEntityId: elementId });
    this.broadcast(message);
  }

  broadcastUnlock(
    elementId: string,
    elementType: LockMessage['data']['elementType'],
  ): void {
    if (!this.connected || !this.currentUserId) return;

    const message: LockMessage = {
      type: 'unlock',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { elementId, elementType },
    };

    this.session.updatePresence({ focusedEntityId: undefined });
    this.broadcast(message);
  }

  broadcastChat(message: string): void {
    if (!this.connected || !this.currentUserId) return;

    const user = this.users.get(this.currentUserId);
    if (!user) return;

    const chatMessage: ChatMessage = {
      type: 'chat',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { message, userName: user.name },
    };

    this.broadcast(chatMessage);
  }

  subscribe(callback: CollaborationCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  getOnlineUsers(): User[] {
    return Array.from(this.users.values()).filter((user) => user.isOnline);
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  private broadcastPresence(status: 'online' | 'offline', name: string, color: string): void {
    if (!this.currentUserId) return;

    const message: PresenceMessage = {
      type: 'presence',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { status, name, color },
    };

    this.broadcast(message);
  }

  private broadcast(message: CollaborationMessage): void {
    this.session.broadcast(message);
    this.deliverToCallbacks(message);
  }

  private handleRemoteMessage(message: CollaborationMessage): void {
    if (message.userId === this.currentUserId) return;

    if (message.type === 'presence') {
      const presenceData = (message as PresenceMessage).data;
      const user = this.users.get(message.userId);

      if (user) {
        user.isOnline = presenceData.status === 'online';
        user.lastSeen = Date.now();
      } else if (presenceData.status === 'online') {
        this.users.set(message.userId, {
          id: message.userId,
          name: presenceData.name,
          color: presenceData.color,
          isOnline: true,
          lastSeen: Date.now(),
        });
      }
    } else if (message.type === 'cursor') {
      const cursorData = (message as CursorMessage).data;
      const user = this.users.get(message.userId);

      if (user) {
        user.cursor = { x: cursorData.x, y: cursorData.y };
        user.activeTool = cursorData.tool;
        user.lastSeen = Date.now();
      }
    } else if (message.type === 'lock') {
      const lockData = (message as LockMessage).data;
      const user = this.users.get(message.userId);
      if (user) {
        acquireElementLock(lockData.elementId, lockData.elementType, message.userId, user.name);
      }
    } else if (message.type === 'unlock') {
      const lockData = (message as LockMessage).data;
      releaseElementLock(lockData.elementId, lockData.elementType, message.userId);
    }

    this.deliverToCallbacks(message);
  }

  private syncUsersFromPresences(presences: Presence[], localName: string): void {
    const remoteIds = new Set(presences.map((presence) => presence.userId));

    for (const presence of presences) {
      const existing = this.users.get(presence.userId);
      this.users.set(presence.userId, {
        id: presence.userId,
        name: presence.name,
        color: presence.color,
        cursor: presence.cursor,
        activeTool: presence.activeTool,
        isOnline: true,
        lastSeen: presence.lastSeen,
        focusedEntityId: presence.focusedEntityId,
      });

      if (presence.focusedEntityId) {
        let type: LockMessage['data']['elementType'] = 'wall';
        if (
          presence.focusedEntityId.startsWith('door') ||
          presence.focusedEntityId.startsWith('window') ||
          presence.focusedEntityId.startsWith('opening')
        ) {
          type = 'opening';
        } else if (
          presence.focusedEntityId.startsWith('furniture') ||
          presence.focusedEntityId.startsWith('column') ||
          presence.focusedEntityId.startsWith('stair')
        ) {
          type = 'annotation';
        }
        acquireElementLock(presence.focusedEntityId, type, presence.userId, presence.name);
      }

      if (!existing) {
        this.deliverToCallbacks({
          type: 'presence',
          userId: presence.userId,
          timestamp: Date.now(),
          data: { status: 'online', name: presence.name, color: presence.color },
        });
      }
    }

    if (this.currentUserId) {
      const local = this.users.get(this.currentUserId);
      if (local) {
        local.isOnline = true;
        local.name = localName;
      }
    }

    for (const [id, user] of this.users.entries()) {
      if (id !== this.currentUserId && !remoteIds.has(id)) {
        user.isOnline = false;
        if (user.focusedEntityId) {
          releaseElementLock(user.focusedEntityId, 'wall', id);
          releaseElementLock(user.focusedEntityId, 'opening', id);
          releaseElementLock(user.focusedEntityId, 'annotation', id);
        }
      }
    }
  }

  private deliverToCallbacks(message: CollaborationMessage): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in collaboration callback:', error);
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.currentUserId) {
        const user = this.users.get(this.currentUserId);
        if (user) {
          user.lastSeen = Date.now();
        }
        this.session.updatePresence({ lastSeen: Date.now() });
      }

      const now = Date.now();
      this.users.forEach((user) => {
        if (user.isOnline && now - user.lastSeen > 30_000) {
          user.isOnline = false;
        }
      });
    }, 5_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private generateUserColor(): string {
    const colors = [
      '#ef4444',
      '#f59e0b',
      '#10b981',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#84cc16',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  simulateMessage(message: CollaborationMessage): void {
    this.handleRemoteMessage(message);
  }

  static resetInstance(): void {
    if (this.instance) {
      void this.instance.disconnect();
      CollabSession.resetInstance();
      this.instance = null;
    }
  }
}

export function getCollaborationEngine(): CollaborationEngine {
  return CollaborationEngine.getInstance();
}

export async function connectToRoom(
  roomId: string,
  userId: string,
  userName: string,
  options?: { initialManifest?: ProjectManifest; onManifestChange?: ManifestChangeHandler },
): Promise<void> {
  const engine = getCollaborationEngine();
  await engine.connect(roomId, userId, userName, options);
}

export async function disconnectFromRoom(): Promise<void> {
  const engine = getCollaborationEngine();
  await engine.disconnect();
}

export function broadcastOperation(
  operation: string,
  elementId?: string,
  elementType?: OperationMessage['data']['elementType'],
  payload?: unknown,
): void {
  const engine = getCollaborationEngine();
  engine.broadcastOperation(operation, elementId, elementType, payload);
}

export function broadcastCursor(
  x: number,
  y: number,
  tool?: string,
  viewport?: Presence['viewport'],
): void {
  const engine = getCollaborationEngine();
  engine.broadcastCursor(x, y, tool, viewport);
}
