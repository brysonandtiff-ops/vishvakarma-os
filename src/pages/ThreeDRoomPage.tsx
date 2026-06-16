import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Footprints, Loader2, RefreshCw } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import { DEFAULT_SAMPLE_ID, loadSampleById } from '@/core/sampleCatalog';
import { readLocalDraft } from '@/editor/localDraft';
import type { ProjectManifest } from '@/types';

const Viewport3D = lazy(() => import('@/components/editor/Viewport3D'));
const FALLBACK_SAMPLE_ID = 'full-feature-showcase';

export default function ThreeDRoomPage() {
  const navigate = useNavigate();
  const [manifest, setManifest] = useState<ProjectManifest | null>(null);
  const [sourceLabel, setSourceLabel] = useState('Loading detached 3D room');
  const [loading, setLoading] = useState(true);
  const [showAllFloors, setShowAllFloors] = useState(true);
  const [walkMode, setWalkMode] = useState(false);
  const [geometryRevision, setGeometryRevision] = useState(0);

  const loadDetachedManifest = useCallback(async () => {
    setLoading(true);
    try {
      const draft = readLocalDraft();
      if (draft?.manifest) {
        setManifest(draft.manifest);
        setSourceLabel(`Local editor snapshot · ${new Date(draft.savedAt).toLocaleString()}`);
        setGeometryRevision((revision) => revision + 1);
        return;
      }

      const sample = await loadSampleById(FALLBACK_SAMPLE_ID).catch(() => loadSampleById(DEFAULT_SAMPLE_ID));
      setManifest(sample);
      setSourceLabel('Demo 3D room sample · no local draft found');
      setGeometryRevision((revision) => revision + 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDetachedManifest();
  }, [loadDetachedManifest]);

  return (
    <AppLayout immersive>
      <div className="flex h-[100dvh] min-h-0 flex-col bg-background text-ws-text">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-ws-border bg-black/60 px-4 py-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Sacred 3D Room</p>
            <h1 className="truncate text-lg font-semibold">{manifest?.name ?? 'Detached 3D chamber'}</h1>
            <p className="text-xs text-ws-text-dim">Separate WebGL route so the 2D editor and 3D room do not render together.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary">{sourceLabel}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setWalkMode((value) => !value)}>
              <Footprints className="mr-2 h-4 w-4" />
              {walkMode ? 'Orbit mode' : 'Walk mode'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadDetachedManifest()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload snapshot
            </Button>
            <Button type="button" className="vish-gold-action" size="sm" onClick={() => navigate('/editor')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to editor
            </Button>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 bg-black/50 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-ws-text-dim">Preparing detached 3D room…</span>
            </div>
          )}

          {manifest && (
            <Suspense fallback={<Viewport3DLoading />}>
              <Viewport3D
                walls={manifest.walls}
                openings={manifest.openings}
                lighting={manifest.lighting}
                furniture={manifest.furniture ?? []}
                materials={manifest.materials ?? []}
                mepSymbols={manifest.mepSymbols ?? []}
                fixtures={manifest.fixtures ?? []}
                landscapeElements={manifest.landscapeElements ?? []}
                terrain={manifest.terrain ?? []}
                rooms={manifest.rooms ?? []}
                staircases={manifest.staircases ?? []}
                floorMaterial={manifest.floorMaterial}
                walkMode={walkMode}
                presentationLock={false}
                floors={manifest.floors ?? []}
                activeFloorIndex={manifest.activeFloorIndex ?? 0}
                showAllFloorsIn3D={showAllFloors}
                onShowAllFloorsIn3DChange={setShowAllFloors}
                manifestWalls={manifest.walls}
                manifestOpenings={manifest.openings}
                manifestRooms={manifest.rooms ?? []}
                manifestFurniture={manifest.furniture ?? []}
                manifestMepSymbols={manifest.mepSymbols ?? []}
                manifestFixtures={manifest.fixtures ?? []}
                manifestStaircases={manifest.staircases ?? []}
                geometryRevision={geometryRevision}
              />
            </Suspense>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
