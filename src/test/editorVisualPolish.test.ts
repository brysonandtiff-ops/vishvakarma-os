import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Blueprint editor visual polish', () => {
  it('wires the editor polish and mockup stylesheets through app startup', () => {
    const main = read('src/main.tsx');

    expect(main).toContain('./styles/vish-editor-polish.css');
    expect(main).toContain('./styles/vish-mockup-system.css');
  });

  it('keeps premium Vishvakarma workspace styling targeted to existing editor surfaces', () => {
    const styles = read('src/styles/vish-editor-polish.css');
    const mockup = read('src/styles/vish-mockup-system.css');

    expect(styles).toContain('.vish-workspace-shell .bg-ws-canvas');
    expect(styles).toContain('ॐ वास्तु · शिल्प · प्रमाण');
    expect(styles).toContain('.vish-workspace-shell header.bg-ws-menubar');
    expect(styles).toContain('.vish-workspace-shell .ws-pane-header');
    expect(styles).toContain('.vish-workspace-shell .architect-tool-dock');
    expect(styles).toContain('.vish-workspace-shell .architect-tool-button.active');
    expect(styles).toContain('.vish-workspace-shell .blueprint-grid');
    expect(styles).toContain('.vish-workspace-shell .architect-canvas');
    expect(styles).toContain('.vish-workspace-shell .ws-panel-dark');
    expect(styles).toContain('.vish-workspace-shell .ws-status-bar');
    expect(mockup).toContain('.vish-editor-topbar');
    expect(mockup).toContain('.vish-canvas-stage');
  });

  it('does not alter the editor drawing/event wiring while adding visual polish', () => {
    const editor = read('src/pages/EditorPage.tsx');
    const viewport = read('src/components/editor/Viewport3D.tsx');

    expect(editor).toContain('onWallAdd={(wall) => engine.addWall(wall)}');
    expect(editor).toContain('serializeProjectManifest');
    expect(editor).toContain('buildProjectExportFilename');
    expect(viewport).toContain('ATMOSPHERE_STORAGE_KEY');
    expect(viewport).toContain('prefers-reduced-motion');
    expect(editor).toContain('onOpeningAdd={(opening) => engine.addOpening(opening)}');
    expect(editor).toContain('useFloorPlanEngine');
    expect(editor).toContain('showOnboarding && <OnboardingPanel');
    expect(editor).toContain('<StatusBar');
    expect(editor).toContain('<EditorTopBar');
    expect(editor).toContain('immersive');
  });

  it('protects first-run demo and governance proof product polish', () => {
    const onboarding = read('src/components/editor/OnboardingPanel.tsx');
    const proofPanel = read('src/components/editor/ProjectProofPanel.tsx');
    const editor = read('src/pages/EditorPage.tsx');

    expect(onboarding).toContain('data-testid="first-run-welcome"');
    expect(onboarding).toContain('Build your first verified blueprint');
    expect(onboarding).toContain('Load Demo Blueprint');
    expect(onboarding).toContain('Start Blank Project');
    expect(proofPanel).toContain('data-testid="project-proof-panel"');
    expect(proofPanel).toContain('Visible governance status for demo confidence');
    expect(proofPanel).toContain('Project Proof');
    expect(editor).toContain('<ProjectProofPanel');
  });
});
