import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Blueprint editor visual polish', () => {
  it('wires the editor chrome and mockup stylesheets through app startup', () => {
    const main = read('src/main.tsx');

    expect(main).toContain('./styles/vish-tokens.css');
    expect(main).toContain('./styles/vish-editor-chrome.css');
    expect(main).toContain('./styles/vish-mockup-system.css');
    expect(main).toContain('./styles/vish-editor-mantra.css');
  });

  it('keeps premium Vishvakarma workspace styling targeted to existing editor surfaces', () => {
    const styles = read('src/styles/vish-editor-chrome.css');
    const mockup = read('src/styles/vish-mockup-system.css');

    expect(styles).toContain('.vish-workspace-shell .bg-ws-canvas');
    expect(styles).toContain('ॐ वास्तु · शिल्प · प्रमाण');
    expect(styles).toContain('.vish-editor-topbar');
    expect(styles).toContain('.vish-workspace-shell .ws-pane-header');
    expect(styles).toContain('.vish-workspace-shell .architect-tool-dock');
    expect(styles).toContain('.architect-tool-button.active');
    expect(styles).toContain('.vish-workspace-shell .blueprint-grid');
    expect(styles).toContain('.vish-workspace-shell .architect-canvas');
    expect(styles).toContain('.vish-3d-viewport-header');
    expect(styles).toContain('.vish-canvas-empty-hint');
    expect(styles).toContain('.vish-minimap');
    expect(styles).toContain('.vish-canvas-hud-badge');
    expect(styles).toContain('.vish-workspace-shell .ws-panel-dark');
    expect(styles).toContain('.ws-status-bar');
    expect(styles).toContain('.vish-radial-menu');
    expect(styles).toContain('.vish-canvas-tool-select');
    expect(styles).toContain('@keyframes vish-radial-menu-in');
    expect(mockup).toContain('.vish-auth-card-mockup');
  });

  it('does not alter the editor drawing/event wiring while adding visual polish', () => {
    const editor = read('src/pages/EditorPage.tsx');
    const viewport = read('src/components/editor/Viewport3D.tsx');

    const drawing = read('src/components/editor/blueprintCanvasDrawing.ts');

    expect(drawing).toContain("from '@/core/sceneDrawingTokens'");
    expect(editor).toContain('onWallAdd={(wall) => engine.addWall(wall)}');
    expect(editor).toContain('serializeProjectManifest');
    expect(editor).toContain('buildProjectExportFilename');
    expect(viewport).toContain('persistAtmosphereMode');
    expect(viewport).toContain('resolveDefaultAtmosphereMode');
    expect(editor).toContain('onOpeningAdd={(opening) => engine.addOpening(opening)}');
    expect(editor).toContain('useFloorPlanEngine');
    expect(editor).toContain('vish-canvas-empty-hint');
    expect(editor).toContain('vish-editor-mantra-watermark');
    expect(editor).toContain('WelcomeOverlay');
    expect(editor).toContain('startTutorial');
    expect(editor).toContain('maybeStartEssentialsTour');
    expect(editor).toContain('Take the tour');
    expect(editor).toContain('<StatusBar');
    expect(editor).toContain('<EditorTopBar');
    expect(editor).toContain('fileStrip={fileStrip}');
    expect(editor).toContain('<EditorPhasePills />');
    expect(editor).toContain('immersive');
  });

  it('protects first-run welcome and tutorial product polish', () => {
    const proofPanel = read('src/components/editor/ProjectProofPanel.tsx');
    const editor = read('src/pages/EditorPage.tsx');
    const topBar = read('src/components/editor/EditorTopBar.tsx');
    const tutorial = read('src/tutorial/TutorialEngine.tsx');

    const welcome = read('src/components/editor/WelcomeOverlay.tsx');
    expect(welcome).toContain('variant="gold"');
    expect(welcome).toContain('vish-editor-overlay-backdrop');
    expect(tutorial).toContain('data-testid="tutorial-overlay"');
    expect(topBar).toContain('TutorialHelpButton');
    expect(proofPanel).toContain('data-tutorial="project-proof"');
    expect(proofPanel).toContain('Project Proof');
    expect(editor).toContain('<ProjectProofPanel');
  });
});
