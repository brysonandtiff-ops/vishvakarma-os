import { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  size: number;
  phase: number;
  twinkleSpeed: number;
  baseOpacity: number;
  flare: boolean;
  tier: 'white' | 'gold';
};

type NebulaBlob = {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  phase: number;
  driftSpeed: number;
  breatheSpeed: number;
  opacity: number;
  warm: boolean;
};

type PlasmaWisp = {
  y: number;
  amplitude: number;
  phase: number;
  speed: number;
  opacity: number;
  width: number;
};

const GOLD_RGB = '214, 178, 94';
const EMBER_RGB = '180, 100, 40';
const WHITE_RGB = '255, 248, 230';

function createStars(count: number, w: number, h: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() < 0.15 ? 1.8 + Math.random() * 1.2 : 0.6 + Math.random() * 1.1,
    phase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.001 + Math.random() * 0.003,
    baseOpacity: 0.25 + Math.random() * 0.55,
    flare: Math.random() < 0.08,
    tier: Math.random() < 0.35 ? 'gold' : 'white',
  }));
}

function createNebulae(w: number, h: number): NebulaBlob[] {
  const cx = w / 2;
  const cy = h / 2;
  return [
    { x: cx * 0.55, y: cy * 0.72, radiusX: w * 0.28, radiusY: h * 0.22, phase: 0, driftSpeed: 0.00008, breatheSpeed: 0.00035, opacity: 0.1, warm: false },
    { x: cx * 1.35, y: cy * 0.55, radiusX: w * 0.24, radiusY: h * 0.18, phase: 1.2, driftSpeed: 0.00006, breatheSpeed: 0.00028, opacity: 0.08, warm: true },
    { x: cx, y: cy * 1.15, radiusX: w * 0.32, radiusY: h * 0.2, phase: 2.4, driftSpeed: 0.00005, breatheSpeed: 0.00022, opacity: 0.09, warm: true },
    { x: cx * 0.85, y: cy * 0.35, radiusX: w * 0.2, radiusY: h * 0.16, phase: 3.8, driftSpeed: 0.00007, breatheSpeed: 0.0003, opacity: 0.07, warm: false },
  ];
}

function createWisps(h: number): PlasmaWisp[] {
  const cy = h / 2;
  return [
    { y: cy - h * 0.06, amplitude: h * 0.04, phase: 0, speed: 0.0004, opacity: 0.14, width: h * 0.35 },
    { y: cy + h * 0.02, amplitude: h * 0.03, phase: 1.8, speed: 0.00032, opacity: 0.1, width: h * 0.28 },
    { y: cy - h * 0.12, amplitude: h * 0.025, phase: 3.2, speed: 0.00038, opacity: 0.08, width: h * 0.22 },
  ];
}

function drawStarFlare(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number,
  rgb: string,
) {
  ctx.save();
  ctx.strokeStyle = `rgba(${rgb}, ${alpha * 0.45})`;
  ctx.lineWidth = 0.6;
  const len = size * 4;
  ctx.beginPath();
  ctx.moveTo(x - len, y);
  ctx.lineTo(x + len, y);
  ctx.moveTo(x, y - len);
  ctx.lineTo(x, y + len);
  ctx.stroke();
  ctx.restore();
}

interface SacredCosmicLayerProps {
  className?: string;
}

export function SacredCosmicLayer({ className = '' }: SacredCosmicLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const nebulaeRef = useRef<NebulaBlob[]>([]);
  const wispsRef = useRef<PlasmaWisp[]>([]);
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const visibleRef = useRef(true);

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

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      displayWidth = canvas.clientWidth;
      displayHeight = canvas.clientHeight;

      canvas.width = Math.floor(displayWidth * dpr);
      canvas.height = Math.floor(displayHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = reducedMotionRef.current
        ? 40
        : mobileQuery.matches
          ? 60
          : 120;

      starsRef.current = createStars(starCount, displayWidth, displayHeight);
      nebulaeRef.current = createNebulae(displayWidth, displayHeight);
      wispsRef.current = createWisps(displayHeight);
    };

    const drawRadialMask = () => {
      const cx = displayWidth / 2;
      const cy = displayHeight / 2;
      const maxR = Math.max(displayWidth, displayHeight) * 0.78;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, 'rgba(6, 6, 6, 0.15)');
      grad.addColorStop(0.42, 'rgba(6, 6, 6, 0.55)');
      grad.addColorStop(0.72, 'rgba(6, 6, 6, 0.82)');
      grad.addColorStop(1, 'rgba(6, 6, 6, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    };

    const drawNebulae = () => {
      for (const blob of nebulaeRef.current) {
        const breathe = reducedMotionRef.current
          ? 1
          : 0.88 + 0.12 * Math.sin(time * blob.breatheSpeed + blob.phase);
        const driftX = reducedMotionRef.current
          ? 0
          : Math.sin(time * blob.driftSpeed + blob.phase) * displayWidth * 0.018;
        const driftY = reducedMotionRef.current
          ? 0
          : Math.cos(time * blob.driftSpeed * 0.85 + blob.phase) * displayHeight * 0.012;

        const x = blob.x + driftX;
        const y = blob.y + driftY;
        const rx = blob.radiusX * breathe;
        const ry = blob.radiusY * breathe;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
        const rgb = blob.warm ? EMBER_RGB : GOLD_RGB;
        grad.addColorStop(0, `rgba(${rgb}, ${blob.opacity})`);
        grad.addColorStop(0.45, `rgba(${rgb}, ${blob.opacity * 0.55})`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const drawWisps = () => {
      const cx = displayWidth / 2;
      for (const wisp of wispsRef.current) {
        const wave = reducedMotionRef.current
          ? 0
          : Math.sin(time * wisp.speed + wisp.phase) * wisp.amplitude;
        const y = wisp.y + wave;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.moveTo(cx - displayWidth * 0.32, y);
        ctx.bezierCurveTo(
          cx - displayWidth * 0.12,
          y - wisp.width * 0.18,
          cx + displayWidth * 0.12,
          y + wisp.width * 0.22,
          cx + displayWidth * 0.32,
          y,
        );
        ctx.strokeStyle = `rgba(${GOLD_RGB}, ${wisp.opacity})`;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `rgba(${GOLD_RGB}, 0.35)`;
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawStars = () => {
      for (const star of starsRef.current) {
        const twinkle = reducedMotionRef.current
          ? 1
          : 0.55 + 0.45 * Math.sin(time * star.twinkleSpeed + star.phase);
        const alpha = star.baseOpacity * twinkle;
        const rgb = star.tier === 'gold' ? GOLD_RGB : WHITE_RGB;

        ctx.save();
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        if (star.size > 1.4) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(${rgb}, 0.5)`;
        }
        ctx.fill();
        ctx.restore();

        if (star.flare && alpha > 0.35) {
          drawStarFlare(ctx, star.x, star.y, star.size, alpha, rgb);
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      drawNebulae();
      drawWisps();
      drawStars();
      drawRadialMask();
    };

    const loop = (now: number) => {
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      time = now;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    const onMotionChange = () => {
      setReducedMotion();
      resize();
      draw();
    };

    const onVisibilityChange = () => {
      visibleRef.current = !document.hidden;
    };

    visibleRef.current = !document.hidden;
    resize();
    draw();
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`vish-sacred-cosmic-canvas ${className}`.trim()}
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
