export const PATTERN_KEYS = [
  'paint',
  'paper',
  'plaster',
  'wood',
  'concrete',
  'marble',
  'tile',
  'metal',
  'grass',
  'stone',
  'fabric',
  'leaf',
  'bark',
  'waterNormal',
] as const;

export type PatternKey = (typeof PATTERN_KEYS)[number];

export const DEFAULT_PATTERN_SIZE = 512;

function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 982451653) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothNoise(x: number, y: number, seed = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x0 + 1, y0, seed);
  const n01 = hash2(x0, y0 + 1, seed);
  const n11 = hash2(x0 + 1, y0 + 1, seed);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(n00, n10, ux), lerp(n01, n11, ux), uy);
}

function fractalNoise(x: number, y: number, seed = 0, octaves = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i += 1) {
    value += smoothNoise(x * frequency, y * frequency, seed + i * 17) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

function rgb(r: number, g: number, b: number) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function drawPaperPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#FDF9F5';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n = fractalNoise(x / 22, y / 22, 14, 4);
      const v = 248 + n * 7;
      ctx.fillStyle = rgb(v, v - 2, v - 6);
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

function drawPaintPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n = fractalNoise(x / 18, y / 18, 1, 4);
      const v = 240 + n * 15;
      ctx.fillStyle = rgb(v, v - 4, v - 10);
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

function drawPlasterPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#f0ebe3';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n = fractalNoise(x / 14, y / 14, 30, 5);
      const v = 235 + n * 18;
      ctx.fillStyle = rgb(v, v - 3, v - 8);
      ctx.fillRect(x, y, 2, 2);
    }
  }
  for (let i = 0; i < 24; i += 1) {
    const x = hash2(i, 0, 31) * size;
    const y = hash2(i, 1, 32) * size;
    ctx.fillStyle = `rgba(180, 170, 155, ${0.04 + hash2(i, 2, 33) * 0.06})`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + hash2(i, 3, 34) * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMarblePattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#e8e4dc';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const vein = Math.sin((x / size) * Math.PI * 6 + fractalNoise(x / 20, y / 20, 40, 3) * 4) * 0.5 + 0.5;
      const n = fractalNoise(x / 12, y / 12, 41, 4);
      const v = 210 + vein * 35 + n * 20;
      ctx.fillStyle = rgb(v, v - 2, v - 6);
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

function drawTilePattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#c8c0b0';
  ctx.fillRect(0, 0, size, size);
  const cell = size / 8;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const n = fractalNoise(col, row, 50, 2);
      const v = 170 + n * 50;
      ctx.fillStyle = rgb(v + 10, v, v - 12);
      ctx.fillRect(col * cell + 2, row * cell + 2, cell - 4, cell - 4);
      ctx.strokeStyle = 'rgba(80, 70, 55, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(col * cell + 1, row * cell + 1, cell - 2, cell - 2);
    }
  }
}

function drawMetalPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#b8860b';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 1) {
    const brush = Math.sin((y / size) * Math.PI * 24) * 0.15 + fractalNoise(0, y / 8, 60, 3) * 0.25;
    const v = 160 + brush * 60;
    ctx.fillStyle = rgb(v + 20, v, v - 40);
    ctx.fillRect(0, y, size, 1);
  }
  for (let x = 0; x < size; x += 4) {
    ctx.strokeStyle = `rgba(255, 220, 140, ${0.06 + hash2(x, 0, 61) * 0.08})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + hash2(x, 1, 62) * 2, size);
    ctx.stroke();
  }
}

function drawWoodPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 1) {
    const wave = Math.sin((y / size) * Math.PI * 8 + fractalNoise(0, y / 12, 2) * 2) * 6;
    const shade = 120 + fractalNoise(wave, y / 8, 3) * 40;
    ctx.fillStyle = rgb(shade + 20, shade, shade - 30);
    ctx.fillRect(0, y, size, 1);
  }
  for (let i = 0; i < 12; i += 1) {
    const x = (i / 12) * size + hash2(i, 0, 4) * 8;
    ctx.strokeStyle = `rgba(60, 40, 20, ${0.08 + hash2(i, 1, 5) * 0.12})`;
    ctx.lineWidth = 1 + hash2(i, 2, 6);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + hash2(i, 3, 7) * 4, size);
    ctx.stroke();
  }
}

function drawConcretePattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#909090';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 3) {
    for (let x = 0; x < size; x += 3) {
      const n = fractalNoise(x / 10, y / 10, 8, 3);
      const v = 110 + n * 50;
      ctx.fillStyle = rgb(v, v, v - 5);
      ctx.fillRect(x, y, 3, 3);
    }
  }
}

function drawGrassPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#3d6b45';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 2; i += 1) {
    const x = hash2(i, 0, 9) * size;
    const y = hash2(i, 1, 10) * size;
    const h = 4 + hash2(i, 2, 11) * 10;
    const angle = -0.4 + hash2(i, 3, 12) * 0.8;
    const green = 80 + hash2(i, 4, 13) * 80;
    ctx.strokeStyle = rgb(30, green, 40);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(angle) * h, y - Math.cos(angle) * h);
    ctx.stroke();
  }
}

function drawStonePattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const cell = row * 8 + col;
      const offset = (row % 2) * (size / 16);
      const x = col * (size / 8) + offset;
      const y = row * (size / 8);
      const n = fractalNoise(col, row, 14, 2);
      const v = 100 + n * 60;
      ctx.fillStyle = rgb(v + 20, v, v - 15);
      ctx.fillRect(x + 1, y + 1, size / 8 - 2, size / 8 - 2);
      ctx.strokeStyle = 'rgba(50, 35, 25, 0.35)';
      ctx.strokeRect(x + 1, y + 1, size / 8 - 2, size / 8 - 2);
      void cell;
    }
  }
}

function drawFabricPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#5a6578';
  ctx.fillRect(0, 0, size, size);
  const step = size / 16;
  for (let i = 0; i <= 16; i += 1) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 + (i % 2) * 0.04})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }
}

function drawLeafPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#2e7d32';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n = fractalNoise(x / 8, y / 8, 20, 3);
      const g = 90 + n * 70;
      ctx.fillStyle = rgb(20, g, 30);
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

function drawBarkPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#5c3d1e';
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 3) {
    const n = fractalNoise(x / 6, 0, 21, 2);
    const shade = 70 + n * 40;
    ctx.fillStyle = rgb(shade + 10, shade - 5, shade - 20);
    ctx.fillRect(x, 0, 2, size);
  }
}

function drawWaterNormalPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const ripple = Math.sin((x / size) * Math.PI * 12 + (y / size) * Math.PI * 8) * 0.5 + 0.5;
      const n = fractalNoise(x / 14, y / 14, 22, 2) * 0.35 + ripple * 0.65;
      const v = 128 + (n - 0.5) * 90;
      ctx.fillStyle = rgb(v, v, 255);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

const DRAWERS: Record<PatternKey, (ctx: CanvasRenderingContext2D, size: number) => void> = {
  paint: drawPaintPattern,
  paper: drawPaperPattern,
  plaster: drawPlasterPattern,
  wood: drawWoodPattern,
  concrete: drawConcretePattern,
  marble: drawMarblePattern,
  tile: drawTilePattern,
  metal: drawMetalPattern,
  grass: drawGrassPattern,
  stone: drawStonePattern,
  fabric: drawFabricPattern,
  leaf: drawLeafPattern,
  bark: drawBarkPattern,
  waterNormal: drawWaterNormalPattern,
};

export function drawPattern(ctx: CanvasRenderingContext2D, key: PatternKey, size = DEFAULT_PATTERN_SIZE) {
  DRAWERS[key](ctx, size);
}

export function createPatternCanvas(key: PatternKey, size = DEFAULT_PATTERN_SIZE): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  drawPattern(ctx, key, size);
  return canvas;
}

/** Height-from-noise normal map for procedural 3D bump when photo normals are unavailable */
export function createProceduralNormalCanvas(key: PatternKey, size = DEFAULT_PATTERN_SIZE): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const heightCanvas = createPatternCanvas(key, size);
  if (!heightCanvas) return null;
  const hCtx = heightCanvas.getContext('2d');
  if (!hCtx) return null;
  const heightData = hCtx.getImageData(0, 0, size, size).data;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const image = ctx.createImageData(size, size);
  const strength = 2.4;

  function heightAt(x: number, y: number): number {
    const cx = ((x % size) + size) % size;
    const cy = ((y % size) + size) % size;
    const idx = (cy * size + cx) * 4;
    return heightData[idx] / 255;
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (heightAt(x + 1, y) - heightAt(x - 1, y)) * strength;
      const dy = (heightAt(x, y + 1) - heightAt(x, y - 1)) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      const idx = (y * size + x) * 4;
      image.data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      image.data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      image.data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      image.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function samplePatternColor(key: PatternKey, x: number, y: number): string {
  const seed = PATTERN_KEYS.indexOf(key) + 1;
  const n = fractalNoise(x / 24, y / 24, seed, 3);
  switch (key) {
    case 'paint':
      return rgb(240 + n * 12, 236 + n * 12, 228 + n * 12);
    case 'plaster':
      return rgb(235 + n * 14, 232 + n * 14, 224 + n * 14);
    case 'marble':
      return rgb(210 + n * 30, 208 + n * 28, 200 + n * 26);
    case 'tile':
      return rgb(170 + n * 40, 165 + n * 38, 155 + n * 35);
    case 'metal':
      return rgb(160 + n * 50, 130 + n * 40, 60 + n * 30);
    case 'paper':
      return rgb(248 + n * 7, 246 + n * 7, 242 + n * 7);
    case 'wood':
      return rgb(140 + n * 40, 100 + n * 30, 50 + n * 20);
    case 'concrete':
      return rgb(110 + n * 50, 110 + n * 50, 105 + n * 50);
    case 'grass':
      return rgb(30 + n * 20, 90 + n * 70, 40 + n * 25);
    case 'stone':
      return rgb(120 + n * 40, 100 + n * 35, 85 + n * 30);
    case 'fabric':
      return rgb(80 + n * 30, 90 + n * 35, 110 + n * 40);
    case 'leaf':
      return rgb(20 + n * 15, 90 + n * 70, 30 + n * 20);
    case 'bark':
      return rgb(80 + n * 30, 55 + n * 20, 25 + n * 15);
    case 'waterNormal':
      return rgb(26 + n * 20, 107 + n * 30, 175 + n * 40);
    default:
      return rgb(128, 128, 128);
  }
}

export function drawPatternOverlay2D(
  ctx: CanvasRenderingContext2D,
  key: PatternKey,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 0.35,
) {
  const step = 3;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let py = y; py < y + height; py += step) {
    for (let px = x; px < x + width; px += step) {
      ctx.fillStyle = samplePatternColor(key, px, py);
      ctx.fillRect(px, py, step - 1, step - 1);
    }
  }
  ctx.restore();
}
