import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CastSessionManager } from '@/cast/CastSessionManager';
import { resetLocalCastBus } from '@/cast/LocalCastBus';
import { CollabSession } from '@/collaboration/sync/CollabSession';
import type { Presence } from '@/collaboration/types';
import { createProjectManifest } from '@/core/projectModel';
import { CollaborationEngine } from '@/modules/collaborationEngine';
import type { ProjectManifest, Wall } from '@/types';

const remote = vi.hoisted(() => ({ client: null as unknown }));

vi.mock('@/backend/backendConfig', () => ({ backendStatus: { isConfigured: true } }));
vi.mock('@/backend/supabase/supabaseClient', () => ({ getSupabaseClient: () => remote.client }));
vi.mock('@/backend/supabase/supabaseAccessToken', () => ({
  getSupabaseAccessToken: async () => 'presenter-token',
}));
vi.mock('@/backend/supabase/supabaseProjectGateway', () => ({
  getSupabaseProject: async () => null,
  updateSupabaseProject: async () => undefined,
}));

// Fake only the network channel; the session, provider, CRDT bridge and cast
// manager keep their real lifecycle and manifest/presence delivery behavior.
function createChannel() {
  const handlers = new Map<string, (event: unknown) => void>();
  const channel = {
    presence: null as Presence | null,
    remotePresences: [] as Presence[],
    removed: false,
    on(type: string, filter: { event: string }, callback: (event: unknown) => void) {
      handlers.set(`${type}:${filter.event}`, callback);
      return channel;
    },
    subscribe(callback: (status: string) => void) {
      callback('SUBSCRIBED');
      return channel;
    },
    async track(presence: Presence) {
      channel.presence = structuredClone(presence);
      handlers.get('presence:sync')?.({});
    },
    presenceState() {
      return {
        users: [...(channel.presence ? [channel.presence] : []), ...channel.remotePresences],
      };
    },
    async send(_message: unknown) {},
    receivePresence(presence: Presence) {
      channel.remotePresences = [presence];
      handlers.get('presence:sync')?.({});
    },
  };
  return channel;
}

const wall = (endX: number): Wall => ({
  id: 'wall-1',
  start: { x: 0, y: 0 },
  end: { x: endX, y: 0 },
  thickness: 10,
  material: 'material-brick',
});

const manifest = () => createProjectManifest({ name: 'Shared project', walls: [wall(100)] });

