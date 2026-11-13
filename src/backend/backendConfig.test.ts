import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBackendStatus, getMissingSupabaseKeys, resolveSupabaseConfig } from '@/backend/backendConfig';
import type { ProjectManifest } from '@/types';

describe('backendConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock('@supabase/supabase-js');
    vi.resetModules();
    localStorage.clear();
  });

  it('reports missing Supabase env keys for placeholder values', () => {
    const missing = getMissingSupabaseKeys({
      VITE_SUPABASE_URL: 'https://example.com',
      VITE_SUPABASE_ANON_KEY: 'your-anon-key',
    });

    expect(missing).toEqual(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']);
  });

  it('uses the public Supabase fallback when env values are placeholders', () => {
    const resolved = resolveSupabaseConfig({
      VITE_SUPABASE_URL: 'https://example.com',
      VITE_SUPABASE_ANON_KEY: 'your-anon-key',
    });

    expect(resolved).toMatchObject({
      url: 'https://jyocvwipthswfcmvqgqe.supabase.co',
      missingKeys: [],
      usedPublicFallback: true,
    });
    expect(resolved.anonKey).toMatch(/^sb_publishable_/);
  });

  it('reports connected Supabase status when env is complete', () => {
    const status = getBackendStatus({
      VITE_SUPABASE_URL: 'https://jyocvwipthswfcmvqgqe.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    });

    expect(status).toMatchObject({
      provider: 'supabase',
      isConfigured: true,
      mode: 'connected',
      configurationError: null,
    });
  });

  it('keeps the app connected with the public fallback when Supabase env is incomplete', () => {
    const status = getBackendStatus({
      VITE_SUPABASE_URL: 'https://jyocvwipthswfcmvqgqe.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'your-anon-key',
    });

    expect(status.provider).toBe('supabase');
    expect(status.isConfigured).toBe(true);
    expect(status.mode).toBe('connected');
    expect(status.configurationError).toBeNull();
  });

  it('forces standard unit-test environments onto the local backend', () => {
    const status = getBackendStatus({
      MODE: 'test',
      VITE_SUPABASE_URL: 'https://jyocvwipthswfcmvqgqe.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_test',
    });

    expect(status).toMatchObject({
      provider: 'supabase',
      isConfigured: false,
      mode: 'local-only',
      missingKeys: [],
    });
    expect(status.configurationError).toContain('disabled during unit tests');
  });

  it.each([
    { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    { VITE_SUPABASE_URL: 'https://isolated-project.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_fixture' },
  ])('isolates explicit local E2E builds even with resolved Supabase values: %j', (supabaseEnv) => {
    const status = getBackendStatus({
      MODE: 'e2e-local',
      VITE_E2E_ALLOW_LOCAL_ACCESS: 'true',
      ...supabaseEnv,
    });
    expect(status).toMatchObject({ isConfigured: false, mode: 'local-only' });
    expect(status.configurationError).toMatch(/disabled.*local E2E/i);
  });

  it('keeps production and auth-gate builds connected to the public fallback', () => {
    for (const env of [
      { MODE: 'production', VITE_E2E_ALLOW_LOCAL_ACCESS: 'true' },
      { MODE: 'e2e', VITE_E2E_ALLOW_LOCAL_ACCESS: '' },
    ]) {
      expect(getBackendStatus(env)).toMatchObject({
        isConfigured: true,
        mode: 'connected',
        configurationError: null,
      });
    }
  });

  it('cannot initialize a live client or create a cloud project from a forged local E2E session', async () => {
    vi.resetModules();
    vi.stubEnv('MODE', 'e2e-local');
    vi.stubEnv('VITEST', 'false');
    vi.stubEnv('VITE_E2E_ALLOW_LOCAL_ACCESS', 'true');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const createClient = vi.fn(() => ({ from: vi.fn() }));
    vi.doMock('@supabase/supabase-js', () => ({ createClient }));
    localStorage.setItem('vishvakarma.os.supabase.session.v1', JSON.stringify({
      provider: 'supabase', uid: 'forged-local-user', email: 'fixture@example.test',
    }));

    const { getSupabaseClient } = await import('@/backend/supabase/supabaseClient');
    const { createProject } = await import('@/db/api');
    expect(getSupabaseClient()).toBeNull();
    await expect(createProject('Isolated fixture', undefined, {} as ProjectManifest))
      .rejects.toThrow(/disabled.*local E2E/i);
    expect(createClient).not.toHaveBeenCalled();
  });
});
