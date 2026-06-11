import { analyzeThermal } from '@/core/simulations/thermalEngine';
import { routeMep } from '@/core/simulations/tvashtar';
import { computeVayuField } from '@/core/simulations/vayuCFD';
import type { ProjectManifest } from '@/types';

const PANEL_CARD =
  'rounded-xl border border-primary/20 bg-black/20 px-4 py-3 text-xs text-ws-text-dim shadow-sm';

function ComingSoonBadge({ version = 'v1.2' }: { version?: string }) {
  return (
    <div className="vish-coming-soon-badge mt-2" role="status">
      <span className="vish-coming-soon-badge__dot" aria-hidden />
      <span className="vish-coming-soon-badge__label">Coming in {version}</span>
      <span className="vish-coming-soon-badge__hint">Preview scaffold — not a broken panel</span>
    </div>
  );
}

export function TvashtarPanel({ manifest }: { manifest: ProjectManifest }) {
  const route = routeMep(manifest.walls, { x: 80, y: 80 }, { x: 400, y: 320 });
  return (
    <div className={`${PANEL_CARD} space-y-2`}>
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Tvashtar MEP</p>
      <p>Route cost: {Math.round(route.cost)}</p>
      <p className={route.success ? 'text-success' : 'text-warning'}>
        {route.success ? 'Path found' : 'Partial path (CPU)'}
      </p>
    </div>
  );
}

export function AgniThermalPanel({ manifest }: { manifest: ProjectManifest }) {
  const thermal = analyzeThermal(manifest);
  return (
    <div className={`${PANEL_CARD} space-y-2`}>
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Agni Thermal</p>
      <p className="text-lg font-bold">{thermal.overallComfort}% comfort</p>
      {thermal.rooms.map((r) => (
        <p key={r.roomName} className="text-muted-foreground">
          {r.roomName}: R≈{r.rValue.toFixed(1)}
        </p>
      ))}
    </div>
  );
}

export function VayuJalaPanel({ manifest }: { manifest: ProjectManifest }) {
  const cfd = computeVayuField(manifest.walls, manifest.lighting.sunAzimuth);
  return (
    <div className={`${PANEL_CARD} space-y-2`}>
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Vayu CFD</p>
      <p>Cross-vent score: {cfd.crossVentScore}%</p>
      <p className="text-muted-foreground">CPU solver · {cfd.vectors.length} vectors</p>
    </div>
  );
}

export function PanchatattvaPanel() {
  return (
    <div className={`${PANEL_CARD} vish-coming-soon-panel`}>
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Panchatattva</p>
      <p className="mt-1 text-ws-text-dim">Five-element balance scoring with room labels.</p>
      <ComingSoonBadge />
    </div>
  );
}

export function AkashaCastPanel() {
  return (
    <div className={`${PANEL_CARD} vish-coming-soon-panel`}>
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Akasha Cast</p>
      <p className="mt-1 text-ws-text-dim">Cloud render queue for high-fidelity previews.</p>
      <ComingSoonBadge />
    </div>
  );
}
