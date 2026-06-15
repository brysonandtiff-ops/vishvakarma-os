import type { FixtureItem, MepSymbol } from '@/types';
import {
  CANVAS_FONT_SANS,
  FIXTURE_LABEL,
  FIXTURE_MEP_LABEL,
  FIXTURE_MEP_STROKE,
  FIXTURE_STROKE,
  GOLD,
  GOLD_GLOW,
  GOLD_GLOW_SOFT,
  GOLD_LIGHT,
  GOLD_MUTED,
  MEP_COLORS,
} from '@/core/sceneDrawingTokens';

export function drawMepSymbol2D(
  ctx: CanvasRenderingContext2D,
  symbol: MepSymbol,
  options: { highlighted?: boolean } = {},
) {
  const { x, y } = symbol.position;
  const size = 18;
  const half = size / 2;

  ctx.save();
  ctx.translate(x, y);

  switch (symbol.type) {
    case 'outlet': {
      ctx.beginPath();
      ctx.roundRect(-half, -half, size, size, 3);
      ctx.fillStyle = MEP_COLORS.outlet;
      ctx.fill();
      ctx.strokeStyle = FIXTURE_MEP_STROKE;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.strokeStyle = FIXTURE_MEP_LABEL;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(-4, 2);
      ctx.moveTo(4, -2);
      ctx.lineTo(4, 2);
      ctx.stroke();
      break;
    }
    case 'switch': {
      ctx.beginPath();
      ctx.roundRect(-half, -half, size, size, 3);
      ctx.fillStyle = MEP_COLORS.switch;
      ctx.fill();
      ctx.strokeStyle = FIXTURE_MEP_STROKE;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.fillStyle = FIXTURE_MEP_LABEL;
      ctx.fillRect(-3, -5, 6, 10);
      ctx.fillStyle = MEP_COLORS.switch;
      ctx.fillRect(-2, -4, 4, 4);
      break;
    }
    case 'hvac': {
      ctx.beginPath();
      ctx.arc(0, 0, half - 1, 0, Math.PI * 2);
      ctx.fillStyle = MEP_COLORS.hvac;
      ctx.fill();
      ctx.strokeStyle = FIXTURE_MEP_STROKE;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.strokeStyle = FIXTURE_MEP_LABEL;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(0, 5);
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.stroke();
      break;
    }
    case 'panel':
    default: {
      ctx.beginPath();
      ctx.roundRect(-half, -half, size, size, 2);
      ctx.fillStyle = MEP_COLORS.panel;
      ctx.fill();
      ctx.strokeStyle = FIXTURE_MEP_STROKE;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.strokeStyle = FIXTURE_MEP_LABEL;
      ctx.lineWidth = 1.5;
      for (const offset of [-3, 0, 3]) {
        ctx.beginPath();
        ctx.moveTo(offset, -5);
        ctx.lineTo(offset, 5);
        ctx.stroke();
      }
      break;
    }
  }

  if (options.highlighted) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.arc(0, 0, half + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export function drawFixture2D(
  ctx: CanvasRenderingContext2D,
  fixture: FixtureItem,
  options: { selected?: boolean } = {},
) {
  const { x, y } = fixture.position;
  const selected = options.selected ?? false;

  const glow = ctx.createRadialGradient(x, y, 0, x, y, 14);
  glow.addColorStop(0, selected ? GOLD_GLOW : GOLD_GLOW_SOFT);
  glow.addColorStop(1, 'rgba(212, 175, 55, 0)');

  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = selected ? GOLD_GLOW : GOLD_GLOW_SOFT;
  ctx.fill();
  ctx.strokeStyle = selected ? GOLD_LIGHT : GOLD_MUTED;
  ctx.lineWidth = selected ? 2 : 1.5;
  ctx.stroke();

  const lampGrad = ctx.createRadialGradient(x, y - 2, 0, x, y - 2, 8);
  lampGrad.addColorStop(0, GOLD_LIGHT);
  lampGrad.addColorStop(1, GOLD_MUTED);
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x - 4, y + 2);
  ctx.lineTo(x + 4, y + 2);
  ctx.closePath();
  ctx.fillStyle = lampGrad;
  ctx.fill();
  ctx.strokeStyle = FIXTURE_STROKE;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = FIXTURE_LABEL;
  ctx.font = CANVAS_FONT_SANS.replace('12px', '7px');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(fixture.type.slice(0, 1).toUpperCase(), x, y + 14);
}
