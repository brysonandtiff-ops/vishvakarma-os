import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock('@/backend/supabase/supabaseAuthGateway', () => ({
  clearSupabaseSessionSnapshot: vi.fn(),
  hasCachedAuthSession: () => false,
}));
vi.mock('@/backend/supabase/supabaseOAuthGateway', () => ({
  readAndClearAuthReturnPath: vi.fn(),
  resolvePostAuthDestination: () => '/editor',
}));

describe('RouteGuard local-access build policy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock('@/backend/backendConfig');
    vi.resetModules();
  });

  it.each([
    { name: 'production with an E2E flag', mode: 'production', e2e: 'true', dev: false, configured: true, demo: '', allowed: false },
    { name: 'auth-gate build with an E2E flag', mode: 'e2e', e2e: 'true', dev: false, configured: true, demo: '', allowed: false },
    { name: 'local build without opt-in', mode: 'e2e-local', e2e: 'false', dev: false, configured: false, demo: '', allowed: false },
    { name: 'explicit local E2E build', mode: 'e2e-local', e2e: 'true', dev: false, configured: false, demo: '', allowed: true },
    { name: 'production with a demo flag', mode: 'production', e2e: '', dev: false, configured: true, demo: 'true', allowed: false },
    { name: 'configured development without demo opt-in', mode: 'development', e2e: '', dev: true, configured: true, demo: '', allowed: false },
    { name: 'explicit development demo', mode: 'development', e2e: '', dev: true, configured: true, demo: 'true', allowed: true },
    { name: 'unconfigured development', mode: 'development', e2e: '', dev: true, configured: false, demo: '', allowed: true },
  ])('$name allows anonymous private content: $allowed', async (policy) => {
    vi.resetModules();
    vi.stubEnv('MODE', policy.mode);
    vi.stubEnv('DEV', policy.dev);
    vi.stubEnv('PROD', !policy.dev);
    vi.stubEnv('VITE_E2E_ALLOW_LOCAL_ACCESS', policy.e2e);
    vi.stubEnv('VITE_ALLOW_LOCAL_DEMO', policy.demo);
    vi.doMock('@/backend/backendConfig', () => ({
      backendStatus: { provider: 'supabase', isConfigured: policy.configured },
    }));
    const { RouteGuard } = await import('./RouteGuard');

    render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route path="/editor" element={<RouteGuard><h1>Private editor</h1></RouteGuard>} />
          <Route path="/auth" element={<h1>Sign in required</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: policy.allowed ? 'Private editor' : 'Sign in required' });
    expect(screen.queryByRole('heading', { name: policy.allowed ? 'Sign in required' : 'Private editor' })).not.toBeInTheDocument();
  });
});
