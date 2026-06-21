import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Footprints, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import { DEFAULT_SAMPLE_ID, getSampleDefinition, loadSampleById } from '@/core/sampleCatalog';
import { readLocalDraft } from '@/editor/localDraft';
import type { ProjectManifest } from '@/types';

const Viewport3D = lazy(() => import('@/components/editor/Viewport3D'));
const FALLBACK_SAMPLE_ID = 'six-three-atrium-wing';
const HERO_SAMPLE_IDS = ['six-three-atrium-wing', 'five-three-sky-court', 'dual-key-3242-courtyard', 'full-feature-showcase'];

export default function ThreeDRoomPage() {
  const navigate = useNavigate();
  const [manifest, setManifest] = useState<ProjectManifest | null>(null);
  const [sourceLabel, setSourceLabel] = useState('Loading detached 3D room');
  const [loading, setLoading] = useState(true);
  const [showAllFloors, setShowAllFloors] = useState(true);
  const [walkMode, setWalkMode] = useState(false);
  const [geometryRevision, setGeometryRevision] = useState(0);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!manifest) return [];
    return [
      ['Walls', manifest.walls.length],
      ['Openings', manifest.openings.length],
      ['Rooms', manifest.rooms?.length ?? 0],
      ['Furniture', manifest.furniture?.length ?? 0],
      ['Lights', manifest.fixtures?.length ?? 0],
      ['Landscape', manifest.landscapeElements?.length ?? 0],
    ];
  }, [manifest]);

  const loadSampleRoom = useCallback(async (sampleId: string) => {
    setLoading(true);
    try {
      const sample = await loadSampleById(sampleId).catch(() => loadSampleById(DEFAULT_SAMPLE_ID));
      const definition = getSampleDefinition(sampleId);
      setManifest(sample);
      setSourceLabel(`Premium sample · ${definition?.name ?? sample.name}`);
      setActiveSampleId(sampleId);
      setGeometryRevision((revision) => revision + 1);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetachedManifest = useCallback(async () => {
    setLoading(true);
    try {
      const draft = readLocalDraft();
      if (draft?.manifest) {
        setManifest(draft.manifest);
        setSourceLabel(`Local editor snapshot · ${new Date(draft.savedAt).toLocaleString()}`);
        setActiveSampleId(null);
        setGeometryRevision((revision) => revision + 1);
        return;
      }

      await loadSampleRoom(FALLBACK_SAMPLE_ID);
      setSourceLabel('Premium demo 3D room · no local draft found');
    } finally {
      setLoading(false);
    }
  }, [loadSampleRoom]);

  useEffect(() => {
    void loadDetachedManifest();
  }, [loadDetachedManifest]);

  return (
    <AppLayout immersive>
      <div className="flex h-[100dvh] min-h-0 flex-col bg-background text-ws-text">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-ws-border bg-black/70 px-4 py-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Market-class 3D Room
            </p>
            <h1 className="truncate text-lg font-semibold">{manifest?.name ?? 'Detached 3D chamber'}</h1>
            <p className="text-xs text-ws-text-dim">Fast WebGL review route with premium sample staging, walk mode, and all-floor 3D preview.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="max-w-[min(72vw,28rem)] truncate rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary">{sourceLabel}</span>
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

        <section className="flex shrink-0 flex-wrap items-center gap-2 border-b border-ws-border/70 bg-black/40 px-4 py-2 text-xs text-ws-text-dim">
          {HERO_SAMPLE_IDS.map((sampleId) => {
            const definition = getSampleDefinition(sampleId);
            return (
              <Button
                key={sampleId}
                type="button"
                variant={activeSampleId === sampleId ? 'gold' : 'outline'}
                size="sm"
                className="min-h-[36px]"
                onClick={() => void loadSampleRoom(sampleId)}
              >
                {definition?.name ?? sampleId}
              </Button>
            );
          })}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {stats.map(([label, value]) => (
              <span key={label} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px]">
                {label}: <strong className="text-primary">{value}</strong>
              </span>
            ))}
          </div>
        </section>

        <main className="relative min-h-0 flex-1 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 bg-black/50 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-ws-text-dim">Preparing premium 3D room…</span>
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
