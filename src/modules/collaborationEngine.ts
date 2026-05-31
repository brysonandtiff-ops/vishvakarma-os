/**
 * Collaboration Engine Module
 *
 * In-process collaboration delivery for local and connected sessions.
 * Remote realtime transport is deferred until a Firebase-backed channel is added.
 */

import { backendStatus } from '@/backend/backendConfig';

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  activeTool?: string;
  isOnline: boolean;
  lastSeen: number;
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
    elementType?: 'wall' | 'opening';
    payload: unknown;
  };
}

export interface CursorMessage extends CollaborationMessage {
  type: 'cursor';
  data: {
    x: number;
    y: number;
    tool?: string;
  };
}

export interface LockMessage extends CollaborationMessage {
  type: 'lock' | 'unlock';
  data: {
    elementId: string;
    elementType: 'wall' | 'opening';
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

/**
 * Collaboration Engine Class
 */
export class CollaborationEngine {
  private static instance: CollaborationEngine | null = null;
  private users: Map<string, User> = new Map();
  private currentUserId: string | null = null;
  private callbacks: Set<CollaborationCallback> = new Set();
  private connected = false;
  private roomId: string | null = null;
  private heartbeatInterval: number | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CollaborationEngine {
    if (!this.instance) {
      this.instance = new CollaborationEngine();
    }
    return this.instance;
  }

  /**
   * Connect to collaboration room
   */
  async connect(roomId: string, userId: string, userName: string): Promise<void> {
    if (this.connected) {
      console.warn('Already connected to collaboration room');
      return;
    }

    this.roomId = roomId;
    this.currentUserId = userId;
    this.connected = true;

    // Generate random color for user
    const color = this.generateUserColor();

    // Add current user
    this.users.set(userId, {
      id: userId,
      name: userName,
      color,
      isOnline: true,
      lastSeen: Date.now(),
    });

    // Send presence message
    this.broadcastPresence('online', userName, color);

    if (!backendStatus.isConfigured) {
      console.warn('[Collaboration] Backend not configured — using local session delivery only.');
    }

    // Start heartbeat
    this.startHeartbeat();

    console.log(`Connected to room ${roomId} as ${userName}`);
  }

  /**
   * Disconnect from collaboration room
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    // Send offline presence
    if (this.currentUserId) {
      const user = this.users.get(this.currentUserId);
      if (user) {
        this.broadcastPresence('offline', user.name, user.color);
      }
    }

    // Stop heartbeat
    this.stopHeartbeat();

    // Clear state
    this.connected = false;
    this.roomId = null;
    this.currentUserId = null;
    this.users.clear();

    console.log('Disconnected from collaboration room');
  }

  /**
   * Broadcast operation to other users
   */
  broadcastOperation(
    operation: string,
    elementId: string | undefined,
    elementType: 'wall' | 'opening' | undefined,
    payload: unknown
  ): void {
    if (!this.connected || !this.currentUserId) {
      console.warn('Not connected to collaboration room');
      return;
    }

    const message: OperationMessage = {
      type: 'operation',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: {
        operation,
        elementId,
        elementType,
        payload,
      },
    };

    this.broadcast(message);
  }

  /**
   * Broadcast cursor position
   */
  broadcastCursor(x: number, y: number, tool?: string): void {
    if (!this.connected || !this.currentUserId) {
      return;
    }

    const message: CursorMessage = {
      type: 'cursor',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { x, y, tool },
    };

    // Update local user cursor
    const user = this.users.get(this.currentUserId);
    if (user) {
      user.cursor = { x, y };
      user.activeTool = tool;
    }

    this.broadcast(message);
  }

  /**
   * Broadcast lock acquisition
   */
  broadcastLock(elementId: string, elementType: 'wall' | 'opening'): void {
    if (!this.connected || !this.currentUserId) {
      return;
    }

    const message: LockMessage = {
      type: 'lock',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { elementId, elementType },
    };

    this.broadcast(message);
  }

  /**
   * Broadcast lock release
   */
  broadcastUnlock(elementId: string, elementType: 'wall' | 'opening'): void {
    if (!this.connected || !this.currentUserId) {
      return;
    }

    const message: LockMessage = {
      type: 'unlock',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { elementId, elementType },
    };

    this.broadcast(message);
  }

  /**
   * Broadcast chat message
   */
  broadcastChat(message: string): void {
    if (!this.connected || !this.currentUserId) {
      return;
    }

    const user = this.users.get(this.currentUserId);
    if (!user) return;

    const chatMessage: ChatMessage = {
      type: 'chat',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: {
        message,
        userName: user.name,
      },
    };

    this.broadcast(chatMessage);
  }

  /**
   * Subscribe to collaboration messages
   */
  subscribe(callback: CollaborationCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): User[] {
    return Array.from(this.users.values()).filter(u => u.isOnline);
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get room ID
   */
  getRoomId(): string | null {
    return this.roomId;
  }

  /**
   * Broadcast presence message
   */
  private broadcastPresence(
    status: 'online' | 'offline',
    name: string,
    color: string
  ): void {
    if (!this.currentUserId) return;

    const message: PresenceMessage = {
      type: 'presence',
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { status, name, color },
    };

    this.broadcast(message);
  }

  /**
   * Broadcast message to subscribers and remote peers
   */
  private broadcast(message: CollaborationMessage): void {
    this.deliverToCallbacks(message);
  }

  private handleRemoteMessage(message: CollaborationMessage): void {
    if (message.userId === this.currentUserId) {
      return;
    }

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
    }

    this.deliverToCallbacks(message);
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

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.currentUserId) {
        const user = this.users.get(this.currentUserId);
        if (user) {
          user.lastSeen = Date.now();
        }
      }

      // Check for stale users (offline for > 30 seconds)
      const now = Date.now();
      this.users.forEach(user => {
        if (user.isOnline && now - user.lastSeen > 30000) {
          user.isOnline = false;
        }
      });
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Generate random color for user
   */
  private generateUserColor(): string {
    const colors = [
      '#ef4444', // red
      '#f59e0b', // amber
      '#10b981', // emerald
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#84cc16', // lime
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Simulate receiving a message (for testing)
   */
  simulateMessage(message: CollaborationMessage): void {
    this.handleRemoteMessage(message);
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }
  }
}

/**
 * Convenience functions
 */
export function getCollaborationEngine(): CollaborationEngine {
  return CollaborationEngine.getInstance();
}

export async function connectToRoom(
  roomId: string,
  userId: string,
  userName: string
): Promise<void> {
  const engine = getCollaborationEngine();
  await engine.connect(roomId, userId, userName);
}

export async function disconnectFromRoom(): Promise<void> {
  const engine = getCollaborationEngine();
  await engine.disconnect();
}

export function broadcastOperation(
  operation: string,
  elementId?: string,
  elementType?: 'wall' | 'opening',
  payload?: unknown
): void {
  const engine = getCollaborationEngine();
  engine.broadcastOperation(operation, elementId, elementType, payload);
}

export function broadcastCursor(x: number, y: number, tool?: string): void {
  const engine = getCollaborationEngine();
  engine.broadcastCursor(x, y, tool);
}
