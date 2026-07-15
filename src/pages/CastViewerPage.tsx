import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { PanelRight, Radio } from 'lucide-react';
import { CollabSession } from '@/collaboration/sync/CollabSession';
import { useCastViewer } from '@/cast/useCastSession';
import CastIntentTimeline from '@/components/cast/CastIntentTimeline';
import CastLensBadges from '@/components/cast/CastLensBadges';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import { Button } from '@/components/ui/button';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
          <img src={OFFICIAL_LOGO_SRC} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="vish-eyebrow text-primary">Akasha Cast</p>
              {ready && (
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-success" />
                  Live
                </span>
              )}
            </div>
            <p className="truncate text-sm font-semibold text-ws-text">{projectName || 'Joining...'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex shrink-0 items-center gap-2 rounded-full border border-ws-border bg-ws-sidebar/60 px-3 py-1.5 text-[10px] uppercase tracking-wide text-ws-text-dim transition-colors hover:bg-ws-sidebar touch-target cursor-pointer">
            <input
              type="checkbox"
              checked={followPresenter}
              onChange={(event) => toggleFollow(event.target.checked)}
              data-testid="cast-follow-presenter"
              className="h-3.5 w-3.5 accent-primary"
            />
            <span className="hidden sm:inline">Follow presenter</span>
            <Radio className="h-3.5 w-3.5 sm:hidden" />
          </label>
          
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 text-ws-text-dim hover:text-ws-text ${sidebarOpen ? 'bg-ws-active-bg text-primary' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle sidebar"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {error && (
        <div className="px-page-x py-12 text-center" data-testid="cast-viewer-error">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
            Retry connection
          </Button>
        </div>
      )}

      {!error && !ready && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-sm text-ws-text-dim">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="animate-pulse">Establishing Akasha stream…</p>
        </div>
      )}

      {!error && ready && (
        <div className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_auto]">
          <div className="min-h-[20rem] flex-1 lg:min-h-0" data-testid="cast-viewer-3d">
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
          
          {sidebarOpen && (
            <aside className="vish-cast-sidebar vish-section-stack w-full shrink-0 overflow-y-auto border-t border-ws-border bg-black/40 backdrop-blur-md p-card-md lg:w-72 lg:border-l lg:border-t-0">
              <div className="space-y-6">
                <section>
                  <p className="mb-3 vish-eyebrow text-muted-foreground">Active lenses</p>
                  <CastLensBadges lenses={lenses} />
                </section>

                {lenses.vastu && layerVisibility.vastuOverlay && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                    <p className="text-[10px] leading-tight text-primary font-medium">
                      Vastu Purusha Mandala active on presenter channel.
                    </p>
                  </div>
                )}

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="vish-eyebrow text-muted-foreground">Intent relay</p>
                    <span className="text-[10px] uppercase tracking-widest text-ws-text-faint">Real-time</span>
                  </div>
                  <CastIntentTimeline intents={intents} />
                </section>
                
                <footer className="pt-4 mt-auto border-t border-ws-border/30">
                  <p className="text-[10px] leading-relaxed text-ws-text-faint italic">
                    Decision-support preview only — not certified council review. Vishvakarma.OS manifest sync.
                  </p>
                </footer>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
