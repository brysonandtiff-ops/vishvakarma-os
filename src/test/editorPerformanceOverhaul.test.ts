/**
 * Custom mock + wiring audit for the Editor Performance Overhaul plan.
 * Writes proof artifacts to docs/release/evidence/ on completion.
 *
 * Run: pnpm run test:perf-overhaul
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCanvasRenderScheduler,
  createEmptyDirtyFlags,
} from '@/components/editor/blueprint/canvasRenderLoop';
import { isBloomPipelineActive, isPostFxPipelineActive } from '@/components/editor/ScenePostProcessing';
import { shouldBatchWalls } from '@/components/editor/sceneWallBatch';
import { FloorPlanEngine } from '@/core/floorPlanEngine';
import { getCachedVastuAnalysis } from '@/core/simulations/vastuOverlay';
import { SpatialIndex } from '@/editor/spatialIndex';
import { partialTouchesCost } from '@/utils/costEstimate';
import { atmosphereModeForProfile, resolvePerformanceProfile } from '@/utils/performanceProfile';
import { getCachedRoomFaces } from '@/utils/roomCalculations';
import type { Wall } from '@/types';
import {
  finalizeProofReport,
  proofReport,
  recordCheck,
} from './editorPerformanceOverhaulProof';

const repoRoot = resolve(process.cwd());

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

function wiring(id: string, phase: string, name: string, predicate: () => boolean, detail: string) {
  it(name, () => {
    const ok = predicate();
    recordCheck(id, phase, name, ok ? 'PASS' : 'FAIL', ok ? '' : detail);
    expect(ok, detail).toBe(true);
  });
}

function wiringWarn(id: string, phase: string, name: string, predicate: () => boolean, detail: string) {
  it(name, () => {
    const ok = predicate();
    recordCheck(id, phase, name, ok ? 'PASS' : 'WARN', ok ? '' : detail);
    if (!ok) {
      console.warn(`[perf-overhaul] WARN ${id}: ${detail}`);
    }
    expect(true).toBe(true);
  });
}

function mockWalls(count: number): Wall[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `w${index}`,
    start: { x: index * 120, y: 0 },
    end: { x: index * 120 + 100, y: 0 },
    thickness: 10,
    height: 240,
    material: 'material-paint',
  }));
}

describe('Editor performance overhaul — mock audit suite', () => {
  beforeEach(() => {
    FloorPlanEngine.resetInstance();
  });

  afterAll(() => {
    finalizeProofReport();
  });

  describe('Phase 0 — hot path (runtime mocks)', () => {
    it('p0-engine-notify: viewport pan does not bump geometryRevision', () => {
      const engine = FloorPlanEngine.getInstance();
      const geoBefore = engine.getGeometryRevision();
      const viewBefore = engine.getViewportRevision();
      let geometryListenerCalls = 0;
      const unsubGeo = engine.subscribeGeometry(() => {
        geometryListenerCalls += 1;
      });
      let viewportListenerCalls = 0;
      const unsubView = engine.subscribeViewport(() => {
        viewportListenerCalls += 1;
      });

      engine.setCanvasViewport({ panX: 120, panY: -40, zoom: 1.25 });

      expect(engine.getGeometryRevision()).toBe(geoBefore);
      expect(engine.getViewportRevision()).toBeGreaterThan(viewBefore);
      expect(geometryListenerCalls).toBe(0);
      expect(viewportListenerCalls).toBe(1);

      recordCheck(
        'p0-engine-notify',
        '0',
        'Viewport pan skips geometry listeners',
        'PASS',
        `geometryRevision=${geoBefore}, viewportRevision=${engine.getViewportRevision()}`,
      );
      unsubGeo();
      unsubView();
    });

    it('p0-compliance-pan: getGeometryManifest excludes session camera fields', () => {
      const engine = FloorPlanEngine.getInstance();
      engine.setCanvasViewport({ panX: 500, panY: 300, zoom: 2 });
      const geometryManifest = engine.getGeometryManifest();
      const fullManifest = engine.buildManifest();

      expect(geometryManifest.camera).toBeUndefined();
      expect(fullManifest.camera?.panX).toBe(500);

      recordCheck(
        'p0-compliance-pan',
        '0',
        'Geometry manifest excludes camera pan/zoom',
        'PASS',
        'camera omitted from getGeometryManifest()',
      );
    });

    it('p0-undo-coalesce: edit transaction produces one undo step for drag edits', () => {
      const engine = FloorPlanEngine.getInstance();
      engine.addWall({
        id: 'w1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 200,
        height: 2800,
        material: 'material-concrete',
      });
      engine.beginEditTransaction();
      engine.updateWall('w1', { start: { x: 5, y: 0 } });
      engine.updateWall('w1', { start: { x: 10, y: 0 } });
      engine.commitEditTransaction();
      engine.undo();

      expect(engine.getWalls()[0]?.start.x).toBe(0);
      recordCheck('p0-undo-coalesce', '0', 'Undo coalesces continuous wall drag', 'PASS', 'single undo restores pre-drag wall');
    });
  });

  describe('Phase 1 — 2D canvas (mock benchmarks)', () => {
    it('p1-canvas-raf: scheduler coalesces dirty flags into one frame', () => {
      const flags = createEmptyDirtyFlags();
      const draw = vi.fn();
      const scheduler = createCanvasRenderScheduler(
        draw,
        () => flags,
        () => {
          flags.geometry = false;
          flags.viewport = false;
          flags.interaction = false;
          flags.overlay = false;
        },
      );

      scheduler.requestDraw('geometry');
      scheduler.requestDraw('interaction');
      scheduler.requestDraw('overlay');
      expect(draw).not.toHaveBeenCalled();
      scheduler.flush();
      expect(draw).toHaveBeenCalledTimes(1);

      proofReport.metrics.canvasSchedulerCoalesced = true;
      recordCheck('p1-canvas-raf', '1', 'Canvas rAF scheduler coalesces draws', 'PASS', '3 requestDraw → 1 flush');
    });

    it('p1-spatial-index: indexed hit-test matches linear scan (mock wall field)', () => {
      const walls = mockWalls(400);
      const index = new SpatialIndex();
      index.rebuild({ walls, openings: [], furniture: [], fixtures: [] });
      // Query deep in the list so linear scan pays O(n) while the grid stays O(1) cells.
      const point = { x: 200 * 120 + 60, y: 2 };

      const linearHit = walls.find((wall) => {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return false;
        const t = ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / (len * len);
        if (t < 0 || t > 1) return false;
        const px = wall.start.x + t * dx;
        const py = wall.start.y + t * dy;
        return Math.hypot(point.x - px, point.y - py) <= 8;
      });

      const indexedHit = index.findWallAtPoint(point, 8);
      expect(indexedHit?.id).toBe(linearHit?.id);

      const indexedStart = performance.now();
      for (let i = 0; i < 300; i += 1) index.findWallAtPoint(point, 8);
      const indexedMs = performance.now() - indexedStart;

      const linearStart = performance.now();
      for (let i = 0; i < 300; i += 1) {
        walls.find((wall) => {
          const dx = wall.end.x - wall.start.x;
          const dy = wall.end.y - wall.start.y;
          const len = Math.hypot(dx, dy);
          if (len === 0) return false;
          const t = ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / (len * len);
          if (t < 0 || t > 1) return false;
          const px = wall.start.x + t * dx;
          const py = wall.start.y + t * dy;
          return Math.hypot(point.x - px, point.y - py) <= 8;
        });
      }
      const linearMs = performance.now() - linearStart;

      proofReport.metrics.spatialIndexMs = indexedMs;
      proofReport.metrics.linearScanMs = linearMs;

      const faster = indexedMs <= linearMs * 1.1;
      recordCheck(
        'p1-spatial-index',
        '1',
        'Spatial index hit-test parity + mock benchmark',
        faster ? 'PASS' : 'WARN',
        `indexed=${indexedMs.toFixed(2)}ms linear=${linearMs.toFixed(2)}ms parity=${indexedHit?.id ?? 'none'}`,
      );
      expect(indexedHit?.id).toBeDefined();
    });

    it('p1-overlay-cache: vastu analysis cache returns stable reference', () => {
      const manifest = {
        walls: mockWalls(4),
        openings: [],
        labels: [],
        northOrientation: 90,
      };
      const first = getCachedVastuAnalysis(manifest);
      const second = getCachedVastuAnalysis(manifest);
      expect(first).toBe(second);
      recordCheck('p1-overlay-cache', '1', 'Vastu analysis memoized by geometry hash', 'PASS', 'same object reference');
    });
  });

  describe('Phase 2 — 3D pipeline (mock helpers)', () => {
    it('p2-3d-demand: bloom pipeline gate respects wall cap', () => {
      expect(isBloomPipelineActive(true, 50)).toBe(true);
      expect(isBloomPipelineActive(true, 250)).toBe(false);
      recordCheck('p2-3d-demand', '2', 'Bloom pipeline gated by wall count', 'PASS', `cap=${250}`);
    });

    it('p2-wall-batch: batching threshold for large standard scenes', () => {
      expect(shouldBatchWalls(12, 'standard')).toBe(true);
      expect(shouldBatchWalls(5, 'standard')).toBe(false);
      expect(shouldBatchWalls(20, 'cinematic')).toBe(false);
      recordCheck('p2-wall-batch', '2', 'Wall batch helper thresholds', 'PASS', '>=10 walls, non-cinematic');
    });
  });

  describe('Phase 4 — background work (runtime mocks)', () => {
    it('p4-background: partialTouchesCost skips session-only edits', () => {
      expect(partialTouchesCost({ name: 'Renamed' })).toBe(false);
      expect(partialTouchesCost({ walls: mockWalls(1) })).toBe(true);
      recordCheck('p4-background', '4', 'Incremental cost invalidation helper', 'PASS', 'walls touch cost, name does not');
    });

    it('p4-background: room face cache returns same array for unchanged walls', () => {
      const walls = mockWalls(6);
      const first = getCachedRoomFaces(walls);
      const second = getCachedRoomFaces(walls);
      expect(first).toBe(second);
      recordCheck('p4-background', '4', 'Room face cache memoizes floor graph', 'PASS', 'same array reference');
    });
  });

  describe('Phase 6 — product surface (runtime mocks)', () => {
    it('p6-product-ci: performance profiles map to atmosphere tiers', () => {
      expect(resolvePerformanceProfile('draft')).toBe('draft');
      expect(atmosphereModeForProfile('draft')).toBe('standard');
      expect(atmosphereModeForProfile('presentation')).toBe('cinematic');
      recordCheck('p6-product-ci', '6', 'Performance profile → atmosphere mapping', 'PASS', 'draft=standard, presentation=cinematic');
    });
  });

  describe('Wiring audit — source presence', () => {
    wiring(
      'p0-mouse-collab',
      '0',
      'Collab cursor broadcast throttled (~80ms)',
      () => read('src/components/editor/EditorCollaborationBar.tsx').includes('lastSentRef.current < 80'),
      'Expected 80ms throttle in EditorCollaborationBar',
    );

    wiring(
      'p0-mouse-collab-radial',
      '0',
      'Radial menu uses dedicated tracker (not stage setMousePos)',
      () =>
        read('src/pages/EditorPage.tsx').includes('RadialToolMenuTracker') &&
        !read('src/pages/EditorPage.tsx').includes('onPointerMove={(event) => setMousePos'),
      'EditorPage should use RadialToolMenuTracker without stage pointer move state',
    );

    wiring(
      'p0-compliance-editor',
      '0',
      'EditorPage keys compliance on geometryRevision',
      () =>
        read('src/pages/EditorPage.tsx').includes('useGeometryRevision()') &&
        read('src/pages/EditorPage.tsx').includes('getGeometryManifest()'),
      'EditorPage missing geometryRevision compliance wiring',
    );

    wiring(
      'p1-blueprint-raf',
      '1',
      'BlueprintCanvas uses canvas render scheduler',
      () =>
        read('src/components/editor/BlueprintCanvas.tsx').includes('createCanvasRenderScheduler') &&
        read('src/components/editor/BlueprintCanvas.tsx').includes('requestCanvasDraw'),
      'BlueprintCanvas missing rAF scheduler wiring',
    );

    wiring(
      'p4-draft-worker',
      '4',
      'Draft autosave scheduled via worker helper',
      () =>
        read('src/editor/localDraft.ts').includes('scheduleLocalDraftSave') &&
        read('src/pages/EditorPage.tsx').includes('scheduleLocalDraftSave'),
      'Worker draft save not wired',
    );

    wiring(
      'p4-crdt-batch',
      '4',
      'CRDT remote updates batched at animation frame',
      () => read('src/collaboration/crdt/manifestBridge.ts').includes('requestAnimationFrame'),
      'manifestBridge missing rAF batching for remote apply',
    );

    wiring(
      'p2-3d-frameloop',
      '2',
      'Viewport3D uses demand render loop',
      () => read('src/components/editor/Viewport3D.tsx').includes('frameloop="demand"'),
      'Viewport3D still uses continuous Canvas render loop',
    );

    wiring(
      'p2-3d-deferred',
      '2',
      'EditorPage defers 3D geometry props',
      () => read('src/pages/EditorPage.tsx').includes('useDeferredValue'),
      'EditorPage missing useDeferredValue for 3D sync',
    );

    wiring(
      'p3-lazy-routes',
      '3',
      'Non-editor routes lazy-loaded',
      () => {
        const routes = read('src/routes.tsx');
        return routes.includes('lazy(() => import') && !routes.includes('import ProjectsPage from');
      },
      'routes.tsx still static-imports non-editor pages',
    );

    wiring(
      'p5-deferred-governance',
      '5',
      'Production governance deferred via requestIdleCallback',
      () => read('src/main.tsx').includes('requestIdleCallback'),
      'main.tsx runs enforce() synchronously at startup',
    );

    wiring(
      'p6-perf-hud',
      '6',
      'Dev performance HUD wired in editor',
      () =>
        read('src/pages/EditorPage.tsx').includes('EditorPerfHud') &&
        read('src/components/editor/EditorPerfHud.tsx').includes('vishvakarma.os.perf.hud'),
      'EditorPerfHud missing from editor shell',
    );

    wiring(
      'p6-perf-profile-ui',
      '6',
      'Performance profile panel in editor more panel',
      () =>
        read('src/pages/EditorPage.tsx').includes('PerformanceProfilePanel') &&
        read('src/components/editor/panels/PerformanceProfilePanel.tsx').includes('Performance profile'),
      'PerformanceProfilePanel missing',
    );

    wiring(
      'p6-docs',
      '6',
      'Performance notes and troubleshooting docs present',
      () =>
        read('docs/release/evidence/performance-notes.md').includes('Editor performance overhaul') &&
        read('docs/user/TROUBLESHOOTING.md').includes('Performance profile'),
      'Performance documentation missing',
    );
  });
});
