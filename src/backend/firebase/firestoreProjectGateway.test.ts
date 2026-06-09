import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyProjectManifest, PROJECT_SPEC_VERSION } from '@/core/projectModel';
import type { ProjectManifest } from '@/types';
import * as firebaseAuthGateway from './firebaseAuthGateway';

vi.mock('@/backend/backendConfig', () => ({
  backendStatus: {
    provider: 'firebase',
    mode: 'connected',
    isConfigured: true,
    configurationError: null,
    missingKeys: [],
  },
}));

const sampleManifest: ProjectManifest = {
  ...createEmptyProjectManifest('Gateway Test'),
  walls: [
    {
      id: 'w1',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      thickness: 10,
      height: 240,
      material: 'material-paint',
    },
  ],
};

describe('firestoreProjectGateway', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'vishvakarma-test');
    vi.restoreAllMocks();
  });

  it('throws a readable error when Firebase session is missing', async () => {
    vi.spyOn(firebaseAuthGateway, 'resolveFirebaseSessionForFirestore').mockRejectedValue(
      new Error('Firebase session is missing. Sign in again before using Firestore.'),
    );
    const { createFirestoreProject } = await import('./firestoreProjectGateway');

    await expect(createFirestoreProject('Test', undefined, sampleManifest)).rejects.toThrow(
      /Firebase session is missing/,
    );
  });

  it('preserves manifest shape on create', async () => {
    vi.spyOn(firebaseAuthGateway, 'resolveFirebaseSessionForFirestore').mockResolvedValue({
      provider: 'firebase',
      idToken: 'test-firebase-token',
      uid: 'user-1',
      email: 'architect@example.com',
      refreshToken: 'refresh',
      expiresAt: Date.now() + 3600_000,
    });

    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            name: 'projects/vishvakarma-test/databases/(default)/documents/projects/project-1',
            createTime: '2026-05-31T00:00:00.000Z',
            updateTime: '2026-05-31T00:00:00.000Z',
            fields: {
              id: { stringValue: 'project-1' },
              name: { stringValue: 'Gateway Test' },
              manifest: {
                mapValue: {
                  fields: {
                    version: { stringValue: PROJECT_SPEC_VERSION },
                    name: { stringValue: 'Gateway Test' },
                    walls: {
                      arrayValue: {
                        values: [
                          {
                            mapValue: {
                              fields: {
                                id: { stringValue: 'w1' },
                                thickness: { integerValue: '10' },
                                height: { integerValue: '240' },
                                material: { stringValue: 'material-paint' },
                                start: {
                                  mapValue: {
                                    fields: {
                                      x: { integerValue: '0' },
                                      y: { integerValue: '0' },
                                    },
                                  },
                                },
                                end: {
                                  mapValue: {
                                    fields: {
                                      x: { integerValue: '100' },
                                      y: { integerValue: '0' },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                    openings: { arrayValue: { values: [] } },
                    materials: { arrayValue: { values: [] } },
                    floorMaterial: { stringValue: 'material-concrete' },
                    gridSize: { integerValue: '20' },
                    snapToGrid: { booleanValue: true },
                    lighting: {
                      mapValue: {
                        fields: {
                          sunAzimuth: { integerValue: '180' },
                          sunElevation: { integerValue: '45' },
                          timeOfDay: { integerValue: '12' },
                          intensity: { doubleValue: 1 },
                        },
                      },
                    },
                    metadata: {
                      mapValue: {
                        fields: {
                          created: { stringValue: '2026-05-31T00:00:00.000Z' },
                          modified: { stringValue: '2026-05-31T00:00:00.000Z' },
                        },
                      },
                    },
                  },
                },
              },
              created_at: { stringValue: '2026-05-31T00:00:00.000Z' },
              updated_at: { stringValue: '2026-05-31T00:00:00.000Z' },
            },
          }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ documents: [] }), { status: 200 });
    });

    vi.stubGlobal('fetch', fetchMock);

    const { createFirestoreProject } = await import('./firestoreProjectGateway');
    const project = await createFirestoreProject('Gateway Test', undefined, sampleManifest);

    expect(project.name).toBe('Gateway Test');
    expect(project.manifest.version).toBe(PROJECT_SPEC_VERSION);
    expect(project.manifest.walls).toHaveLength(1);
    expect(project.manifest.walls[0].id).toBe('w1');
  });
});
