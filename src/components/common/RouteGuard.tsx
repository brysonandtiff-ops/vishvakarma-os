import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = ['/auth'];
const localDemoMode = import.meta.env.DEV;

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname);
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const publicRoute = isPublicRoute(location.pathname);
  const gated = isConfigured || !localDemoMode;

  useEffect(() => {
    if (loading) return;
    if (!gated) return;

    if (!user && !publicRoute) {
      navigate('/auth', { state: { from: location.pathname }, replace: true });
      return;
    }

    if (user && publicRoute) {
      const from = typeof location.state === 'object' && location.state && 'from' in location.state
        ? String(location.state.from)
        : '/';
      navigate(from, { replace: true });
    }
  }, [gated, loading, location.pathname, location.state, navigate, publicRoute, user]);

  if (loading) {
    return (
      <div className="vish-dark-stage flex min-h-screen items-center justify-center px-6">
        <div className="relative flex flex-col items-center gap-5 text-center">
          <div className="absolute h-80 w-80 rounded-full border border-primary/10" aria-hidden="true" />
          <div className="absolute h-56 w-56 animate-spin rounded-full border border-primary/20 border-t-primary/60" aria-hidden="true" />
          <div className="vish-logo-tile relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl p-2">
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official user-supplied logo" className="h-full w-full rounded-2xl object-cover" />
          </div>
          <div className="relative z-10 space-y-2">
            <p className="vish-wordmark text-lg font-bold tracking-[0.42em]">VISHVAKARMA.OS</p>
            <p className="text-xs uppercase tracking-[0.32em] text-primary/55">Checking secure session…</p>
          </div>
        </div>
      </div>
    );
  }

  if (gated && !user && !publicRoute) {
    return null;
  }

  return <>{children}</>;
}
