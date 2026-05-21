import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 shadow">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking secure session…</p>
        </div>
      </div>
    );
  }

  if (gated && !user && !publicRoute) {
    return null;
  }

  return <>{children}</>;
}
