/**
 * SacredTempleGate — An immersive full-page background for the Auth page.
 * Combines deep indigo cosmic sky, animated Sanskrit rain, floating mandala,
 * temple arch silhouette, and sacred geometry overlays.
 */

import { type ReactNode } from 'react';
import SanskritRainBackground from '@/components/common/SanskritRainBackground';
import { SacredIndianMandala } from '@/components/common/SacredIndianMandala';

interface SacredTempleGateProps {
  children: ReactNode;
}

export function SacredTempleGate({ children }: SacredTempleGateProps) {
  return (
    <div className="sacred-temple-gate">
      {/* Layer 1: Deep cosmic indigo background */}
      <div className="sacred-temple-gate__cosmos" aria-hidden="true" />

      {/* Layer 2: Animated kolam dot grid */}
      <div className="sacred-temple-gate__kolam" aria-hidden="true" />

      {/* Layer 3: Sanskrit rain (existing component) — auth preset is softer/slower */}
      <SanskritRainBackground
        preset="auth"
        opacity={0.35}
        className="sacred-temple-gate__rain"
      />

      {/* Layer 4: Floating mandala behind the card */}
      <div className="sacred-temple-gate__mandala" aria-hidden="true">
        <SacredIndianMandala size="xl" variant="auth" animate />
      </div>

      {/* Layer 5: Temple arch silhouette */}
      <div className="sacred-temple-gate__arch" aria-hidden="true">
        <svg viewBox="0 0 800 900" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
          {/* Temple arch outline */}
          <path
            d="M 100 900 L 100 350 Q 100 100 400 80 Q 700 100 700 350 L 700 900"
            fill="none"
            stroke="hsl(42 78% 50% / 0.12)"
            strokeWidth="2"
          />
          {/* Inner arch */}
          <path
            d="M 160 900 L 160 380 Q 160 180 400 160 Q 640 180 640 380 L 640 900"
            fill="none"
            stroke="hsl(42 78% 50% / 0.06)"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
          {/* Kalash (pot) at top */}
          <ellipse cx="400" cy="72" rx="18" ry="12" fill="none" stroke="hsl(42 78% 50% / 0.15)" strokeWidth="1.5" />
          <path d="M 394 60 Q 400 48 406 60" fill="none" stroke="hsl(42 78% 50% / 0.2)" strokeWidth="1" />
          {/* Decorative dots along arch */}
          {Array.from({ length: 20 }, (_, i) => {
            const t = i / 19;
            const angle = Math.PI * (1 - t);
            const rx = 280;
            const ry = 240;
            const cx = 400 + rx * Math.cos(angle);
            const cy = 320 - ry * Math.sin(angle);
            return (
              <circle
                key={`arch-dot-${i}`}
                cx={cx}
                cy={cy}
                r="2"
                fill="hsl(42 78% 50% / 0.2)"
              />
            );
          })}
        </svg>
      </div>

      {/* Layer 6: Vignette */}
      <div className="sacred-temple-gate__vignette" aria-hidden="true" />

      {/* Layer 7: Content */}
      <div className="sacred-temple-gate__content">
        {children}
      </div>
    </div>
  );
}

export default SacredTempleGate;
