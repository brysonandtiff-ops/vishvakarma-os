import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { CollabSession } from '@/collaboration/sync/CollabSession';
import { useCastViewer } from '@/cast/useCastSession';
import CastIntentTimeline from '@/components/cast/CastIntentTimeline';
import CastLensBadges from '@/components/cast/CastLensBadges';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import { DEFAULT_LAYER_VISIBILITY, type ProjectManifest } from '@/types';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';

const Viewport3D = lazy(() => import('@/components/editor/Viewport3D'));

const EMPTY_MANIFEST: ProjectManifest = {
  version: '1.0.0',
  name: 'Cast viewer',
  walls: [],
  openings: [],
  materials: [],
  floorMaterial: 'material-concrete',
  lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
  gridSize: 20,
  snapToGrid: true,
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
};

export default function CastViewerPage() {
  const { token = '' } = useParams<{ token: string }>();
  const [viewerName] = useState(() => `Guest ${Math.floor(Math.random() * 900 + 100)}`);
  const [manifest, setManifest] = useState<ProjectManifest>(EMPTY_MANIFEST);

  const onManifestChange = useCallback((next: ProjectManifest, isRemote: boolean) => {
    if (isRemote) {
      setManifest(next);
    }
  }, []);

  const { ready, error, projectName, lenses, chrono, intents, followPresenter, toggleFollow } =
    useCastViewer({
      token,
      viewerName,
      onManifestChange,
    });

  useEffect(() => {
    if (!ready) return;
    const collab = CollabSession.getInstance();
    const bridge = collab.getBridge();
    const remote = bridge?.toManifest();
    if (remote) {
      setManifest(remote);
    }
  }, [ready]);

  const lighting = chrono.locked ? chrono.lighting : manifest.lighting;
  const layerVisibility = useMemo(
    () => ({
      ...DEFAULT_LAYER_VISIBILITY,
      ...(lenses.layers ?? {}),
    }),
    [lenses.layers]
  );

  return (
    <div className="vish-cast-viewer flex h-[100dvh] min-h-0 flex-col bg-ws-canvas" data-testid="cast-viewer-page">
      <header className="vish-cast-header vish-cast-viewer-controls flex min-h-nav-row shrink-0 items-center justify-between gap-4 border-b border-ws-border bg-ws-toolbar px-page-x py-2">
        <div className="flex min-w-0 items-center gap-3">
          <img src={OFFICIAL_LOGO_SRC} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="vish-eyebrow text-primary">Akasha Cast</p>
            <p className="truncate text-sm font-semibold text-ws-text">{projectName}</p>
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-2 rounded-full border border-ws-border bg-ws-sidebar/60 px-3 py-2 text-[10px] uppercase tracking-wide text-ws-text-dim touch-target">
          <input
            type="checkbox"
            checked={followPresenter}
            onChange={(event) => toggleFollow(event.target.checked)}
            data-testid="cast-follow-presenter"
            className="h-4 w-4"
          />
          Follow presenter
        </label>
      </header>

      {error && (
        <div className="px-page-x py-6 text-sm text-destructive" data-testid="cast-viewer-error">
          {error}
        </div>
      )}

      {!error && !ready && (
        <div className="flex flex-1 items-center justify-center text-sm text-ws-text-dim">Joining cast…</div>
      )}

      {!error && ready && (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_min(18rem,100%)]">
          <div className="min-h-[20rem] lg:min-h-0" data-testid="cast-viewer-3d">
            <Suspense fallback={<Viewport3DLoading />}>
              <Viewport3D
                walls={manifest.walls}
                openings={manifest.openings}
                lighting={lighting}
                furniture={manifest.furniture}
                materials={manifest.materials}
                mepSymbols={manifest.mepSymbols}
                fixtures={manifest.fixtures}
                landscapeElements={manifest.landscapeElements}
                terrain={manifest.terrain}
                rooms={manifest.rooms}
                staircases={manifest.staircases}
                floorMaterial={manifest.floorMaterial}
                presentationLock
                floors={manifest.floors}
                activeFloorIndex={manifest.activeFloorIndex ?? 0}
                manifestWalls={manifest.walls}
                manifestOpenings={manifest.openings}
                manifestRooms={manifest.rooms}
                manifestFurniture={manifest.furniture}
                manifestMepSymbols={manifest.mepSymbols}
                manifestFixtures={manifest.fixtures}
                manifestStaircases={manifest.staircases}
              />
            </Suspense>
          </div>
          <aside className="vish-cast-sidebar vish-section-stack overflow-y-auto border-t border-ws-border bg-black/25 p-card-md lg:border-l lg:border-t-0">
            <div>
              <p className="mb-2 vish-eyebrow text-muted-foreground">Active lenses</p>
              <CastLensBadges lenses={lenses} />
            </div>
            {lenses.vastu && layerVisibility.vastuOverlay && (
              <p className="text-[10px] text-primary">Vastu overlay enabled on presenter channel</p>
            )}
            <div>
              <p className="mb-2 vish-eyebrow text-muted-foreground">Intent relay</p>
              <CastIntentTimeline intents={intents} />
            </div>
            <p className="text-[10px] leading-relaxed text-ws-text-dim">
              Decision-support preview only — not certified council review.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
