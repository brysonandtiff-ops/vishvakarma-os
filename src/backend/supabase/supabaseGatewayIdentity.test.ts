import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { createProjectManifest } from '@/core/projectModel';
import { DEFAULT_BUILDING_REQUEST } from '@/domain/buildings/buildingRequest';
import type { OptimizationBatch } from '@/domain/optimization/types';
import { readSupabaseSessionSnapshot } from '@/backend/supabase/supabaseAuthGateway';
import {
  createSupabaseProject,
  getSupabaseProjects,
} from '@/backend/supabase/supabaseProjectGateway';
import { createSupabaseOptimizationBatch } from '@/backend/supabase/supabaseOptimizationGateway';
import {
  isStorageConfigured,
  uploadMaterialTexture,
} from '@/backend/supabase/supabaseStorageGateway';

const sdk = vi.hoisted(() => ({
  configured: true,
  getUser: vi.fn(),
  rows: {} as Record<string, Record<string, unknown>[]>,
  queries: [] as string[],
  uploads: [] as Array<{ bucket: string; path: string; file: File }>,
}));

vi.mock('@/backend/supabase/supabaseClient', () => ({
  getSupabaseClient: () => sdk.configured ? {
    auth: { getUser: sdk.getUser },
    from: (table: string) => {
      sdk.queries.push(table);
      return {
        insert: (value: Record<string, unknown>) => {
          const row = { id: 'created-project', ...value };
          (sdk.rows[table] ??= []).push(row);
          return {
            error: null,
            select: () => ({ single: async () => ({ data: row, error: null }) }),
          };
        },
        select: () => ({
          order: async () => ({ data: sdk.rows[table] ?? [], error: null }),
        }),
      };
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File) => {
          sdk.uploads.push({ bucket, path, file });
          return { error: null };
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://storage.invalid/${bucket}/${path}` },
        }),
      }),
    },
  } : null,
}));

function approvedUser(id = 'sdk-user'): User {
  return {
    id,
    email: 'architect@firm.com',
    app_metadata: { provider: 'google', providers: ['google'] },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-11-13T00:00:00.000Z',
    is_anonymous: false,
  };
}

function optimizationBatch(): OptimizationBatch {
  return {
    id: 'batch-1',
    input: { prompt: 'A compact home', sessionId: 'batch-1' },
    resolvedRequest: DEFAULT_BUILDING_REQUEST,
    siteFitness: {
      overall: 80, solarOrientation: 80, slopeSuitability: 80,
      accessEfficiency: 80, setbackUtilization: 80, openSpaceQuality: 80,
      explanations: [],
    },
    candidates: [],
    winnerId: 'winner',
    runnerUpId: 'runner-up',
    report: {
      winnerId: 'winner', runnerUpId: 'runner-up',
      winnerLabel: 'Winner', runnerUpLabel: 'Runner-up',
      tradeoffs: [], riskAreas: [], estimatedCost: 400_000,
      complianceConfidence: 90, approvalConfidence: 90, permitReady: true,
      moatGain: {
        score: 60, compositeScore: 60, decisionLift: 10, winnerMargin: 5,
        strategyDiversity: 80, permitConfidence: 90, explainabilityIndex: 90,
        valueImpactBand: 'foundation', valueImpactLabel: '$1M–3M', summary: 'Test batch',
      },
      generatedAt: '2026-11-13T00:00:00.000Z',
    },
    createdAt: '2026-11-13T00:00:00.000Z',
  };
}

