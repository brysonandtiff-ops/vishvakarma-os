import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Footprints, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import { DEFAULT_SAMPLE_ID, getSampleDefinition, loadSampleById } from '@/core/sampleCatalog';
import { readLocalDraft } from '@/editor/localDraft';
import type { ProjectManifest } from '@/types';
import PageMeta from '@/components/common/PageMeta';

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
      <PageMeta title="3D Room — Vishvakarma.OS" description="Walk your design in the immersive Sacred 3D room." />
      <div
        className="flex h-[100dvh] min-h-0 flex-col bg-background text-ws-text"
        data-testid="three-d-room-page"
      >
        <header className="flex shrink-0 flex-col items-stretch gap-3 border-b border-vish-navy-700/50 bg-vish-navy-950/80 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-vish-gold">
              <Sparkles className="h-3.5 w-3.5" /> Market-class 3D Room
            </p>
            <h1 className="truncate text-lg font-semibold text-white tracking-wide">{manifest?.name ?? 'Detached 3D chamber'}</h1>
            <p className="text-xs text-slate-400">Fast WebGL review route with premium sample staging, walk mode, and all-floor 3D preview.</p>
          </div>
          <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-end sm:overflow-visible sm:pb-0">
            <span className="max-w-[70vw] shrink-0 truncate rounded-full border border-vish-blue-500/30 bg-vish-blue-900/30 px-3 py-2 text-xs text-vish-blue-400 sm:max-w-[min(52vw,28rem)]">{sourceLabel}</span>
            <Button type="button" variant="outline" size="sm" className="shrink-0 touch-target border-vish-navy-700/50 hover:bg-vish-navy-800 text-slate-300" onClick={() => setWalkMode((value) => !value)}>
              <Footprints className="mr-2 h-4 w-4" />
              {walkMode ? 'Orbit mode' : 'Walk mode'}
            </Button>
            <Button type="button" variant="outline" size="sm" className="shrink-0 touch-target border-vish-navy-700/50 hover:bg-vish-navy-800 text-slate-300" onClick={() => void loadDetachedManifest()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload snapshot
            </Button>
            <Button type="button" className="bg-vish-blue-600 hover:bg-vish-blue-500 text-white shrink-0 touch-target shadow-lg shadow-vish-blue-900/50 border border-vish-blue-400/50" size="sm" onClick={() => navigate('/editor')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to editor
            </Button>
          </div>
        </header>

        <section className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto border-b border-vish-navy-800 bg-vish-navy-950/60 px-4 py-2 text-xs text-slate-400 backdrop-blur-md">
          {HERO_SAMPLE_IDS.map((sampleId) => {
            const definition = getSampleDefinition(sampleId);
            const isActive = activeSampleId === sampleId;
            return (
              <Button
                key={sampleId}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={`min-h-[44px] min-w-[44px] shrink-0 ${isActive ? 'bg-vish-navy-700 text-white border-vish-navy-500 shadow-inner' : 'border-vish-navy-700/50 hover:bg-vish-navy-800 text-slate-300'}`}
                onClick={() => void loadSampleRoom(sampleId)}
              >
                {definition?.name ?? sampleId}
              </Button>
            );
          })}
          <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2">
            {stats.map(([label, value]) => (
              <span key={label} className="shrink-0 rounded-full border border-vish-navy-600/50 bg-vish-navy-800/50 px-2.5 py-1 text-[11px] text-slate-300 backdrop-blur-sm">
                {label}: <strong className="text-vish-blue-400 font-mono ml-1">{value}</strong>
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
