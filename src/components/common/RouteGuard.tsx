import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { backendStatus } from '@/backend/backendConfig';
import {
  clearSupabaseSessionSnapshot,
  hasCachedAuthSession,
} from '@/backend/supabase/supabaseAuthGateway';
import { readAndClearAuthReturnPath, resolvePostAuthDestination } from '@/backend/supabase/supabaseOAuthGateway';
import { useAuth } from '@/contexts/AuthContext';
import routes from '@/routes';
import AuthLayout from '@/components/layouts/AuthLayout';

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

/** Max wait on SessionBootScreen before clearing a stale snapshot and returning to sign-in. */
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

function SessionBootScreen() {
  return (
    <AuthLayout variant="boot">
      <div className="relative z-10 flex max-w-full flex-col items-center gap-5 px-2 text-center sm:gap-6">
        <div className="vish-boot-mandala relative grid h-72 w-72 max-w-full place-items-center sm:h-96 sm:w-96" aria-hidden="true">
          <div className="vish-boot-ring vish-boot-ring-outer" />
          <div className="vish-boot-ring vish-boot-ring-middle" />
          <div className="vish-boot-ring vish-boot-ring-inner" />
          <div className="vish-boot-aura" />
        </div>

        <div className="vish-boot-logo-wrap absolute top-1/2 z-20 flex h-20 w-20 -translate-y-1/2 items-center justify-center rounded-[1.5rem] p-2 sm:h-28 sm:w-28 sm:rounded-[2rem]">
          <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official swan logo" className="vish-boot-swan h-full w-full rounded-2xl object-cover sm:rounded-3xl" />
        </div>

        <div className="vish-fade-rise vish-stagger-2 relative z-20 mt-[-2.75rem] max-w-full space-y-3 sm:mt-[-3.5rem]">
          <p className="vish-wordmark break-words text-base font-bold tracking-[0.28em] text-foreground sm:text-xl sm:tracking-[0.46em]">VISHVAKARMA.OS</p>
          <div className="mx-auto h-px w-40 max-w-full bg-gradient-to-r from-transparent via-primary/70 to-transparent sm:w-48" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/70 sm:text-[11px] sm:tracking-[0.34em]">Checking secure session</p>
          <p className="mx-auto max-w-sm text-xs leading-6 text-muted-foreground">
            Aligning workspace, mantra gate, and protected project state…
          </p>
        </div>
      </div>
    </AuthLayout>
  );
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
    return <SessionBootScreen />;
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
