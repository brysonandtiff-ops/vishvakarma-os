import type { SitePlan } from '@/domain/buildings/generatedBuilding';

export default function SitePlanPreview({
  sitePlan,
  compact = false,
}: {
  sitePlan: SitePlan;
  compact?: boolean;
}) {
  const points = sitePlan.parcelBoundary;
  const footprint = sitePlan.buildingFootprint;
  if (points.length < 3) return null;

  const all = [...points, ...footprint];
  const minX = Math.min(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxX = Math.max(...all.map((p) => p.x));
  const maxY = Math.max(...all.map((p) => p.y));
  const pad = 20;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x - minX + pad} ${p.y - minY + pad}`).join(' ') + ' Z';

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`w-full rounded-xl vish-ai-plan-preview ${compact ? 'h-24' : 'h-48'}`}
      role="img"
      aria-label="Site plan preview"
    >
      <path d={toPath(points)} fill="none" stroke="currentColor" strokeWidth={2} className="text-primary/70" />
      <path d={toPath(footprint)} fill="currentColor" fillOpacity={0.14} stroke="currentColor" strokeWidth={1.75} className="text-primary/80" />
      <text x={pad} y={14} className="fill-muted-foreground text-[10px]">
        {sitePlan.orientation} · setbacks F{sitePlan.setbacks.front}m S{sitePlan.setbacks.side}m
      </text>
    </svg>
  );
}
