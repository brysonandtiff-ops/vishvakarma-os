import type { FurnitureItem, LandscapeElement, Point2D } from '@/types';
import { FABRIC, FABRIC_LIGHT, GOLD_MUTED, INK, WOOD, WOOD_DARK, WOOD_LIGHT, CHIP_FILL } from '@/core/sceneDrawingTokens';
import { drawPatternOverlay2D } from '@/core/texturePatterns';

// ---------------------------------------------------------------------------
// Furniture catalog
// ---------------------------------------------------------------------------

export const FURNITURE_PRESETS = [
  { type: 'bed', label: 'Bed', width: 140, depth: 200 },
  { type: 'sofa', label: 'Sofa', width: 180, depth: 90 },
  { type: 'chair', label: 'Chair', width: 50, depth: 50 },
  { type: 'table', label: 'Table', width: 120, depth: 80 },
  { type: 'desk', label: 'Desk', width: 140, depth: 70 },
  { type: 'wardrobe', label: 'Wardrobe', width: 120, depth: 60 },
  { type: 'dining_table', label: 'Dining Table', width: 160, depth: 90 },
  { type: 'nightstand', label: 'Nightstand', width: 50, depth: 40 },
  { type: 'column', label: 'Column', width: 40, depth: 40 },
] as const;

export type FurnitureType = (typeof FURNITURE_PRESETS)[number]['type'];

export function getFurnitureDefaults(type: string): { width: number; depth: number; label: string } {
  const preset = FURNITURE_PRESETS.find((entry) => entry.type === type);
  if (preset) {
    return { width: preset.width, depth: preset.depth, label: preset.label };
  }
  return { width: 80, depth: 60, label: type.charAt(0).toUpperCase() + type.slice(1) };
}

function overlayWood(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  drawPatternOverlay2D(ctx, 'wood', x, y, w, h, 0.28);
}

function overlayFabric(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  drawPatternOverlay2D(ctx, 'fabric', x, y, w, h, 0.22);
}

function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = WOOD_DARK) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

