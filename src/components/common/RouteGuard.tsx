import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { backendStatus } from '@/backend/backendConfig';
import {
  clearSupabaseSessionSnapshot,
  hasCachedAuthSession,
} from '@/backend/supabase/supabaseAuthGateway';
import { readAndClearAuthReturnPath, resolvePostAuthDestination } from '@/backend/supabase/supabaseOAuthGateway';
import { useAuth } from '@/contexts/AuthContext';
import routes from '@/routes';

interface RouteGuardProps {
  children: ReactNode;
}

const PROTECTED_ROUTES = routes
  .filter((route) => route.access === 'private')
  .map((route) => route.path);

const allowLocalDemoMode = import.meta.env.DEV && import.meta.env.VITE_ALLOW_LOCAL_DEMO === 'true';
const isE2eAuthGateBuild =
  import.meta.env.MODE === 'e2e' &&
  import.meta.env.VITE_E2E_ALLOW_LOCAL_ACCESS !== 'true';
const isE2eLocalAccess = import.meta.env.VITE_E2E_ALLOW_LOCAL_ACCESS === 'true';
/** Dev / e2e-local preview bypass when backend env is missing or explicit local demo is enabled. */
const allowLocalAccess = isE2eAuthGateBuild
  ? false
  : isE2eLocalAccess ||
    (import.meta.env.DEV && (allowLocalDemoMode || !backendStatus.isConfigured));
const showServiceConfigBanner =
  import.meta.env.PROD && !backendStatus.isConfigured && !allowLocalDemoMode && !isE2eLocalAccess;

/** Max wait before clearing a stale snapshot and returning to sign-in. */
export const SESSION_BOOT_TIMEOUT_MS = 9_000;

/** Paths that require an authenticated session before rendering. */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isPublicRoute(pathname: string): boolean {
  return !isProtectedRoute(pathname);
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const publicRoute = isPublicRoute(location.pathname);
  const gated = !allowLocalAccess;
  const restoringSession = !user && hasCachedAuthSession();
  const awaitingAuth = !user && (loading || restoringSession);

  useEffect(() => {
    if (!gated) return;

    if (user && location.pathname === '/auth') {
      const fromState =
        typeof location.state === 'object' && location.state && 'from' in location.state
          ? String(location.state.from)
          : null;
      const dest = resolvePostAuthDestination(fromState);
      readAndClearAuthReturnPath();
      navigate(dest, { replace: true });
      return;
    }

    if (awaitingAuth) return;

    if (!user && !publicRoute && !hasCachedAuthSession()) {
      navigate('/auth', { state: { from: location.pathname }, replace: true });
    }
  }, [awaitingAuth, gated, location.pathname, location.state, navigate, publicRoute, user]);

  useEffect(() => {
    if (!restoringSession || user || publicRoute) return;

    const timeoutId = window.setTimeout(() => {
      if (!hasCachedAuthSession()) return;

      clearSupabaseSessionSnapshot();
      navigate('/auth', {
        state: { from: location.pathname, message: 'session-restore-timeout' },
        replace: true,
      });
    }, SESSION_BOOT_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, navigate, publicRoute, restoringSession, user]);

  if (awaitingAuth && !publicRoute) {
    // Keep protected content gated without presenting a blocking full-screen wait experience.
    return (
      <span className="sr-only" role="status" aria-live="polite">
        Checking secure session
      </span>
    );
  }

  if (gated && !awaitingAuth && !user && !publicRoute && !hasCachedAuthSession()) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return (
    <>
      {showServiceConfigBanner && (
        <div
          role="status"
          className="border-b border-warning/40 bg-warning/10 px-4 py-2 text-center text-xs text-warning"
        >
          Service configuration required — set Vercel environment variables (see docs/release/VERCEL_ENV.md).
        </div>
      )}
      {children}
    </>
  );
}
