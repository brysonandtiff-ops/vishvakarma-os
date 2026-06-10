import type { ReactNode } from 'react';
import SanskritRainBackground from '@/components/common/SanskritRainBackground';

interface SacredBackgroundProps {
  children: ReactNode;
  className?: string;
  enableRain?: boolean;
  intensity?: 'marketing' | 'auth-lite';
}

export function SacredBackground({
  children,
  className = '',
  enableRain = true,
  intensity = 'marketing',
}: SacredBackgroundProps) {
  const showAurora = intensity === 'marketing' || intensity === 'auth-lite';
  const showMandala = intensity === 'marketing' || intensity === 'auth-lite';
  const showVignette = intensity === 'marketing' || intensity === 'auth-lite';

  return (
    <div className={`vish-sacred-stage relative overflow-hidden ${className}`}>
      {enableRain && (
        <SanskritRainBackground
          preset="marketing"
          className="vish-sanskrit-rain-canvas--marketing pointer-events-none absolute inset-0"
        />
      )}
      {showAurora && (
        <div className="vish-sacred-aurora vish-sacred-aurora--marketing pointer-events-none absolute inset-0" aria-hidden="true" />
      )}
      <div className="vish-yantra-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      {showMandala && (
        <div className="vish-mandala-aura pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
          <div className="vish-mandala-ring vish-mandala-ring-static" />
        </div>
      )}
      {showVignette && (
        <div className="vish-sacred-vignette vish-sacred-vignette--light pointer-events-none absolute inset-0" aria-hidden="true" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
