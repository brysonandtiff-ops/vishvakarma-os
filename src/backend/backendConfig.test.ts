import { describe, expect, it } from 'vitest';
import { getBackendStatus, getMissingSupabaseKeys } from '@/backend/backendConfig';

describe('backendConfig', () => {
  it('reports missing Supabase keys for placeholder values', () => {
    const missing = getMissingSupabaseKeys({
      VITE_SUPABASE_URL: 'https://example.com',
      VITE_SUPABASE_ANON_KEY: 'your-anon-key',
    });

    expect(missing).toEqual(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']);
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

  it('reports local-only mode when Supabase env is incomplete', () => {
    const status = getBackendStatus({
      VITE_SUPABASE_URL: 'https://jyocvwipthswfcmvqgqe.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'your-anon-key',
    });

    expect(status.provider).toBe('supabase');
    expect(status.isConfigured).toBe(false);
    expect(status.mode).toBe('local-only');
    expect(status.configurationError).toContain('VITE_SUPABASE_ANON_KEY');
  });
});
