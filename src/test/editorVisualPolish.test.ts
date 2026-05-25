import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Blueprint editor visual polish', () => {
  it('wires the editor polish stylesheet through app startup', () => {
    const main = read('src/main.tsx');

    expect(main).toContain('./styles/vish-editor-polish.css');
  });

  it('keeps premium Vishvakarma workspace styling targeted to existing editor surfaces', () => {
    const styles = read('src/styles/vish-editor-polish.css');

    expect(styles).toContain('.vish-workspace-shell .bg-ws-canvas');
    expect(styles).toContain('ॐ वास्तु · शिल्प · प्रमाण');
    expect(styles).toContain('.vish-workspace-shell header.bg-ws-menubar');
    expect(styles).toContain('.vish-workspace-shell .ws-pane-header');
    expect(styles).toContain('.vish-workspace-shell .architect-tool-dock');
    expect(styles).toContain('.vish-workspace-shell .architect-tool-button.active');
    expect(styles).toContain('.vish-workspace-shell .blueprint-grid');
    expect(styles).toContain('.vish-workspace-shell .architect-canvas');
    expect(styles).toContain('.vish-workspace-shell .ws-panel-light');
    expect(styles).toContain('.vish-workspace-shell .ws-status-bar');
  });

  it('does not alter the editor drawing/event wiring while adding visual polish', () => {
    const editor = read('src/pages/EditorPage.tsx');

    expect(editor).toContain('onWallAdd={(wall) => setWalls((items) => [...items, wall])}');
    expect(editor).toContain('onOpeningAdd={(opening) => setOpenings((items) => [...items, opening])}');
    expect(editor).toContain('onWallSelect={setSelectedWallId}');
    expect(editor).toContain('showOnboarding && <OnboardingPanel');
    expect(editor).toContain('<StatusBar');
  });
});
