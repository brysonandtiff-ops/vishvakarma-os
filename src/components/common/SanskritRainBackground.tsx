import { useEffect, useMemo, useRef } from 'react';

/**
 * Z-index contract:
 * - SanskritRain canvas: 0
 * - Sacred decorative CSS (yantra, mandala): 0–1
 * - Page content: 10+
 * - Glass panels / sidebar: 10–40
 * - Modals / command palette: 50+
 */

export const SANSKRIT_MATRIX_COLUMNS = [
  'ॐ श्री विश्वकर्मणे नमः',
  'धर्म अर्थ शिल्प विज्ञान',
  'मन्त्र यन्त्र वास्तु रचना',
  'ॐ ह्रीं क्लीं सौः',
  'विद्या कर्म ज्योति रूपम्',
  'स्थिरं सौन्दर्यम् शुभम्',
  'रचना प्रमाणं सुरक्षा',
  'सत्यं शिल्पं प्रकाशः',
] as const;

export const BOOT_MANTRAS = [
  'ॐ विश्वकर्मणे नमः',
  'शिल्पं ज्योतिः प्रमाणम्',
  'रचना सुरक्षा विश्वासः',
  'धर्म वास्तु विज्ञानम्',
  'सत्यं सौन्दर्यम् स्थिरम्',
  'यन्त्र मन्त्र मण्डलम्',
] as const;

const BASE_GLYPHS = [
  'ॐ', 'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ',
  'क', 'ख', 'ग', 'घ', 'ङ',
  'श', 'ष', 'स', 'ह',
  'त्र', 'ज्ञ', 'क्ष',
  '॥',
] as const;

function extractGlyphsFromMantras(mantras: readonly string[]): string[] {
  const chars = new Set<string>();
  for (const mantra of mantras) {
    for (const char of [...mantra]) {
      if (char.trim()) {
        chars.add(char);
      }
    }
  }
  return [...chars];
}

export const GLYPHS = [
  ...BASE_GLYPHS,
  ...extractGlyphsFromMantras(SANSKRIT_MATRIX_COLUMNS),
  ...extractGlyphsFromMantras(BOOT_MANTRAS),
];

const FONT_FAMILY = "'Noto Sans Devanagari', 'IBM Plex Mono', serif";
const GOLD_RGB = '214, 178, 94';

type Drop = {
  x: number;
  y: number;
  speed: number;
  char: string;
  opacity: number;
  size: number;
};

type Preset = 'auth' | 'boot';

type Props = {
  density?: number;
  speedMin?: number;
  speedMax?: number;
  opacity?: number;
  glow?: boolean;
  className?: string;
  preset?: Preset;
};

const PRESET_DEFAULTS: Record<Preset, { density: number; opacity: number }> = {
  auth: { density: 120, opacity: 0.12 },
  boot: { density: 90, opacity: 0.1 },
};

function resolveAdaptiveDensity(explicitDensity?: number): number {
  if (explicitDensity !== undefined) {
    return explicitDensity;
  }

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 4 : 4;

  if (isMobile) return 80;
  if (cores >= 8) return 160;
  return 120;
}

export default function SanskritRainBackground({
  density: densityProp,
  speedMin = 0.2,
  speedMax = 1.2,
  opacity: opacityProp,
  glow = true,
  className = '',
  preset,
}: Props) {
  const presetDefaults = preset ? PRESET_DEFAULTS[preset] : null;
  const density = densityProp ?? presetDefaults?.density ?? resolveAdaptiveDensity();
  const opacity = opacityProp ?? presetDefaults?.opacity ?? 0.12;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropsRef = useRef<Drop[]>([]);
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  const glyphPool = useMemo(() => GLYPHS, []);

  const randGlyph = () =>
    glyphPool[Math.floor(Math.random() * glyphPool.length)];

  const createDrop = (w: number, h: number): Drop => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speed: speedMin + Math.random() * (speedMax - speedMin),
    char: randGlyph(),
    opacity: Math.random() * opacity,
    size: 14 + Math.random() * 18,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 900px)');

    const setReducedMotion = () => {
      reducedMotionRef.current = motionQuery.matches;
    };
    setReducedMotion();

    let displayWidth = 0;
    let displayHeight = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      displayWidth = canvas.clientWidth;
      displayHeight = canvas.clientHeight;

      canvas.width = Math.floor(displayWidth * dpr);
      canvas.height = Math.floor(displayHeight * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const effectiveDensity = reducedMotionRef.current
        ? Math.min(12, density)
        : mobileQuery.matches
          ? Math.round(density * 0.75)
          : density;

      dropsRef.current = Array.from(
        { length: effectiveDensity },
        () => createDrop(displayWidth, displayHeight)
      );

      if (reducedMotionRef.current) {
        draw();
      }
    };

    const update = () => {
      if (reducedMotionRef.current) return;

      const drops = dropsRef.current;
      for (const d of drops) {
        d.y += d.speed;
        if (d.y > displayHeight) {
          d.y = -20;
          d.x = Math.random() * displayWidth;
          d.char = randGlyph();
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      for (const d of dropsRef.current) {
        ctx.font = `${d.size}px ${FONT_FAMILY}`;
        ctx.fillStyle = `rgba(${GOLD_RGB}, ${d.opacity})`;

        if (glow) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#D6B25E';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillText(d.char, d.x, d.y);
      }
    };

    const loop = () => {
      if (!reducedMotionRef.current) {
        update();
      }
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    const onMotionChange = () => {
      setReducedMotion();
      resize();
    };

    resize();
    loop();

    window.addEventListener('resize', resize);
    motionQuery.addEventListener('change', onMotionChange);
    mobileQuery.addEventListener('change', resize);

    return () => {
      window.removeEventListener('resize', resize);
      motionQuery.removeEventListener('change', onMotionChange);
      mobileQuery.removeEventListener('change', resize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [density, speedMin, speedMax, opacity, glow, glyphPool]);

  return (
    <canvas
      ref={canvasRef}
      className={`vish-sanskrit-rain-canvas ${className}`.trim()}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
