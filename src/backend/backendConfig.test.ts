import { getBackendStatus, getMissingBackendKeys, normalizeBackendProvider } from './backendConfig';

describe('backendConfig', () => {
  it('defaults to Supabase when no provider is set', () => {
    expect(normalizeBackendProvider(undefined)).toBe('supabase');
    expect(normalizeBackendProvider('unknown')).toBe('supabase');
  });

  it('uses Firebase when explicitly requested', () => {
    expect(normalizeBackendProvider('firebase')).toBe('firebase');
  });

  it('reports missing Supabase keys for placeholder values', () => {
    const missing = getMissingBackendKeys('supabase', {
      VITE_SUPABASE_URL: 'https://your-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'your-supabase-anon-key',
    });

    expect(missing).toEqual(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']);
  });

  it('reports connected Supabase status for real-looking values', () => {
    const status = getBackendStatus({
      VITE_BACKEND_PROVIDER: 'supabase',
      VITE_SUPABASE_URL: 'https://vishvakarma-prod.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-demo-demo',
    });

    expect(status).toMatchObject({
      provider: 'supabase',
      mode: 'connected',
      isConfigured: true,
      configurationError: null,
      missingKeys: [],
    });
  });

  it('reports missing Firebase keys until all required values are present', () => {
    const status = getBackendStatus({
      VITE_BACKEND_PROVIDER: 'firebase',
      VITE_FIREBASE_API_KEY: 'your-firebase-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'your-app.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'your-project-id',
      VITE_FIREBASE_APP_ID: 'your-app-id',
    });

    expect(status.provider).toBe('firebase');
    expect(status.mode).toBe('local-only');
    expect(status.isConfigured).toBe(false);
    expect(status.configurationError).toContain('VITE_FIREBASE_API_KEY');
  });

  it('reports connected Firebase status for real-looking values', () => {
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
});
