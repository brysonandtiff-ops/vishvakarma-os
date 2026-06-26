import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RADIAL_TOOL_IDS, TOOL_META } from '@/editor/toolMeta';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Editor workflow wiring', () => {
  it('registers column and stair drafting tools with shortcuts', () => {
    expect(TOOL_META.column.shortcut).toBe('C');
    expect(TOOL_META.stair.shortcut).toBe('U');
    expect(RADIAL_TOOL_IDS).toContain('column');
    expect(RADIAL_TOOL_IDS).toContain('stair');
  });

  it('wires multi-select and new tools through EditorPage and canvas', () => {
    const editor = read('src/pages/EditorPage.tsx');
    const canvas = read('src/components/editor/BlueprintCanvas.tsx');
    const engine = read('src/core/floorPlanEngine.ts');

    expect(editor).toContain('onWallsSelect={(ids) => engine.setWallSelection(ids)}');
    expect(editor).toContain('onWallDelete={(wallId) => engine.removeWall(wallId)}');
    expect(editor).toContain('onOpeningDelete={(openingId) => engine.removeOpening(openingId)}');
    expect(editor).toContain("setTool('column')");
    expect(editor).toContain("setTool('stair')");
    expect(editor).toContain('engine.addStaircase');
    expect(editor).toContain('engine.clearSelection()');
    expect(canvas).toContain('wallsInSelectionRect');
    expect(canvas).toContain("currentTool === 'column'");
    expect(canvas).toContain("currentTool === 'stair'");
    expect(engine).toContain('setWallSelection');
    expect(engine).toContain('addStaircase');
  });

  it('documents radial menu accessibility and animation hooks', () => {
    const radial = read('src/components/editor/RadialToolMenu.tsx');
    const styles = read('src/styles/vish-editor-chrome.css');

    expect(radial).toContain('role="toolbar"');
    expect(radial).toContain('vish-radial-menu');
    expect(radial).toContain('focus-visible:ring-2');
    expect(styles).toContain('@keyframes vish-radial-menu-in');
    expect(styles).toContain('.vish-canvas-tool-select');
  });
});