describe('Cast and editor collaboration ownership', () => {
  let cast: CastSessionManager;
  let editor: CollaborationEngine;
  let session: CollabSession;
  let channels: ReturnType<typeof createChannel>[];

  beforeEach(() => {
    vi.stubEnv('VITE_COLLAB_WRITE', '');
    vi.stubEnv('VITE_CAST_LOCAL_ONLY', '');
    channels = [];
    remote.client = {
      channel: () => {
        const channel = createChannel();
        channels.push(channel);
        return channel;
      },
      removeChannel: async (channel: ReturnType<typeof createChannel>) => {
        channel.removed = true;
      },
    };
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      session: {
        id: 'cast-1',
        project_id: 'project-a',
        host_user_id: 'architect',
        status: 'live',
      },
      token: 'viewer-token',
      shareUrl: 'https://example.test/cast/viewer-token',
    }), { status: 200 })));
    session = CollabSession.getInstance();
    editor = CollaborationEngine.getInstance();
    cast = CastSessionManager.getInstance();
  });

  afterEach(async () => {
    await cast.stop();
    await editor.disconnect();
    await session.disconnect();
    CastSessionManager.resetInstance();
    CollaborationEngine.resetInstance();
    resetLocalCastBus();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  async function startCast(onManifestChange?: (next: ProjectManifest, isRemote: boolean) => void) {
    return cast.startPresenter({
      projectId: 'project-a',
      userId: 'architect',
      userName: 'Architect',
      manifest: session.toManifest() ?? manifest(),
      getIdToken: async () => 'presenter-token',
      onManifestChange,
    });
  }

  it('delivers editor changes to both observers and relays intents on successive borrowed casts', async () => {
    const editorChanges: ProjectManifest[] = [];
    const firstCastChanges: ProjectManifest[] = [];
    await editor.connect('project-a', 'architect', 'Architect', {
      initialManifest: manifest(),
      onManifestChange: (next) => editorChanges.push(next),
    });
    const bridge = session.getBridge()!;

    await startCast((next) => firstCastChanges.push(next));
    bridge.applyPartial({ walls: [wall(120)] });

    expect(editorChanges.at(-1)?.walls[0].end.x).toBe(120);
    expect(firstCastChanges.at(-1)?.walls[0].end.x).toBe(120);
    expect(cast.getIntents().some((intent) => intent.type === 'walls')).toBe(true);

    await cast.stop();
    const deliveredBeforeStop = firstCastChanges.length;
    await startCast();
    bridge.applyPartial({ walls: [wall(140)] });

    expect(editorChanges.at(-1)?.walls[0].end.x).toBe(140);
    expect(firstCastChanges).toHaveLength(deliveredBeforeStop);
    expect(cast.getIntents().some((intent) => intent.type === 'walls')).toBe(true);
  });

  it('releases only the cast attachment, restoring presence and retaining editor sync and read-only policy', async () => {
    const editorChanges: ProjectManifest[] = [];
    const castChanges: ProjectManifest[] = [];
    await editor.connect('project-a', 'architect', 'Architect', {
      initialManifest: manifest(),
      onManifestChange: (next) => editorChanges.push(next),
    });
    const bridge = session.getBridge()!;
    expect(channels[0].presence?.castRole).toBe('viewer');

    await startCast((next) => castChanges.push(next));
    expect(channels[0].presence?.castRole).toBe('presenter');

    await cast.stop();
    await cast.stop();

    expect(editor.isConnected()).toBe(true);
    expect(session.isConnected()).toBe(true);
    expect(session.getBridge()).toBe(bridge);
    expect(bridge.isActive()).toBe(true);
    expect(channels).toHaveLength(1);
    expect(channels[0].removed).toBe(false);
    expect(channels[0].presence?.castRole).toBe('viewer');
    expect(channels[0].presence?.followPresenter).toBe(true);

    bridge.applyPartial({ name: 'Edited after cast' });
    expect(editorChanges.at(-1)?.name).toBe('Edited after cast');
    expect(castChanges).toHaveLength(0);
    session.applyPartial({ name: 'Disallowed co-edit' });
    expect(session.toManifest()?.name).toBe('Edited after cast');

    channels[0].receivePresence({
      userId: 'reviewer', name: 'Reviewer', color: '#123456',
      cursor: { x: 2, y: 3 }, viewport: { position: [0, 10, 10], target: [0, 0, 0], zoom: 1 },
      lastSeen: Date.now(), castRole: 'viewer',
    });
    expect(editor.getOnlineUsers().some((user) => user.id === 'reviewer')).toBe(true);
  });

  it.each([
    ['another project', 'project-b', 'architect'],
    ['another user', 'project-a', 'someone-else'],
  ])('refuses to borrow collaboration belonging to %s', async (_label, projectId, userId) => {
    await editor.connect('project-a', 'architect', 'Architect', { initialManifest: manifest() });
    const bridge = session.getBridge();

    await expect(cast.startPresenter({
      projectId, userId, userName: 'Architect', manifest: manifest(),
      getIdToken: async () => 'presenter-token',
    })).rejects.toThrow(/another project or user/i);

    expect(cast.isLive()).toBe(false);
    expect(session.getBridge()).toBe(bridge);
    expect(session.isConnected()).toBe(true);
    expect(channels[0].removed).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('disconnects a standalone collaboration session that the cast owns', async () => {
    await startCast();
    const bridge = session.getBridge()!;
    expect(session.isConnected()).toBe(true);

    await cast.stop();

    expect(session.isConnected()).toBe(false);
    expect(session.getBridge()).toBeNull();
    expect(bridge.isActive()).toBe(false);
    expect(channels[0].removed).toBe(true);
  });

  it.each(['project-a', 'project-b'])('cleans up a pending cast if editor collaboration is replaced by %s', async (nextProjectId) => {
    await editor.connect('project-a', 'architect', 'Architect', { initialManifest: manifest() });
    let completeCreate!: (response: Response) => void;
    const pendingCreate = new Promise<Response>((resolve) => { completeCreate = resolve; });
    vi.mocked(fetch).mockImplementationOnce(() => pendingCreate);

    const starting = startCast();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await editor.disconnect();
    await editor.connect(nextProjectId, 'architect', 'Architect', { initialManifest: manifest() });
    const replacementBridge = session.getBridge();
    completeCreate(new Response(JSON.stringify({
      session: { id: 'pending-cast', project_id: 'project-a', host_user_id: 'architect', status: 'live' },
      token: 'pending-token', shareUrl: 'https://example.test/cast/pending-token',
    }), { status: 200 }));

    await expect(starting).rejects.toThrow(/collaboration changed while starting/i);

    expect(cast.isLive()).toBe(false);
    expect(cast.getShareUrl()).toBeNull();
    expect(session.isConnected()).toBe(true);
    expect(session.getBridge()).toBe(replacementBridge);
    expect(replacementBridge?.isActive()).toBe(true);
    expect(channels[1].removed).toBe(false);
    expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({
      method: 'DELETE', body: JSON.stringify({ sessionId: 'pending-cast' }),
    }));
  });

  it('invalidates a borrowed cast when its editor disconnects so a new project cannot relay into it', async () => {
    const castChanges: ProjectManifest[] = [];
    await editor.connect('project-a', 'architect', 'Architect', { initialManifest: manifest() });
    await startCast((next) => castChanges.push(next));

    await editor.disconnect();
    await vi.waitFor(() => expect(cast.isLive()).toBe(false));
    await editor.connect('project-b', 'architect', 'Architect', { initialManifest: manifest() });
    session.getBridge()!.applyPartial({ walls: [wall(160)] });

    expect(castChanges).toHaveLength(0);
    expect(cast.getIntents()).toHaveLength(0);
    expect(channels[1].presence?.castRole).toBe('viewer');
  });
});
