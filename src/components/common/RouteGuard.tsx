import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';
import routes from '@/routes';
import SanskritRainBackground from '@/components/common/SanskritRainBackground';

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
const isE2eLocalAccess =
  import.meta.env.VITE_E2E_ALLOW_LOCAL_ACCESS === 'true' &&
  !backendStatus.isConfigured;
/** Dev / e2e-local preview bypass when backend env is missing or explicit local demo is enabled. */
const allowLocalAccess = isE2eAuthGateBuild
  ? false
  : isE2eLocalAccess ||
    (import.meta.env.DEV && (allowLocalDemoMode || !backendStatus.isConfigured));
const showServiceConfigBanner =
  import.meta.env.PROD && !backendStatus.isConfigured && !allowLocalDemoMode && !isE2eLocalAccess;

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

  useEffect(() => {
    if (loading) return;
    if (!gated) return;

    if (!user && !publicRoute) {
      navigate('/auth', { state: { from: location.pathname }, replace: true });
      return;
    }

    if (user && location.pathname === '/auth') {
      const from = typeof location.state === 'object' && location.state && 'from' in location.state
        ? String(location.state.from)
        : '/editor';
      const dest = from.startsWith('/') && isProtectedRoute(from) ? from : '/editor';
      navigate(dest, { replace: true });
    }
  }, [gated, loading, location.pathname, location.state, navigate, publicRoute, user]);

  if (loading && !publicRoute) {
    return (
      <div className="vish-boot-stage vish-dark-stage relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <SanskritRainBackground preset="boot" className="pointer-events-none absolute inset-0" />

        <div className="vish-boot-yantra pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="vish-boot-scanline pointer-events-none absolute inset-x-0 top-0 h-px" aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <div className="vish-boot-mandala relative grid h-96 w-96 place-items-center" aria-hidden="true">
            <div className="vish-boot-ring vish-boot-ring-outer" />
            <div className="vish-boot-ring vish-boot-ring-middle" />
            <div className="vish-boot-ring vish-boot-ring-inner" />
            <div className="vish-boot-aura" />
          </div>

          <div className="vish-boot-logo-wrap absolute top-1/2 z-20 flex h-28 w-28 -translate-y-1/2 items-center justify-center rounded-[2rem] p-2">
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official swan logo" className="vish-boot-swan h-full w-full rounded-3xl object-cover" />
          </div>

          <div className="relative z-20 mt-[-3.5rem] space-y-3">
            <p className="vish-wordmark text-xl font-bold tracking-[0.46em] text-stone-100">VISHVAKARMA.OS</p>
            <div className="mx-auto h-px w-48 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-primary/70">Checking secure session</p>
            <p className="mx-auto max-w-sm text-xs leading-6 text-stone-400">
              Aligning workspace, mantra gate, and protected project state…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (gated && !loading && !user && !publicRoute) {
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
