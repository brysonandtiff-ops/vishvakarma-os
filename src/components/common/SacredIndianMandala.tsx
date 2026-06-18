/**
 * SacredIndianMandala — A richly detailed, authentically Indian mandala component.
 * Features lotus petals, Sri Yantra triangles, Devanagari script ring,
 * and kolam-inspired dot patterns. Used as a background/decorative element.
 */

import { memo, type ReactElement } from 'react';

const CENTER = 200;
const GOLD = 'hsl(42 78% 50%)';
const GOLD_BRIGHT = 'hsl(43 88% 62%)';
const SAFFRON = 'hsl(24 92% 54%)';
const LOTUS_PINK = 'hsl(340 62% 58%)';
const INDIGO_LIGHT = 'hsl(228 32% 42%)';

const DEVANAGARI_RING = 'ॐ श्री विश्वकर्मणे नमः · धर्म · अर्थ · शिल्प · विज्ञान · वास्तु';

function lotusPetals(count: number, innerR: number, outerR: number, color: string, opacity = 0.6) {
  const petals: ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i * 360) / count;
    const rad = (angle * Math.PI) / 180;
    const nextRad = ((angle + 360 / count) * Math.PI) / 180;
    const midRad = ((angle + 180 / count) * Math.PI) / 180;

    const x1 = CENTER + innerR * Math.cos(rad);
    const y1 = CENTER + innerR * Math.sin(rad);
    const x2 = CENTER + innerR * Math.cos(nextRad);
    const y2 = CENTER + innerR * Math.sin(nextRad);
    const tipX = CENTER + outerR * Math.cos(midRad);
    const tipY = CENTER + outerR * Math.sin(midRad);

    const cp1x = CENTER + (outerR * 0.85) * Math.cos(rad + 0.12);
    const cp1y = CENTER + (outerR * 0.85) * Math.sin(rad + 0.12);
    const cp2x = CENTER + (outerR * 0.85) * Math.cos(nextRad - 0.12);
    const cp2y = CENTER + (outerR * 0.85) * Math.sin(nextRad - 0.12);

    petals.push(
      <path
        key={`petal-${i}`}
        d={`M ${x1} ${y1} Q ${cp1x} ${cp1y} ${tipX} ${tipY} Q ${cp2x} ${cp2y} ${x2} ${y2} Z`}
        fill={color}
        fillOpacity={opacity * 0.15}
        stroke={color}
        strokeWidth={0.6}
        strokeOpacity={opacity}
      />
    );
  }
  return petals;
}

function sriYantraTriangles() {
  const triangles: ReactElement[] = [];
  const sizes = [60, 48, 36, 24];
  const rotations = [0, 60, 120, 180];

  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i];
    const rot = rotations[i];
    const points: string[] = [];
    for (let j = 0; j < 3; j++) {
      const angle = ((j * 120 + rot - 90) * Math.PI) / 180;
      points.push(`${CENTER + s * Math.cos(angle)},${CENTER + s * Math.sin(angle)}`);
    }
    triangles.push(
      <polygon
        key={`tri-${i}`}
        points={points.join(' ')}
        fill="none"
        stroke={i % 2 === 0 ? GOLD : SAFFRON}
        strokeWidth={0.5}
        strokeOpacity={0.5 - i * 0.08}
      />
    );
  }
  return triangles;
}

function kolamDots(radius: number, count: number) {
  const dots: ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i * 360) / count;
    const rad = (angle * Math.PI) / 180;
    const x = CENTER + radius * Math.cos(rad);
    const y = CENTER + radius * Math.sin(rad);
    dots.push(
      <circle
        key={`dot-${radius}-${i}`}
        cx={x}
        cy={y}
        r={1.5}
        fill={GOLD_BRIGHT}
        fillOpacity={0.5}
      />
    );
  }
  return dots;
}

