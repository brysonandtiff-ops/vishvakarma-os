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

const DEPTH_VALUES = [0.6, 1, 1.6] as const;

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

type ColorTier = 'gold' | 'ember' | 'bright';

const TIER_RGB: Record<ColorTier, string> = {
  gold: '214, 178, 94',
  ember: '235, 200, 120',
  bright: '255, 240, 200',
};

type GlyphDrop = {
  x: number;
  y: number;
  baseX: number;
  speed: number;
  char: string;
  opacity: number;
  size: number;
  driftAmp: number;
  phase: number;
  rotation: number;
  tier: ColorTier;
  depth: number;
};

type MantraStream = {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  charSpacing: number;
  fontSize: number;
  baseOpacity: number;
  laneIndex: number;
};

type EmberParticle = {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  phase: number;
  driftAmp: number;
};

export type Preset = 'auth' | 'boot' | 'marketing';

type Props = {
  density?: number;
  speedMin?: number;
  speedMax?: number;
  opacity?: number;
  glow?: boolean;
  className?: string;
  preset?: Preset;
};

const PRESET_DEFAULTS: Record<
  Preset,
  {
    density: number;
    opacity: number;
    streamCount: number;
    trailFade: number;
    speedMin: number;
    speedMax: number;
    trailBg: string;
    vignetteCenter: number;
    emberCount: number;
  }
> = {
  auth: {
    density: 120,
    opacity: 0.17,
    streamCount: 9,
    trailFade: 0.1,
    speedMin: 0.3,
    speedMax: 1.4,
    trailBg: '0, 0, 0',
    vignetteCenter: 0.48,
    emberCount: 12,
  },
  boot: {
    density: 90,
    opacity: 0.1,
    streamCount: 6,
    trailFade: 0.12,
    speedMin: 0.25,
    speedMax: 1.1,
    trailBg: '11, 15, 10',
    vignetteCenter: 0.52,
    emberCount: 8,
  },
  marketing: {
    density: 85,
    opacity: 0.14,
    streamCount: 7,
    trailFade: 0.1,
    speedMin: 0.25,
    speedMax: 1.0,
    trailBg: '6, 6, 6',
    vignetteCenter: 0.62,
    emberCount: 10,
  },
};

function resolveAdaptiveDensity(explicitDensity?: number): number {
  if (explicitDensity !== undefined) {
    return explicitDensity;
  }

  const isMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
  const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 4) : 4;

  if (isMobile) return 80;
  if (cores >= 8) return 160;
  return 120;
}

function pickTier(): ColorTier {
  const roll = Math.random();
  if (roll < 0.05) return 'bright';
  if (roll < 0.3) return 'ember';
  return 'gold';
}

function pickDepth(): number {
  return DEPTH_VALUES[Math.floor(Math.random() * DEPTH_VALUES.length)];
}

function streamOpacityEnvelope(charY: number, height: number): number {
  const topFade = Math.min(1, (charY + 40) / (height * 0.12));
  const bottomFade = Math.min(1, (height - charY) / (height * 0.15));
  return Math.max(0, Math.min(topFade, bottomFade));
}

