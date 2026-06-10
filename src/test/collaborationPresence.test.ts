import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CollabSession } from '@/collaboration/sync/CollabSession';
import { DEFAULT_PRESENCE_VIEWPORT } from '@/collaboration/types';

describe('CollabSession presence', () => {
  beforeEach(() => {
    CollabSession.resetInstance();
  });

  afterEach(async () => {
    await CollabSession.getInstance().disconnect();
    CollabSession.resetInstance();
  });

  it('connects locally without websocket URL', async () => {
    const session = CollabSession.getInstance();
    await session.connect({
      wsUrl: 'ws://127.0.0.1:1234',
      projectId: 'project-1',
      userId: 'user-1',
      userName: 'Alice',
      getIdToken: async () => 'test-token',
    });

    expect(session.isConnected()).toBe(true);
    expect(session.getBridge()).toBeTruthy();
    expect(session.getPresences()).toEqual([]);
  });

  it('tracks awareness updates through transport adapter', async () => {
    const session = CollabSession.getInstance();
    await session.connect({
      wsUrl: 'ws://127.0.0.1:1234',
      projectId: 'project-1',
      userId: 'user-1',
      userName: 'Alice',
      getIdToken: async () => 'test-token',
    });

    session.updatePresence({
      userId: 'user-1',
      name: 'Alice',
      color: '#3b82f6',
      cursor: { x: 12, y: 34 },
      viewport: DEFAULT_PRESENCE_VIEWPORT,
      lastSeen: Date.now(),
    });

    expect(session.isConnected()).toBe(true);
  });
});
