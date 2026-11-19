import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Box, ChevronRight, Footprints, RefreshCw, RotateCcw } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import PageMeta from '@/components/common/PageMeta';
import RoomConceptGallery from '@/components/editor/RoomConceptGallery';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import { DEFAULT_SAMPLE_ID, getSampleDefinition, loadSampleById } from '@/core/sampleCatalog';
import { getLiteEditorManifest } from '@/editor/liteEditorHandoff';
import { readLocalDraft } from '@/editor/localDraft';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';
import type { ProjectManifest } from '@/types';
import { filterByFloorIndex, filterOpeningsByFloor, filterRoomsByFloor, filterWallsByFloor } from '@/utils/floorHelpers';
import './ThreeDRoomPage.css';

const Viewport3D = lazy(() => import('@/components/editor/Viewport3D'));
const DEFAULT_ROOM_SAMPLE = 'six-three-atrium-wing';
const FEATURED_SAMPLE_IDS = [DEFAULT_ROOM_SAMPLE, 'five-three-sky-court', 'dual-key-3242-courtyard', 'full-feature-showcase'];

const FEATURED_SAMPLES = FEATURED_SAMPLE_IDS.map(getSampleDefinition).filter((sample) => sample !== undefined);

const LOADING_SCENE = { status: 'loading' } as const;
type Scene =
  | typeof LOADING_SCENE
  | { status: 'unavailable'; title: string; detail: string }
  | { status: 'ready'; manifest: ProjectManifest; source: 'lite' | 'draft' | 'sample'; sampleId?: string; savedAt?: string };

async function loadScene(selection: string, liteManifest: ProjectManifest | null): Promise<Scene> {
  if (selection === 'lite') {
    return liteManifest
      ? { status: 'ready', manifest: liteManifest, source: 'lite' }
      : { status: 'unavailable', title: 'No 2D plan in this tab', detail: 'Open the Lite Editor and choose Open 3D Room to bring your plan here.' };
  }

  if (selection === 'auto' || selection === 'draft') {
    const draft = readLocalDraft();
    if (draft) {
      return { status: 'ready', manifest: draft.manifest, source: 'draft', savedAt: draft.savedAt };
    }
    if (selection === 'draft') {
      return { status: 'unavailable', title: 'No local editor draft yet', detail: 'Open the full editor to work on a plan, or choose a sample home to explore.' };
    }
  }

  const sampleId = selection === 'auto' ? DEFAULT_ROOM_SAMPLE : selection.slice('sample:'.length);
  return { status: 'ready', manifest: await loadSampleById(sampleId), source: 'sample', sampleId };
}