describe('Supabase SDK identity at data gateways', () => {
  beforeEach(() => {
    sdk.configured = true;
    sdk.rows = {};
    sdk.queries = [];
    sdk.uploads = [];
    sdk.getUser.mockReset();
    sdk.getUser.mockResolvedValue({ data: { user: approvedUser() }, error: null });
    localStorage.clear();
  });

  it('creates a project for the verified SDK user while legacy snapshots remain disabled', async () => {
    expect(readSupabaseSessionSnapshot()).toBeNull();
    const manifest = createProjectManifest({ name: 'SDK project' });

    const project = await createSupabaseProject('SDK project', undefined, manifest);

    expect(project).toMatchObject({
      id: 'created-project', ownerId: 'sdk-user', collaborators: ['sdk-user'], manifest,
    });
    expect(sdk.rows.projects).toEqual([expect.objectContaining({
      user_id: 'sdk-user', collaborators: ['sdk-user'], name: 'SDK project',
    })]);
    expect(readSupabaseSessionSnapshot()).toBeNull();
  });

  it('creates optimization history with the verified SDK owner in both stored identity fields', async () => {
    const record = await createSupabaseOptimizationBatch(optimizationBatch());

    expect(record).toMatchObject({ id: 'batch-1', userId: 'sdk-user', winnerId: 'winner' });
    expect(sdk.rows.optimization_batches).toEqual([expect.objectContaining({
      user_id: 'sdk-user', batch: expect.objectContaining({ userId: 'sdk-user' }),
    })]);
  });

  it('filters projects using the current SDK owner and collaborator identity', async () => {
    sdk.rows.projects = [
      { id: 'own', user_id: 'sdk-user', collaborators: [] },
      { id: 'shared', user_id: 'other-user', collaborators: ['sdk-user'] },
      { id: 'unrelated', user_id: 'other-user', collaborators: [] },
    ];

    expect((await getSupabaseProjects()).map((project) => project.id)).toEqual(['own', 'shared']);
  });

  it.each(['missing', 'error', 'throw', 'unsupported', 'anonymous'])(
    'blocks inserts, list queries, and uploads when SDK identity is %s',
    async (scenario) => {
      if (scenario === 'throw') {
        sdk.getUser.mockRejectedValue(new Error('Auth unavailable'));
      } else {
        const user = approvedUser();
        if (scenario === 'unsupported') {
          user.app_metadata = { provider: 'github', providers: ['github'] };
        }
        if (scenario === 'anonymous') user.is_anonymous = true;
        sdk.getUser.mockResolvedValue({
          data: { user: scenario === 'missing' ? null : user },
          error: scenario === 'error' ? new Error('Invalid session') : null,
        });
      }

      await expect(createSupabaseProject(
        'Denied', undefined, createProjectManifest({ name: 'Denied' }),
      )).rejects.toThrow();
      await expect(createSupabaseOptimizationBatch(optimizationBatch())).rejects.toThrow();
      expect(await getSupabaseProjects()).toEqual([]);
      await expect(uploadMaterialTexture(
        new File(['texture'], 'wall.png', { type: 'image/png' }), 'sdk-user',
      )).rejects.toThrow();
      expect(sdk.rows).toEqual({});
      expect(sdk.queries).toEqual([]);
      expect(sdk.uploads).toEqual([]);
    },
  );

  it('reports configured storage without requiring the deleted legacy snapshot', () => {
    expect(readSupabaseSessionSnapshot()).toBeNull();
    expect(isStorageConfigured()).toBe(true);
    sdk.configured = false;
    expect(isStorageConfigured()).toBe(false);
  });

  it('uploads textures only inside the verified SDK user directory', async () => {
    const file = new File(['texture'], 'wall.png', { type: 'image/png' });

    const url = await uploadMaterialTexture(file, 'sdk-user');

    expect(sdk.uploads).toEqual([{
      bucket: 'materials', path: expect.stringMatching(/^sdk-user\/[^/]+\.png$/), file,
    }]);
    expect(url).toBe(`https://storage.invalid/materials/${sdk.uploads[0].path}`);
  });

  it('rejects a stale or different requested upload owner before touching storage', async () => {
    await expect(uploadMaterialTexture(
      new File(['texture'], 'wall.png', { type: 'image/png' }), 'other-user',
    )).rejects.toThrow();
    expect(sdk.uploads).toEqual([]);
  });

  it('checks current SDK identity again after account replacement', async () => {
    const manifest = createProjectManifest({ name: 'Project' });
    const first = await createSupabaseProject('First', undefined, manifest);
    sdk.getUser.mockResolvedValue({ data: { user: approvedUser('replacement-user') }, error: null });
    const second = await createSupabaseProject('Second', undefined, manifest);

    expect(first.ownerId).toBe('sdk-user');
    expect(second.ownerId).toBe('replacement-user');
    expect(sdk.rows.projects.map((row) => row.user_id)).toEqual(['sdk-user', 'replacement-user']);
  });
});
