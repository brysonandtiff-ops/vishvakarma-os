import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = ['/auth'];
const allowLocalDemoMode = import.meta.env.DEV && import.meta.env.VITE_ALLOW_LOCAL_DEMO === 'true';

const BOOT_MANTRAS = [
  'ॐ विश्वकर्मणे नमः',
  'शिल्पं ज्योतिः प्रमाणम्',
  'रचना सुरक्षा विश्वासः',
  'धर्म वास्तु विज्ञानम्',
  'सत्यं सौन्दर्यम् स्थिरम्',
  'यन्त्र मन्त्र मण्डलम्',
] as const;

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname);
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const publicRoute = isPublicRoute(location.pathname);
  const gated = !allowLocalDemoMode;

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
      <div className="vish-boot-stage vish-dark-stage relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="vish-boot-sanskrit-rain pointer-events-none absolute inset-0" aria-hidden="true">
          {BOOT_MANTRAS.map((glyphs, index) => (
            <span
              key={glyphs}
              className="vish-boot-sanskrit-column"
              style={{
                left: `${8 + index * 15}%`,
                animationDelay: `${index * -2.8}s`,
                animationDuration: `${16 + index * 2.2}s`,
              }}
            >
              {Array.from({ length: 8 }, (_, lineIndex) => (
                <span key={`${glyphs}-${lineIndex}`}>{glyphs}</span>
              ))}
            </span>
          ))}
        </div>

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

  if (gated && !user && !publicRoute) {
    return null;
  }

  return <>{children}</>;
}