export default function ThreeDRoomPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const liteManifest = getLiteEditorManifest(location.state);
  const walkMode = searchParams.get('mode') === 'walk';
  const sampleParam = searchParams.get('sample')?.trim() || null;
  const sourceParam = searchParams.get('source');
  const selection = sampleParam ? `sample:${sampleParam}` : (sourceParam === 'draft' ? 'draft' : liteManifest ? 'lite' : 'auto');
  const coarsePointer = useCoarsePointer();
  const viewportRef = useRef<HTMLElement | null>(null);
  const [reload, setReload] = useState(0);
  const [viewRevision, setViewRevision] = useState(0);
  const [showAllFloors, setShowAllFloors] = useState(true);
  const [loaded, setLoaded] = useState<{ selection: string; reload: number; scene: Scene }>();
  const scene = loaded?.selection === selection && loaded.reload === reload ? loaded.scene : LOADING_SCENE;

  useEffect(() => {
    let active = true;
    setShowAllFloors(true);
    const finish = (next: Scene) => {
      if (active) setLoaded({ selection, reload, scene: next });
    };
    void loadScene(selection, liteManifest).then(finish, () => {
      const isDraft = selection === 'draft' || selection === 'auto';
      finish({
        status: 'unavailable',
        title: 'Couldn’t open this scene',
        detail: isDraft
          ? 'Try again, or choose a sample home to keep exploring.'
          : 'Try this sample again, or choose a different scene.',
      });
    });
    return () => { active = false; };
  }, [selection, reload, liteManifest]);

  const activeScene = scene.status === 'ready' ? scene : null;
  const manifest = activeScene?.manifest;
  const activeSampleId = activeScene?.sampleId ?? null;
  const selectedOption = sampleParam ?? (selection === 'auto' ? activeSampleId ?? activeScene?.source ?? '' : selection);
  const hasFeaturedSample = FEATURED_SAMPLES.some((sample) => sample.id === selectedOption);
  const extraSample = selectedOption && !hasFeaturedSample ? getSampleDefinition(selectedOption) : undefined;
  const sourceLabel = activeScene?.source === 'lite' ? 'From your 2D plan' : activeScene?.source === 'draft' ? 'Local editor draft' : 'Sample home';
  const draftTime = activeScene?.savedAt;
  const hasDraftTime = draftTime && Number.isFinite(Date.parse(draftTime));
  const floorIndex = manifest?.activeFloorIndex ?? 0;
  const hasMultipleFloors = (manifest?.floors?.length ?? 0) > 1;
  const viewGeometry = useMemo(() => {
    if (!manifest) return null;
    const rooms = manifest.rooms ?? [];
    if (!hasMultipleFloors) return { ...manifest, rooms };
    return {
      walls: filterWallsByFloor(manifest.walls, floorIndex),
      openings: filterOpeningsByFloor(manifest.openings, manifest.walls, floorIndex),
      rooms: filterRoomsByFloor(rooms, floorIndex),
      furniture: filterByFloorIndex(manifest.furniture ?? [], floorIndex),
      mepSymbols: filterByFloorIndex(manifest.mepSymbols ?? [], floorIndex),
      fixtures: filterByFloorIndex(manifest.fixtures ?? [], floorIndex),
      staircases: filterByFloorIndex(manifest.staircases ?? [], floorIndex),
    };
  }, [manifest, floorIndex, hasMultipleFloors]);
  const stats = manifest ? [
    ['Walls', manifest.walls.length],
    ['Openings', manifest.openings.length],
    ['Defined rooms', manifest.rooms?.length ?? 0],
    ['Furniture', manifest.furniture?.length ?? 0],
    ['Lights', manifest.fixtures?.length ?? 0],
    ['Landscape', manifest.landscapeElements?.length ?? 0],
  ] as const : [];

  function setViewMode(nextMode: 'orbit' | 'walk') {
    const next = new URLSearchParams(searchParams);
    if (nextMode === 'walk') next.set('mode', 'walk');
    else next.delete('mode');
    setSearchParams(next, { replace: true, state: location.state, preventScrollReset: true });
  }

  function selectScene(value: string) {
    const next = new URLSearchParams(searchParams);
    next.delete('sample');
    next.delete('source');
    if (value === 'draft') next.set('source', 'draft');
    else if (value !== 'lite') next.set('sample', value);
    setSearchParams(next, { replace: true, state: location.state, preventScrollReset: true });
  }

  function openSampleFromGallery(sampleId: string) {
    if (sampleId !== activeSampleId) selectScene(sampleId);
    viewportRef.current?.focus({ preventScroll: true });
    viewportRef.current?.scrollIntoView({ block: 'start' });
  }

  const modeHelp = walkMode
    ? coarsePointer ? 'Drag to look around. Hold the arrows to move.' : 'Start walking to look around with your mouse. Use WASD or the arrow keys to move. Press Esc to release the mouse.'
    : coarsePointer ? 'Drag to rotate around the plan. Pinch to zoom.' : 'Drag to rotate around the plan. Scroll to zoom.';
  const editorPath = liteManifest ? '/editor-lite' : '/editor';

  return (
    <AppLayout immersive>
      <PageMeta title="3D Room — Vishvakarma.OS" description="Preview a blueprint in three dimensions or walk through a sample home." />
      <div className="vish-room" data-testid="three-d-room-page">
        <div className="vish-room__content">
          <header className="vish-room__header">
            <div>
              <nav className="vish-room__breadcrumb" aria-label="Room location">
                <Link to="/projects">Projects</Link>
                <ChevronRight aria-hidden="true" size={14} />
                <span aria-current="page">3D Room</span>
              </nav>
              <h1>3D Room</h1>
              <p>Explore your blueprint or step inside a sample home.</p>
            </div>
            <div className="vish-room__links">
              <a className="vish-room__button" href="#room-concepts">Concept gallery <ArrowUpRight aria-hidden="true" size={16} /></a>
              <Link className="vish-room__button vish-room__button--accent" to={editorPath} state={liteManifest ? { liteEditorManifest: liteManifest } : undefined}>
                <ArrowLeft aria-hidden="true" size={16} /> {liteManifest ? 'Back to 2D plan' : 'Back to editor'}
              </Link>
            </div>
          </header>

          <div className="vish-room__workspace">
            <section className="vish-room__preview" aria-labelledby="room-preview-title" ref={viewportRef} tabIndex={-1}>
              <div className="vish-room__toolbar">
                <div className="vish-room__scene-title">
                  <h2 id="room-preview-title">{manifest?.name || 'Scene preview'}</h2>
                  {activeScene && <p>{sourceLabel}</p>}
                </div>
                <div className="vish-room__viewport-actions">
                  <div className="vish-room__modes" role="group" aria-label="View mode">
                    <button className="vish-room__button" type="button" aria-pressed={!walkMode} onClick={() => setViewMode('orbit')}>
                      <Box aria-hidden="true" size={16} /> Orbit
                    </button>
                    <button className="vish-room__button" type="button" aria-pressed={walkMode} onClick={() => setViewMode('walk')}>
                      <Footprints aria-hidden="true" size={16} /> Walk mode
                    </button>
                  </div>
                  <button className="vish-room__button vish-room__reset" type="button" disabled={!manifest} onClick={() => setViewRevision((revision) => revision + 1)}>
                    <RotateCcw aria-hidden="true" size={16} /><span>Reset view</span>
                  </button>
                </div>
              </div>

              <div className="vish-room__viewport" data-testid="room-viewport" aria-busy={scene.status === 'loading'}>
                {scene.status === 'loading' && (
                  <div className="vish-room__notice" role="status">
                    <RefreshCw className="vish-room__spinner" aria-hidden="true" size={23} /> Preparing your 3D scene…
                  </div>
                )}
                {scene.status === 'unavailable' && (
                  <div className="vish-room__notice" role="status">
                    <h3>{scene.title}</h3>
                    <p>{scene.detail}</p>
                    <div className="vish-room__links">
                      <button className="vish-room__button" type="button" onClick={() => setReload((revision) => revision + 1)}>Try again</button>
                      <button className="vish-room__button vish-room__button--accent" type="button" onClick={() => selectScene(sampleParam === DEFAULT_ROOM_SAMPLE || selection === 'auto' ? DEFAULT_SAMPLE_ID : DEFAULT_ROOM_SAMPLE)}>Load a sample</button>
                    </div>
                  </div>
                )}
                {manifest && viewGeometry && (
                  <Suspense fallback={<Viewport3DLoading />}>
                    <Viewport3D
                      walls={viewGeometry.walls}
                      openings={viewGeometry.openings}
                      lighting={manifest.lighting}
                      furniture={viewGeometry.furniture}
                      materials={manifest.materials}
                      mepSymbols={viewGeometry.mepSymbols}
                      fixtures={viewGeometry.fixtures}
                      landscapeElements={manifest.landscapeElements}
                      terrain={manifest.terrain}
                      rooms={viewGeometry.rooms}
                      staircases={viewGeometry.staircases}
                      floorMaterial={manifest.floorMaterial}
                      walkMode={walkMode}
                      floors={manifest.floors}
                      activeFloorIndex={floorIndex}
                      showAllFloorsIn3D={showAllFloors}
                      onShowAllFloorsIn3DChange={setShowAllFloors}
                      manifestWalls={manifest.walls}
                      manifestOpenings={manifest.openings}
                      manifestRooms={manifest.rooms}
                      manifestFurniture={manifest.furniture}
                      manifestMepSymbols={manifest.mepSymbols}
                      manifestFixtures={manifest.fixtures}
                      manifestStaircases={manifest.staircases}
                      roomControls={{ resetRevision: viewRevision }}
                    />
                  </Suspense>
                )}
              </div>
              {manifest && <p className="vish-room__mode-help">{modeHelp}</p>}
            </section>

            <aside className="vish-room__inspector" aria-labelledby="room-scene-title">
              <h2 id="room-scene-title">Scene settings</h2>
              <label htmlFor="room-scene-select">Scene</label>
              <select id="room-scene-select" value={selectedOption} onChange={(event) => selectScene(event.target.value)}>
                <option value="" disabled>Choose a scene</option>
                {liteManifest && <option value="lite">From your 2D plan</option>}
                <option value="draft">Local editor draft</option>
                <optgroup label="Sample homes">
                  {FEATURED_SAMPLES.map((sample) => <option key={sample.id} value={sample.id}>{sample.name}</option>)}
                  {extraSample && <option value={extraSample.id}>{extraSample.name}</option>}
                  {sampleParam && !hasFeaturedSample && !extraSample && <option value={sampleParam} disabled>Unavailable sample</option>}
                </optgroup>
              </select>
              {activeSampleId && <p>{getSampleDefinition(activeSampleId)?.description}</p>}
              {activeScene?.source === 'lite' && liteManifest && (
                <Link className="vish-room__button" to="/editor" state={{ liteEditorManifest: liteManifest }}>
                  Save in Full Studio <ArrowUpRight aria-hidden="true" size={16} />
                </Link>
              )}
              {selectedOption === 'draft' && (
                <>
                  {hasDraftTime && <p>Saved on this device <time dateTime={draftTime}>{new Date(draftTime).toLocaleString()}</time>.</p>}
                  <button className="vish-room__button" type="button" onClick={() => setReload((revision) => revision + 1)}>
                    <RefreshCw aria-hidden="true" size={16} /> Reload snapshot
                  </button>
                </>
              )}
              {manifest && (
                <div className="vish-room__details">
                  <h3>Scene details</h3>
                  <dl>
                    {stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                  </dl>
                </div>
              )}
            </aside>
          </div>

          <div className="vish-room__concepts">
            <RoomConceptGallery activeSampleId={activeSampleId} onSelectSample={openSampleFromGallery} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
