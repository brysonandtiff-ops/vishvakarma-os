import type { ReactNode } from 'react';
import SanskritRainBackground from '@/components/common/SanskritRainBackground';
import { SacredCosmicLayer } from '@/components/marketing/SacredCosmicLayer';
import { SacredMandalaLayer } from '@/components/marketing/SacredMandalaLayer';

interface SacredBackgroundProps {
  children: ReactNode;
  className?: string;
  enableRain?: boolean;
  intensity?: 'marketing' | 'auth-lite';
  header?: ReactNode;
}

export function SacredBackground({
  children,
  className = '',
  enableRain = true,
  intensity = 'marketing',
  header,
}: SacredBackgroundProps) {
  const showAurora = intensity === 'marketing' || intensity === 'auth-lite';
  const showCosmic = intensity === 'marketing';
  const showMandala = intensity === 'marketing' || intensity === 'auth-lite';
  const showVignette = intensity === 'marketing' || intensity === 'auth-lite';

  return (
    <div className={`vish-sacred-stage relative overflow-hidden ${className}`}>
      {showCosmic && (
        <SacredCosmicLayer className="vish-sacred-cosmic-canvas--marketing pointer-events-none absolute inset-0" />
      )}
      {enableRain && (
        <SanskritRainBackground
          preset="marketing"
          className="vish-sanskrit-rain-canvas--marketing pointer-events-none absolute inset-0"
        />
      )}
      {showAurora && (
        <div className="vish-sacred-aurora vish-sacred-aurora--marketing pointer-events-none absolute inset-0" aria-hidden="true" />
      )}
      <div className="vish-yantra-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
      {showMandala && <SacredMandalaLayer />}
      {showVignette && (
        <div className="vish-sacred-vignette vish-sacred-vignette--light pointer-events-none absolute inset-0" aria-hidden="true" />
      )}
      {header}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