export default function SanskritRainBackground({
  density: densityProp,
  speedMin: speedMinProp,
  speedMax: speedMaxProp,
  opacity: opacityProp,
  glow = true,
  className = '',
  preset,
}: Props) {
  const presetDefaults = preset ? PRESET_DEFAULTS[preset] : null;
  const density = densityProp ?? presetDefaults?.density ?? resolveAdaptiveDensity();
  const opacity = opacityProp ?? presetDefaults?.opacity ?? 0.12;
  const speedMin = speedMinProp ?? presetDefaults?.speedMin ?? 0.3;
  const speedMax = speedMaxProp ?? presetDefaults?.speedMax ?? 1.4;
  const trailFade = presetDefaults?.trailFade ?? 0.14;
  const streamCount = presetDefaults?.streamCount ?? 6;
  const trailBg = presetDefaults?.trailBg ?? '11, 15, 10';
  const vignetteCenter = presetDefaults?.vignetteCenter ?? 0.55;
  const emberCount = presetDefaults?.emberCount ?? 8;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropsRef = useRef<GlyphDrop[]>([]);
  const streamsRef = useRef<MantraStream[]>([]);
  const embersRef = useRef<EmberParticle[]>([]);
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const visibleRef = useRef(true);

  const glyphPool = useMemo(() => GLYPHS, []);
  const mantraPool = useMemo(
    () => (preset === 'boot' ? BOOT_MANTRAS : SANSKRIT_MATRIX_COLUMNS),
    [preset]
  );

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
    let time = 0;

    const randGlyph = () =>
      glyphPool[Math.floor(Math.random() * glyphPool.length)];

    const createDrop = (w: number, h: number): GlyphDrop => {
      const baseX = Math.random() * w;
      const depth = pickDepth();
      const baseSpeed = speedMin + Math.random() * (speedMax - speedMin);
      return {
        x: baseX,
        y: Math.random() * h,
        baseX,
        speed: baseSpeed * depth,
        char: randGlyph(),
        opacity: Math.random() * opacity * (0.5 + depth * 0.35),
        size: (14 + Math.random() * 18) * depth,
        driftAmp: 0.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        rotation: (Math.random() - 0.5) * 0.3,
        tier: pickTier(),
        depth,
      };
    };

    const resetDrop = (d: GlyphDrop, w: number) => {
      const depth = pickDepth();
      d.baseX = Math.random() * w;
      d.x = d.baseX;
      d.y = -20;
      d.depth = depth;
      d.speed = (speedMin + Math.random() * (speedMax - speedMin)) * depth;
      d.char = randGlyph();
      d.opacity = Math.random() * opacity * (0.5 + depth * 0.35);
      d.size = (14 + Math.random() * 18) * depth;
      d.tier = pickTier();
    };

    const createStreams = (w: number, h: number, count: number): MantraStream[] => {
      const isBoot = preset === 'boot';
      const isMarketing = preset === 'marketing';
      const laneSpread = isBoot ? 15 : isMarketing ? 18 : 12.5;
      const laneStart = isBoot ? 8 : isMarketing ? 6 : 5;

      return Array.from({ length: count }, (_, index) => {
        const lanePct = laneStart + index * laneSpread;
        const mantra = mantraPool[index % mantraPool.length];
        const chars = [...mantra].filter((c) => c.trim());
        const charSpacing = isBoot ? 18 : isMarketing ? 19 : 20;
        return {
          x: (lanePct / 100) * w,
          y: -chars.length * charSpacing - Math.random() * h * 0.4,
          speed: 0.35 + Math.random() * (isBoot ? 0.25 : isMarketing ? 0.2 : 0.35),
          chars,
          charSpacing,
          fontSize: isBoot ? 11.5 : isMarketing ? 13.5 : 13,
          baseOpacity: isBoot ? 0.38 : isMarketing ? 0.58 : 0.52,
          laneIndex: index,
        };
      });
    };

    const resetStream = (s: MantraStream, h: number) => {
      s.y = -s.chars.length * s.charSpacing - Math.random() * h * 0.3;
    };

    const createEmber = (w: number, h: number): EmberParticle => ({
      x: Math.random() * w,
      y: h + Math.random() * 40,
      speed: 0.15 + Math.random() * 0.35,
      size: 2 + Math.random() * 4,
      opacity: 0.2 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      driftAmp: 0.3 + Math.random() * 1.2,
    });

    const resetEmber = (e: EmberParticle, w: number, h: number) => {
      e.x = Math.random() * w;
      e.y = h + Math.random() * 30;
      e.speed = 0.15 + Math.random() * 0.35;
      e.opacity = 0.2 + Math.random() * 0.35;
    };

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

      const effectiveStreamCount = reducedMotionRef.current
        ? Math.min(3, streamCount)
        : mobileQuery.matches
          ? Math.max(2, streamCount - 2)
          : streamCount;

      const effectiveEmberCount = reducedMotionRef.current
        ? 0
        : mobileQuery.matches
          ? Math.max(3, Math.round(emberCount * 0.6))
          : emberCount;

      dropsRef.current = Array.from({ length: effectiveDensity }, () =>
        createDrop(displayWidth, displayHeight)
      );
      streamsRef.current = createStreams(displayWidth, displayHeight, effectiveStreamCount);
      embersRef.current = Array.from({ length: effectiveEmberCount }, () =>
        createEmber(displayWidth, displayHeight)
      );

      if (reducedMotionRef.current) {
        draw();
      }
    };

    const applyGlow = (tier: ColorTier) => {
      if (!glow) {
        ctx.shadowBlur = 0;
        return;
      }
      ctx.shadowColor = '#D6B25E';
      ctx.shadowBlur = tier === 'bright' ? 18 : tier === 'ember' ? 14 : 10;
    };

    const drawGlyph = (d: GlyphDrop, alpha: number) => {
      const rgb = TIER_RGB[d.tier];
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);
      ctx.font = `${d.size}px ${FONT_FAMILY}`;
      ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
      applyGlow(d.tier);
      ctx.fillText(d.char, 0, 0);
      ctx.restore();
    };

    const drawStreams = () => {
      const isBoot = preset === 'boot';
      const isMarketing = preset === 'marketing';

      streamsRef.current.forEach((stream) => {
        const shimmerX = Math.sin(time * 0.0008 + stream.laneIndex) * (isMarketing ? 9 : 6);
        const drawX = stream.x + shimmerX;

        stream.chars.forEach((char, index) => {
          const charY = stream.y + index * stream.charSpacing;
          if (charY < -stream.charSpacing || charY > displayHeight + stream.charSpacing) {
            return;
          }

          const envelope = streamOpacityEnvelope(charY, displayHeight);
          const tier: ColorTier = index % 3 === 2 ? 'ember' : 'gold';
          const rgb = tier === 'ember' && !isBoot ? TIER_RGB.ember : TIER_RGB.gold;
          const alpha = stream.baseOpacity * envelope * (tier === 'ember' ? 1.15 : 1);

          ctx.save();
          ctx.font = `${stream.fontSize}px ${FONT_FAMILY}`;
          ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
          applyGlow(tier);
          ctx.fillText(char, drawX, charY);
          ctx.restore();
        });
      });
    };

    const drawEmbers = () => {
      for (const ember of embersRef.current) {
        const fadeTop = Math.min(1, (displayHeight - ember.y) / (displayHeight * 0.35));
        const pulse = 0.65 + 0.35 * Math.sin(time * 0.003 + ember.phase);
        const alpha = ember.opacity * fadeTop * pulse;
        if (alpha <= 0.02) continue;

        ctx.save();
        ctx.beginPath();
        ctx.arc(
          ember.x + Math.sin(time * 0.0012 + ember.phase) * ember.driftAmp,
          ember.y,
          ember.size,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 220, 140, ${alpha})`;
        if (glow) {
          ctx.shadowBlur = 14;
          ctx.shadowColor = '#D6B25E';
        }
        ctx.fill();
        ctx.restore();
      }
    };

    const drawVignette = () => {
      const cx = displayWidth / 2;
      const cy = displayHeight / 2;
      const maxR = Math.max(displayWidth, displayHeight) * 0.72;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, `rgba(${trailBg}, ${vignetteCenter})`);
      grad.addColorStop(0.55, `rgba(${trailBg}, 0.08)`);
      grad.addColorStop(1, `rgba(${trailBg}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    };

    const fadeTrail = () => {
      const fade = mobileQuery.matches ? 0.18 : trailFade;
      ctx.fillStyle = `rgba(${trailBg}, ${fade})`;
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    };

    const update = () => {
      if (reducedMotionRef.current) return;

      for (const d of dropsRef.current) {
        d.y += d.speed;
        d.x = d.baseX + Math.sin(time * 0.001 + d.phase) * d.driftAmp;

        if (d.y > displayHeight + 20) {
          resetDrop(d, displayWidth);
        }
      }

      for (const stream of streamsRef.current) {
        stream.y += stream.speed;
        const streamHeight = stream.chars.length * stream.charSpacing;
        if (stream.y > displayHeight + streamHeight) {
          resetStream(stream, displayHeight);
        }
      }

      for (const ember of embersRef.current) {
        ember.y -= ember.speed;
        if (ember.y < -10) {
          resetEmber(ember, displayWidth, displayHeight);
        }
      }
    };

    const draw = () => {
      if (reducedMotionRef.current) {
        ctx.clearRect(0, 0, displayWidth, displayHeight);
      } else {
        fadeTrail();
      }

      drawStreams();

      for (const d of dropsRef.current) {
        const pulse = reducedMotionRef.current
          ? 1
          : 0.7 + 0.3 * Math.sin(time * 0.002 + d.phase);
        drawGlyph(d, d.opacity * pulse);
      }

      if (!reducedMotionRef.current) {
        drawEmbers();
        drawVignette();
      }
    };

    const loop = (now: number) => {
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      time = now;
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

    const onVisibilityChange = () => {
      visibleRef.current = !document.hidden;
    };

    visibleRef.current = !document.hidden;
    resize();
    rafRef.current = requestAnimationFrame(loop);

    window.addEventListener('resize', resize);
    motionQuery.addEventListener('change', onMotionChange);
    mobileQuery.addEventListener('change', resize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('resize', resize);
      motionQuery.removeEventListener('change', onMotionChange);
      mobileQuery.removeEventListener('change', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    density,
    speedMin,
    speedMax,
    opacity,
    glow,
    glyphPool,
    mantraPool,
    preset,
    streamCount,
    trailFade,
    trailBg,
    vignetteCenter,
    emberCount,
  ]);

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
