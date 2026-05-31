import { analyzeThermal } from '@/core/simulations/thermalEngine';
import { routeMep } from '@/core/simulations/tvashtar';
import { computeVayuField } from '@/core/simulations/vayuCFD';
import type { ProjectManifest } from '@/types';

export function TvashtarPanel({ manifest }: { manifest: ProjectManifest }) {
  const route = routeMep(manifest.walls, { x: 80, y: 80 }, { x: 400, y: 320 });
  return (
    <div className="space-y-2 px-4 py-3 text-xs">
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
    <div className="space-y-2 px-4 py-3 text-xs">
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
    <div className="space-y-2 px-4 py-3 text-xs">
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Vayu CFD</p>
      <p>Cross-vent score: {cfd.crossVentScore}%</p>
      <p className="text-muted-foreground">CPU solver · {cfd.vectors.length} vectors</p>
    </div>
  );
}

export function PanchatattvaPanel() {
  return (
    <div className="px-4 py-3 text-xs text-muted-foreground">
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Panchatattva</p>
      <p>Five-element balance — live scoring with room labels.</p>
    </div>
  );
}

export function AkashaCastPanel() {
  return (
    <div className="px-4 py-3 text-xs text-muted-foreground">
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Akasha Cast</p>
      <p className="rounded border border-dashed border-primary/30 p-2">Scaffolded — cloud render queue</p>
    </div>
  );
}