function devanagariRing(radius: number) {
  const chars = [...DEVANAGARI_RING];
  return chars.map((char, i) => {
    if (char === ' ') return null;
    const angle = (i * 360) / chars.length - 90;
    const rad = (angle * Math.PI) / 180;
    const x = CENTER + radius * Math.cos(rad);
    const y = CENTER + radius * Math.sin(rad);
    return (
      <text
        key={`deva-${i}`}
        x={x}
        y={y}
        fill={GOLD_BRIGHT}
        fontSize={5.5}
        fontFamily="'Noto Sans Devanagari', serif"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(${angle + 90} ${x} ${y})`}
        opacity={0.7}
      >
        {char}
      </text>
    );
  });
}

interface SacredIndianMandalaProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  variant?: 'full' | 'minimal' | 'auth';
}

export const SacredIndianMandala = memo(function SacredIndianMandala({
  className = '',
  size = 'lg',
  animate = true,
  variant = 'full',
}: SacredIndianMandalaProps) {
  const sizeMap = { sm: '16rem', md: '28rem', lg: '42rem', xl: '56rem' };
  const width = sizeMap[size];

  return (
    <div
      className={`sacred-mandala-container ${className}`}
      style={{ width, height: width, position: 'relative' }}
      aria-hidden="true"
    >
      {/* Outer ring — slow rotation */}
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full"
        style={animate ? { animation: 'sacred-mandala-spin 90s linear infinite' } : undefined}
      >
        {/* Outermost circles */}
        <circle cx={CENTER} cy={CENTER} r={195} fill="none" stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.4} />
        <circle cx={CENTER} cy={CENTER} r={190} fill="none" stroke={GOLD} strokeWidth={0.4} strokeDasharray="3 6" strokeOpacity={0.3} />
        <circle cx={CENTER} cy={CENTER} r={182} fill="none" stroke={GOLD_BRIGHT} strokeWidth={0.6} strokeOpacity={0.5} />

        {/* Kolam dots — outer ring */}
        {kolamDots(186, 36)}

        {/* Devanagari text ring */}
        {variant !== 'minimal' && devanagariRing(170)}

        {/* Decorative ticks */}
        {Array.from({ length: 72 }, (_, i) => {
          const angle = (i * 5 * Math.PI) / 180;
          const r1 = i % 3 === 0 ? 155 : 158;
          const r2 = 162;
          return (
            <line
              key={`tick-${i}`}
              x1={CENTER + r1 * Math.cos(angle)}
              y1={CENTER + r1 * Math.sin(angle)}
              x2={CENTER + r2 * Math.cos(angle)}
              y2={CENTER + r2 * Math.sin(angle)}
              stroke={GOLD}
              strokeWidth={i % 3 === 0 ? 0.8 : 0.4}
              strokeOpacity={0.4}
            />
          );
        })}
      </svg>

      {/* Middle ring — counter rotation */}
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full"
        style={animate ? { animation: 'sacred-mandala-spin 60s linear infinite reverse' } : undefined}
      >
        <circle cx={CENTER} cy={CENTER} r={145} fill="none" stroke={GOLD} strokeWidth={0.5} strokeOpacity={0.35} />
        <circle cx={CENTER} cy={CENTER} r={120} fill="none" stroke={SAFFRON} strokeWidth={0.6} strokeOpacity={0.3} />

        {/* Lotus petals — outer */}
        {lotusPetals(16, 105, 142, GOLD_BRIGHT, 0.5)}

        {/* Kolam dots — mid ring */}
        {kolamDots(130, 24)}
      </svg>

      {/* Inner ring — slow rotation */}
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full"
        style={animate ? { animation: 'sacred-mandala-spin 45s linear infinite' } : undefined}
      >
        {/* Inner lotus petals */}
        {lotusPetals(12, 55, 98, LOTUS_PINK, 0.4)}

        {/* Sri Yantra triangles */}
        {variant === 'full' && sriYantraTriangles()}

        {/* Inner circles */}
        <circle cx={CENTER} cy={CENTER} r={50} fill="none" stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.5} />
        <circle cx={CENTER} cy={CENTER} r={42} fill="none" stroke={SAFFRON} strokeWidth={0.5} strokeDasharray="2 4" strokeOpacity={0.4} />

        {/* Kolam dots — inner */}
        {kolamDots(46, 12)}

        {/* Bindu — center point */}
        <circle cx={CENTER} cy={CENTER} r={4} fill={GOLD_BRIGHT} fillOpacity={0.6} />
        <circle cx={CENTER} cy={CENTER} r={2} fill={SAFFRON} fillOpacity={0.8} />
      </svg>

      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at center, hsl(42 78% 50% / 0.08) 0%, transparent 50%)`,
          animation: animate ? 'sacred-pulse-glow 6s ease-in-out infinite' : undefined,
        }}
      />
    </div>
  );
});

export default SacredIndianMandala;
