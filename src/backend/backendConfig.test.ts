import { getBackendStatus, getMissingBackendKeys } from './backendConfig';

describe('backendConfig', () => {
  it('always reports firebase as the provider', () => {
    const status = getBackendStatus({});
    expect(status.provider).toBe('firebase');
  });

  it('reports missing Firebase keys for placeholder values', () => {
    const missing = getMissingBackendKeys({
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

  it('reports connected Firebase status for real-looking values', () => {
    const status = getBackendStatus({
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

  it('reports local-only mode when Firebase env is incomplete', () => {
    const status = getBackendStatus({
      VITE_FIREBASE_API_KEY: 'AIzaSyDemoRealLookingKeyForTestsOnly',
    });

    expect(status.provider).toBe('firebase');
    expect(status.mode).toBe('local-only');
    expect(status.isConfigured).toBe(false);
    expect(status.configurationError).toContain('VITE_FIREBASE_AUTH_DOMAIN');
  });
});
