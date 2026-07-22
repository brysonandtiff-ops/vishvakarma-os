/**
 * Collaboration Engine Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  CollaborationEngine,
  getCollaborationEngine,
  connectToRoom,
  disconnectFromRoom,
  type CollaborationMessage,
  type OperationMessage,
  type CursorMessage,
} from '@/modules/collaborationEngine';

describe('CollaborationEngine', () => {
  let engine: CollaborationEngine;

  beforeEach(() => {
    CollaborationEngine.resetInstance();
    engine = getCollaborationEngine();
  });

  afterEach(async () => {
    await engine.disconnect();
    CollaborationEngine.resetInstance();
  });

  describe('Connection Management', () => {
    it('should connect to room', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      expect(engine.isConnected()).toBe(true);
      expect(engine.getRoomId()).toBe('room-1');
      expect(engine.getCurrentUserId()).toBe('user-1');
    });

    it('should disconnect from room', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');
      await engine.disconnect();

      expect(engine.isConnected()).toBe(false);
      expect(engine.getRoomId()).toBe(null);
      expect(engine.getCurrentUserId()).toBe(null);
    });

    it('should not connect if already connected', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');
      await engine.connect('room-2', 'user-2', 'Bob');

      expect(engine.getRoomId()).toBe('room-1');
      expect(engine.getCurrentUserId()).toBe('user-1');
    });
  });

  describe('User Management', () => {
    it('should add current user on connect', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      const users = engine.getOnlineUsers();
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe('user-1');
      expect(users[0].name).toBe('Alice');
      expect(users[0].isOnline).toBe(true);
    });

    it('should get user by ID', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      const user = engine.getUser('user-1');
      expect(user).toBeTruthy();
      expect(user?.name).toBe('Alice');
    });

    it('should return undefined for non-existent user', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      const user = engine.getUser('user-999');
      expect(user).toBeUndefined();
    });
  });

  describe('Message Broadcasting', () => {
    it('should broadcast operation', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      const messages: CollaborationMessage[] = [];
      engine.subscribe(msg => messages.push(msg));

      engine.broadcastOperation('add-wall', 'wall-1', 'wall', { x: 0, y: 0 });

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('operation');

      const opMsg = messages[0] as OperationMessage;
      expect(opMsg.data.operation).toBe('add-wall');
      expect(opMsg.data.elementId).toBe('wall-1');
      expect(opMsg.data.elementType).toBe('wall');
    });

    it('should broadcast cursor position', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      const messages: CollaborationMessage[] = [];
      engine.subscribe(msg => messages.push(msg));

      engine.broadcastCursor(100, 200, 'wall-tool');

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('cursor');

      const cursorMsg = messages[0] as CursorMessage;
      expect(cursorMsg.data.x).toBe(100);
      expect(cursorMsg.data.y).toBe(200);
      expect(cursorMsg.data.tool).toBe('wall-tool');
    });

    it('should broadcast lock acquisition', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      const messages: CollaborationMessage[] = [];
      engine.subscribe(msg => messages.push(msg));

      engine.broadcastLock('wall-1', 'wall');

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('lock');
    });

    it('should broadcast lock release', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      const messages: CollaborationMessage[] = [];
      engine.subscribe(msg => messages.push(msg));

      engine.broadcastUnlock('wall-1', 'wall');

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('unlock');
    });

    it('should broadcast chat message', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      const messages: CollaborationMessage[] = [];
      engine.subscribe(msg => messages.push(msg));

      engine.broadcastChat('Hello, world!');

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('chat');
    });

    it('should not broadcast when not connected', () => {
      const messages: CollaborationMessage[] = [];
      engine.subscribe(msg => messages.push(msg));

      engine.broadcastOperation('add-wall', 'wall-1', 'wall', {});

      expect(messages).toHaveLength(0);
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe to messages', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      let messageCount = 0;
      engine.subscribe(() => messageCount++);

      engine.broadcastOperation('add-wall', 'wall-1', 'wall', {});

      expect(messageCount).toBe(1);
    });

    it('should unsubscribe from messages', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      let messageCount = 0;
      const unsubscribe = engine.subscribe(() => messageCount++);

      engine.broadcastOperation('add-wall', 'wall-1', 'wall', {});
      expect(messageCount).toBe(1);

      unsubscribe();

      engine.broadcastOperation('add-wall', 'wall-2', 'wall', {});
      expect(messageCount).toBe(1); // Should not increment
    });

    it('should handle multiple subscribers', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      let count1 = 0;
      let count2 = 0;

      engine.subscribe(() => count1++);
      engine.subscribe(() => count2++);

      engine.broadcastOperation('add-wall', 'wall-1', 'wall', {});

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe('Simulated Messages', () => {
    it('should handle simulated presence message', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      engine.simulateMessage({
        type: 'presence',
        userId: 'user-2',
        timestamp: Date.now(),
        data: {
          status: 'online',
          name: 'Bob',
          color: '#ef4444',
        },
      });

      const users = engine.getOnlineUsers();
      expect(users).toHaveLength(2);
      expect(users.find(u => u.id === 'user-2')).toBeTruthy();
    });

    it('should handle simulated cursor message', async () => {
      await engine.connect('room-1', 'user-1', 'Alice');

      // Add another user first
      engine.simulateMessage({
        type: 'presence',
        userId: 'user-2',
        timestamp: Date.now(),
        data: {
          status: 'online',
          name: 'Bob',
          color: '#ef4444',
        },
      });

      // Simulate cursor update
      engine.simulateMessage({
        type: 'cursor',
        userId: 'user-2',
        timestamp: Date.now(),
        data: {
          x: 100,
          y: 200,
          tool: 'wall-tool',
        },
      });

      const user = engine.getUser('user-2');
      expect(user?.cursor).toEqual({ x: 100, y: 200 });
      expect(user?.activeTool).toBe('wall-tool');
    });
  });

  describe('Convenience Functions', () => {
    it('should connect using convenience function', async () => {
      await connectToRoom('room-1', 'user-1', 'Alice');

      const engine = getCollaborationEngine();
      expect(engine.isConnected()).toBe(true);
    });

    it('should disconnect using convenience function', async () => {
      await connectToRoom('room-1', 'user-1', 'Alice');
      await disconnectFromRoom();

      const engine = getCollaborationEngine();
      expect(engine.isConnected()).toBe(false);
    });
  });
});
