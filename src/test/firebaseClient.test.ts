import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('firebaseClient configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('reports unconfigured when Firebase env vars are missing', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', '');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '');

    const module = await import('@/backend/firebase/firebaseClient');
    expect(module.isFirebaseConfigured).toBe(false);
    expect(module.firebaseAuth).toBeNull();
  });
});
