import type { ReactNode } from 'react';

interface SacredBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function SacredBackground({ children, className = '' }: SacredBackgroundProps) {
  return (
    <div className={`vish-sacred-stage relative overflow-hidden ${className}`}>
      <div className="vish-yantra-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
