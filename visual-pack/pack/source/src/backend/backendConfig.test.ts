import { describe, expect, it } from 'vitest';
import { getBackendStatus, getMissingSupabaseKeys, resolveSupabaseConfig } from '@/backend/backendConfig';

describe('backendConfig', () => {
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
});
