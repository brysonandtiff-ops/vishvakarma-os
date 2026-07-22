import type { CastBroadcastState, CastIntentEvent, CastPinEvent } from '@/cast/types';

const CHANNEL_NAME = 'vish-akasha-cast';

export type LocalCastMessage =
  | { type: 'broadcast'; state: CastBroadcastState }
  | { type: 'manifest'; projectId: string; manifest: unknown }
  | { type: 'intent'; sessionId: string; events: CastIntentEvent[] }
  | { type: 'pin'; sessionId: string; pin: CastPinEvent }
  | { type: 'viewer_join'; sessionId: string }
  | { type: 'session_end'; sessionId: string };

export class LocalCastBus {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<(message: LocalCastMessage) => void>();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<LocalCastMessage>) => {
        for (const listener of this.listeners) {
          listener(event.data);
        }
      };
    }
  }

  publish(message: LocalCastMessage): void {
    this.channel?.postMessage(message);
    for (const listener of this.listeners) {
      listener(message);
    }
  }

  subscribe(callback: (message: LocalCastMessage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  destroy(): void {
    this.channel?.close();
    this.channel = null;
    this.listeners.clear();
  }
}

let sharedBus: LocalCastBus | null = null;

export function getLocalCastBus(): LocalCastBus {
  if (!sharedBus) {
    sharedBus = new LocalCastBus();
  }
  return sharedBus;
}

export function resetLocalCastBus(): void {
  sharedBus?.destroy();
  sharedBus = null;
}

const LOCAL_SESSION_KEY = 'vish-akasha-cast-session';

export function storeLocalCastSession(payload: {
  sessionId: string;
  projectId: string;
  token: string;
}): void {
  try {
    sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function readLocalCastSession(): {
  sessionId: string;
  projectId: string;
  token: string;
} | null {
  try {
    const raw = sessionStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { sessionId: string; projectId: string; token: string };
  } catch {
    return null;
  }
}

export function clearLocalCastSession(): void {
  try {
    sessionStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function generateLocalCastToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
