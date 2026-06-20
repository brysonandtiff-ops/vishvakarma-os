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
    expect(main).toContain('./styles/vish-realism.css');
    expect(main).toContain('./styles/vish-editor-chrome.css');
    expect(main).toContain('./styles/vish-editor-polish.css');
    expect(main).toContain('./styles/vish-mockup-system.css');
    expect(main).toContain('./styles/vish-editor-mantra.css');
    expect(main).toContain('./styles/vish-workspace-polish.css');
    expect(main).toContain('./styles/vish-ui-polish.css');
    const polishImports = main.match(/vish-editor-polish\.css/g) ?? [];
    expect(polishImports.length).toBe(1);
  });

  it('keeps premium Vishvakarma workspace styling targeted to existing editor surfaces', () => {
    const styles = read('src/styles/vish-editor-chrome.css');
    const mockup = read('src/styles/vish-mockup-system.css');
    const realism = read('src/styles/vish-realism.css');

    expect(realism).toContain('.vish-paper-grain');
    expect(realism).toContain('.vish-crafted-card');
    expect(realism).toContain('.vish-realism-viewport-frame');
    expect(realism).toContain('.vish-frame-bezel');
    expect(realism).toContain('--vish-depth-md');

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
    const routes = read('src/AppRoutes.tsx');

    const drawing = read('src/components/editor/blueprintCanvasDrawing.ts');
    const canvas = read('src/components/editor/BlueprintCanvas.tsx');

    expect(drawing).toContain("from '@/core/sceneDrawingTokens'");
    expect(drawing).toContain('WALL_HIGHLIGHT');
    expect(canvas).toContain('vish-paper-grain');
    expect(editor).toContain('onWallAdd={(wall) =>');
    expect(editor).toContain('engine.addWall(wall)');
    expect(editor).toContain('serializeProjectManifest');
    expect(editor).toContain('buildProjectExportFilename');
    expect(viewport).toContain('persistAtmosphereMode');
    expect(viewport).toContain('resolveDefaultAtmosphereMode');
    expect(viewport).toContain('SceneContactShadows');
    expect(editor).toContain('onOpeningAdd={(opening) => engine.addOpening(opening)}');
    expect(editor).toContain('useFloorPlanEngine');
    expect(editor).toContain('vish-editor-shell');
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
    expect(routes).toContain('immersive');
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
    expect(topBar).toContain('vish-editor-topbar-chrome');
    expect(topBar).toContain('TutorialHelpButton');
    expect(proofPanel).toContain('data-tutorial="project-proof"');
    expect(proofPanel).toContain('Project Proof');
    expect(editor).toContain('<ProjectProofPanel');
  });

  it('wires workspace polish classes through shared layout primitives', () => {
    const shell = read('src/components/layouts/WorkspacePageShell.tsx');
    const header = read('src/components/common/WorkspacePageHeader.tsx');
    const properties = read('src/components/editor/PropertiesPanel.tsx');
    const layoutTokens = read('src/styles/vish-layout-tokens.css');

    expect(shell).toContain('vish-workspace-page');
    expect(header).toContain('vish-workspace-header');
    expect(properties).toContain('vish-sidebar-panel');
    expect(layoutTokens).toContain('--vish-touch-min:');
  });
});