function drawFurnitureSilhouette(ctx: CanvasRenderingContext2D, type: string, hw: number, hd: number) {
  switch (type) {
    case 'bed': {
      drawRect(ctx, -hw, -hd, hw * 2, hd * 2, 'rgba(92, 64, 51, 0.35)');
      drawRect(ctx, -hw, -hd, hw * 2, hd * 0.22, WOOD_DARK);
      ctx.fillStyle = FABRIC_LIGHT;
      ctx.fillRect(-hw + 4, -hd + hd * 0.25, hw * 2 - 8, hd * 1.5);
      ctx.strokeStyle = WOOD;
      ctx.strokeRect(-hw + 4, -hd + hd * 0.25, hw * 2 - 8, hd * 1.5);
      overlayWood(ctx, -hw, -hd, hw * 2, hd * 0.22);
      overlayFabric(ctx, -hw + 4, -hd + hd * 0.25, hw * 2 - 8, hd * 1.5);
      break;
    }
    case 'sofa': {
      drawRect(ctx, -hw, -hd, hw * 2, hd * 2, 'rgba(92, 64, 51, 0.35)');
      ctx.fillStyle = FABRIC;
      ctx.fillRect(-hw + 6, -hd + 4, hw * 2 - 12, hd * 1.4);
      ctx.fillStyle = FABRIC_LIGHT;
      ctx.fillRect(-hw + 4, -hd + 2, hw * 2 - 8, hd * 0.35);
      ctx.fillRect(-hw + 2, -hd + 4, hw * 0.28, hd * 1.35);
      ctx.fillRect(hw - hw * 0.28 - 2, -hd + 4, hw * 0.28, hd * 1.35);
      ctx.strokeStyle = WOOD;
      ctx.strokeRect(-hw + 4, -hd + 2, hw * 2 - 8, hd * 1.75);
      overlayFabric(ctx, -hw + 4, -hd + 2, hw * 2 - 8, hd * 1.75);
      break;
    }
    case 'chair': {
      drawRect(ctx, -hw, -hd, hw * 2, hd * 2, 'rgba(92, 64, 51, 0.2)');
      ctx.fillStyle = WOOD_LIGHT;
      ctx.fillRect(-hw + 3, -hd + 3, hw * 2 - 6, hd * 2 - 6);
      ctx.fillStyle = FABRIC;
      ctx.fillRect(-hw + 5, -hd + 5, hw * 2 - 10, hd * 0.55);
      ctx.fillRect(-hw + 5, -hd + 5, hw * 0.35, hd * 1.5);
      ctx.strokeStyle = WOOD;
      ctx.strokeRect(-hw + 3, -hd + 3, hw * 2 - 6, hd * 2 - 6);
      overlayWood(ctx, -hw + 3, -hd + 3, hw * 2 - 6, hd * 0.45);
      overlayFabric(ctx, -hw + 5, -hd + 5, hw * 2 - 10, hd * 0.55);
      break;
    }
    case 'table':
    case 'dining_table': {
      drawRect(ctx, -hw, -hd, hw * 2, hd * 2, 'rgba(92, 64, 51, 0.2)');
      ctx.fillStyle = WOOD_LIGHT;
      ctx.fillRect(-hw + 2, -hd + 2, hw * 2 - 4, hd * 2 - 4);
      ctx.strokeStyle = WOOD;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-hw + 2, -hd + 2, hw * 2 - 4, hd * 2 - 4);
      overlayWood(ctx, -hw + 2, -hd + 2, hw * 2 - 4, hd * 2 - 4);
      const legInset = type === 'dining_table' ? 8 : 6;
      for (const [lx, ly] of [[-hw + legInset, -hd + legInset], [hw - legInset, -hd + legInset], [-hw + legInset, hd - legInset], [hw - legInset, hd - legInset]]) {
        ctx.fillStyle = WOOD_DARK;
        ctx.fillRect(lx - 3, ly - 3, 6, 6);
      }
      if (type === 'dining_table') {
        ctx.fillRect(-3, -hd + legInset - 3, 6, 6);
        ctx.fillRect(-3, hd - legInset - 3, 6, 6);
      }
      break;
    }
    case 'desk': {
      drawRect(ctx, -hw, -hd, hw * 2, hd * 2, 'rgba(92, 64, 51, 0.2)');
      ctx.fillStyle = WOOD_LIGHT;
      ctx.fillRect(-hw + 2, -hd + 2, hw * 2 - 4, hd * 2 - 4);
      ctx.fillStyle = WOOD;
      ctx.fillRect(-hw + 6, -hd + hd * 0.35, hw * 0.55, hd * 0.55);
      ctx.strokeStyle = WOOD_DARK;
      ctx.strokeRect(-hw + 2, -hd + 2, hw * 2 - 4, hd * 2 - 4);
      overlayWood(ctx, -hw + 2, -hd + 2, hw * 2 - 4, hd * 2 - 4);
      break;
    }
    case 'wardrobe': {
      drawRect(ctx, -hw, -hd, hw * 2, hd * 2, 'rgba(92, 64, 51, 0.35)');
      ctx.fillStyle = WOOD;
      ctx.fillRect(-hw + 3, -hd + 3, hw * 2 - 6, hd * 2 - 6);
      ctx.strokeStyle = WOOD_DARK;
      ctx.beginPath();
      ctx.moveTo(0, -hd + 3);
      ctx.lineTo(0, hd - 3);
      ctx.stroke();
      ctx.fillStyle = WOOD_LIGHT;
      ctx.beginPath();
      ctx.arc(-hw * 0.25, 0, 3, 0, Math.PI * 2);
      ctx.arc(hw * 0.25, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      overlayWood(ctx, -hw + 3, -hd + 3, hw * 2 - 6, hd * 2 - 6);
      break;
    }
    case 'nightstand': {
      drawRect(ctx, -hw, -hd, hw * 2, hd * 2, 'rgba(92, 64, 51, 0.35)');
      ctx.fillStyle = WOOD;
      ctx.fillRect(-hw + 2, -hd + 2, hw * 2 - 4, hd * 2 - 4);
      ctx.strokeStyle = WOOD_DARK;
      ctx.beginPath();
      ctx.moveTo(-hw + 4, 0);
      ctx.lineTo(hw - 4, 0);
      ctx.stroke();
      ctx.fillStyle = WOOD_LIGHT;
      ctx.beginPath();
      ctx.arc(hw * 0.35, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      overlayWood(ctx, -hw + 2, -hd + 2, hw * 2 - 4, hd * 2 - 4);
      break;
    }
    case 'column': {
      ctx.fillStyle = 'rgba(44, 44, 44, 0.12)';
      ctx.beginPath();
      ctx.arc(0, 0, hw, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, hw - 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = GOLD_MUTED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, hw * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = CHIP_FILL;
      ctx.beginPath();
      ctx.arc(0, 0, hw * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      drawRect(ctx, -hw, -hd, hw * 2, hd * 2, 'rgba(92, 64, 51, 0.35)');
    }
  }
}

export function drawFurniture2D(
  ctx: CanvasRenderingContext2D,
  item: FurnitureItem,
  position: Point2D,
  highlighted = false,
) {
  const defaults = getFurnitureDefaults(item.type);
  const width = item.width ?? defaults.width;
  const depth = item.depth ?? defaults.depth;
  const hw = width / 2;
  const hd = depth / 2;

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(((item.rotation ?? 0) * Math.PI) / 180);

  if (highlighted) {
    ctx.strokeStyle = '#B8941F';
    ctx.lineWidth = 2;
    ctx.strokeRect(-hw - 3, -hd - 3, width + 6, depth + 6);
  }

  drawFurnitureSilhouette(ctx, item.type, hw, hd);
  ctx.restore();
}

/** 2D staircase run symbol — direction in degrees (0 = east). */
export function drawStair2D(
  ctx: CanvasRenderingContext2D,
  position: Point2D,
  direction = 0,
  highlighted = false,
) {
  const width = 80;
  const depth = 48;
  const hw = width / 2;
  const hd = depth / 2;

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate((direction * Math.PI) / 180);

  if (highlighted) {
    ctx.strokeStyle = '#B8941F';
    ctx.lineWidth = 2;
    ctx.strokeRect(-hw - 3, -hd - 3, width + 6, depth + 6);
  }

  ctx.fillStyle = 'rgba(44, 44, 44, 0.08)';
  ctx.fillRect(-hw, -hd, width, depth);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-hw, -hd, width, depth);

  const treadCount = 5;
  const treadStep = depth / treadCount;
  ctx.strokeStyle = GOLD_MUTED;
  ctx.lineWidth = 1;
  for (let i = 1; i < treadCount; i += 1) {
    const y = -hd + i * treadStep;
    ctx.beginPath();
    ctx.moveTo(-hw, y);
    ctx.lineTo(hw, y);
    ctx.stroke();
  }

  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(hw - 6, -hd + 4);
  ctx.lineTo(hw - 2, 0);
  ctx.lineTo(hw - 6, hd - 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Landscape catalog
// ---------------------------------------------------------------------------

export const LANDSCAPE_TYPES = ['tree', 'pine', 'shrub', 'flower', 'rock', 'path', 'water'] as const;

export type LandscapeType = (typeof LANDSCAPE_TYPES)[number];

export function getLandscapeDefaults(type: string): { width: number; depth: number; label: string } {
  switch (type) {
    case 'tree':
      return { width: 28, depth: 28, label: 'Tree' };
    case 'pine':
      return { width: 24, depth: 24, label: 'Pine' };
    case 'shrub':
      return { width: 20, depth: 20, label: 'Shrub' };
    case 'flower':
      return { width: 16, depth: 16, label: 'Flower' };
    case 'rock':
      return { width: 24, depth: 18, label: 'Rock' };
    case 'path':
      return { width: 32, depth: 12, label: 'Path' };
    case 'water':
      return { width: 80, depth: 60, label: 'Water' };
    default:
      return { width: 20, depth: 20, label: type.charAt(0).toUpperCase() + type.slice(1) };
  }
}

export function hashIdToRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return ((hash % 360) * Math.PI) / 180;
}

export function canvasToWorld(point: Point2D) {
  return {
    x: (point.x - 600) / 100,
    z: (point.y - 400) / 100,
  };
}

export function pxToM(value: number) {
  return value / 100;
}

function drawTree2D(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y - 4, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(34, 120, 60, 0.55)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 6, y - 6, 8, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 2, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(46, 125, 50, 0.45)';
  ctx.fill();
  ctx.fillStyle = '#5c3d1e';
  ctx.fillRect(x - 3, y + 8, 6, 10);
  drawPatternOverlay2D(ctx, 'leaf', x - 14, y - 18, 28, 24, 0.3);
}

function drawPine2D(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x - 12, y + 6);
  ctx.lineTo(x + 12, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x - 9, y + 10);
  ctx.lineTo(x + 9, y + 10);
  ctx.closePath();
  ctx.fillStyle = '#388e3c';
  ctx.fill();
  ctx.fillStyle = '#5c3d1e';
  ctx.fillRect(x - 2.5, y + 10, 5, 8);
}

function drawShrub2D(ctx: CanvasRenderingContext2D, x: number, y: number) {
  for (const [ox, oy, r] of [[0, 0, 10], [-6, 3, 7], [6, 2, 8]] as const) {
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(46, 125, 50, 0.5)';
    ctx.fill();
    drawPatternOverlay2D(ctx, 'leaf', x + ox - r, y + oy - r, r * 2, r * 2, 0.25);
  }
}

function drawFlower2D(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#5c3d1e';
  ctx.fillRect(x - 1, y, 2, 8);
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * 6, y - 4 + Math.sin(angle) * 6, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? '#e91e63' : '#f48fb1';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y - 4, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffeb3b';
  ctx.fill();
}

function drawRock2D(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(120, 113, 108, 0.65)';
  ctx.fill();
  ctx.strokeStyle = '#57534e';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  drawPatternOverlay2D(ctx, 'stone', x - w / 2, y - h / 2, w, h, 0.3);
}

function drawPath2D(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 4;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x + w / 2, y);
  ctx.stroke();
  ctx.setLineDash([]);
  drawPatternOverlay2D(ctx, 'stone', x - w / 2, y - 6, w, 12, 0.35);
}

function drawWater2D(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(26, 107, 175, 0.45)';
  ctx.fill();
  ctx.strokeStyle = '#1565c0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x, y + i * 6, w * 0.3, 3, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  drawPatternOverlay2D(ctx, 'waterNormal', x - w / 2, y - h / 2, w, h, 0.18);
}

export function drawLandscape2D(ctx: CanvasRenderingContext2D, element: LandscapeElement) {
  const defaults = getLandscapeDefaults(element.type);
  const width = element.width ?? defaults.width;
  const depth = element.depth ?? defaults.depth;
  const { x, y } = element.position;
  const rotation = element.rotation !== undefined ? (element.rotation * Math.PI) / 180 : hashIdToRotation(element.id);

  switch (element.type) {
    case 'tree':
      drawTree2D(ctx, x, y);
      break;
    case 'pine':
      drawPine2D(ctx, x, y);
      break;
    case 'shrub':
      drawShrub2D(ctx, x, y);
      break;
    case 'flower':
      drawFlower2D(ctx, x, y);
      break;
    case 'rock':
      drawRock2D(ctx, x, y, width, depth, rotation);
      break;
    case 'path':
      drawPath2D(ctx, x, y, width);
      break;
    case 'water':
      drawWater2D(ctx, x, y, width, depth);
      break;
    default:
      drawShrub2D(ctx, x, y);
  }
}
