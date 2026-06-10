import type { ReactNode } from 'react';
import SanskritRainBackground from '@/components/common/SanskritRainBackground';

interface SacredBackgroundProps {
  children: ReactNode;
  className?: string;
  enableRain?: boolean;
}

export function SacredBackground({
  children,
  className = '',
  enableRain = true,
}: SacredBackgroundProps) {
  return (
    <div className={`vish-sacred-stage relative overflow-hidden ${className}`}>
      {enableRain && (
        <SanskritRainBackground
          preset="marketing"
          className="vish-sanskrit-rain-canvas--marketing pointer-events-none absolute inset-0"
        />
      )}
      <div className="vish-yantra-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
