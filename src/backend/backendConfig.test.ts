import {
  getBackendStatus,
  getMissingFirebaseKeys,
  getMissingSupabaseKeys,
  resolveBackendProvider,
} from './backendConfig';

describe('backendConfig', () => {
  it('defaults to supabase when no provider or keys are set', () => {
    const status = getBackendStatus({});
    expect(status.provider).toBe('supabase');
    expect(status.mode).toBe('local-only');
    expect(status.isConfigured).toBe(false);
    expect(status.configurationError).toContain('Supabase backend is not configured');
  });

  it('reports missing Supabase keys for placeholder values', () => {
    const missing = getMissingSupabaseKeys({
      VITE_SUPABASE_URL: 'https://your-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'your-anon-key',
    });

    expect(missing).toEqual(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']);
  });

  it('reports missing Firebase keys for placeholder values', () => {
    const missing = getMissingFirebaseKeys({
      VITE_FIREBASE_API_KEY: 'your-firebase-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'your-app.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'your-project-id',
      VITE_FIREBASE_APP_ID: 'your-app-id',
    });

    expect(missing).toEqual([
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_APP_ID',
    ]);
  });

  it('reports connected Supabase status for real-looking values', () => {
    const status = getBackendStatus({
      VITE_BACKEND_PROVIDER: 'supabase',
      VITE_SUPABASE_URL: 'https://jyocvwipthswfcmvqgqe.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo',
    });

    expect(status).toMatchObject({
      provider: 'supabase',
      mode: 'connected',
      isConfigured: true,
      configurationError: null,
      missingKeys: [],
    });
  });

  it('reports connected Firebase status when provider is firebase', () => {
    const status = getBackendStatus({
      VITE_BACKEND_PROVIDER: 'firebase',
      VITE_FIREBASE_API_KEY: 'AIzaSyDemoRealLookingKeyForTestsOnly',
      VITE_FIREBASE_AUTH_DOMAIN: 'vishvakarma-os.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'vishvakarma-os',
      VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef123456',
    });

    expect(status).toMatchObject({
      provider: 'firebase',
      mode: 'connected',
      isConfigured: true,
      configurationError: null,
      missingKeys: [],
    });
  });

  it('prefers supabase when both backends have complete keys', () => {
    const provider = resolveBackendProvider({
      VITE_SUPABASE_URL: 'https://jyocvwipthswfcmvqgqe.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo',
      VITE_FIREBASE_API_KEY: 'AIzaSyDemoRealLookingKeyForTestsOnly',
      VITE_FIREBASE_AUTH_DOMAIN: 'vishvakarma-os.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'vishvakarma-os',
      VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef123456',
    });

    expect(provider).toBe('supabase');
  });

  it('reports local-only mode when Supabase env is incomplete', () => {
    const status = getBackendStatus({
      VITE_BACKEND_PROVIDER: 'supabase',
      VITE_SUPABASE_URL: 'https://jyocvwipthswfcmvqgqe.supabase.co',
    });

    expect(status.provider).toBe('supabase');
    expect(status.mode).toBe('local-only');
    expect(status.isConfigured).toBe(false);
    expect(status.configurationError).toContain('VITE_SUPABASE_ANON_KEY');
  });

  it('reports local-only mode when Firebase env is incomplete', () => {
    const status = getBackendStatus({
      VITE_BACKEND_PROVIDER: 'firebase',
      VITE_FIREBASE_API_KEY: 'AIzaSyDemoRealLookingKeyForTestsOnly',
    });

    expect(status.provider).toBe('firebase');
    expect(status.mode).toBe('local-only');
    expect(status.isConfigured).toBe(false);
    expect(status.configurationError).toContain('VITE_FIREBASE_AUTH_DOMAIN');
  });
});
