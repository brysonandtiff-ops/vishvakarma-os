import type { CollaborationMessage } from '@/modules/collaborationEngine';
import type { Presence } from '@/collaboration/types';

export interface CollabTransportAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  broadcast(message: CollaborationMessage): void;
  subscribe(callback: (message: CollaborationMessage) => void): () => void;
  updatePresence(presence: Partial<Presence>): void;
  getPresences(): Presence[];
}

export class LocalCollabTransportAdapter implements CollabTransportAdapter {
  private connected = false;
  private callbacks = new Set<(message: CollaborationMessage) => void>();
  private presences: Presence[] = [];

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.callbacks.clear();
    this.presences = [];
  }

  isConnected(): boolean {
    return this.connected;
  }

  broadcast(message: CollaborationMessage): void {
    if (!this.connected) return;
    for (const callback of this.callbacks) {
      callback(message);
    }
  }

  subscribe(callback: (message: CollaborationMessage) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  updatePresence(_presence: Partial<Presence>): void {
    // Local-only transport has no remote awareness channel.
  }

  getPresences(): Presence[] {
    return this.presences;
  }
}
