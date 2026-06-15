import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import SanskritRainBackground from '@/components/common/SanskritRainBackground';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children?: ReactNode;
  variant?: 'gate' | 'boot';
  className?: string;
}

/** Shared black/gold sacred stage for auth, reset-password, and session boot. */
export function AuthLayout({ children, variant = 'gate', className }: AuthLayoutProps) {
  const { bottomInset: keyboardBottomInset, isKeyboardOpen } = useVisualViewportInset();
  const isBoot = variant === 'boot';

  return (
    <div
      className={cn(
        'vish-auth-gate vish-dark-stage relative flex min-h-[100dvh] items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-8 sm:py-10',
        isBoot && 'vish-boot-stage',
        className,
      )}
      style={isKeyboardOpen ? { paddingBottom: `${keyboardBottomInset + 16}px` } : undefined}
    >
      <SanskritRainBackground
        preset={isBoot ? 'boot' : 'auth'}
        className="pointer-events-none absolute inset-0"
      />

      {isBoot ? (
        <>
          <div className="vish-boot-aurora pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="vish-boot-yantra pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="vish-boot-scanline pointer-events-none absolute inset-x-0 top-0 h-px" aria-hidden="true" />
        </>
      ) : (
        <>
          <div className="vish-auth-aurora pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="vish-yantra-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="vish-mandala-aura pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="vish-mandala-ring vish-mandala-ring-outer" />
            <div className="vish-mandala-ring vish-mandala-ring-mid" />
            <div className="vish-mandala-ring vish-mandala-ring-inner" />
          </div>
          <div
            className="vish-auth-orb pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
            aria-hidden="true"
          />
        </>
      )}

      <div className="vish-auth-shell relative z-10 flex w-full max-w-lg flex-col items-center justify-center gap-6 px-2 sm:max-w-xl sm:gap-8">
        {children ?? <Outlet />}
      </div>
    </div>
  );
}

export default AuthLayout;
