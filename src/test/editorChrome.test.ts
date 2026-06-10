import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Editor chrome consolidation', () => {
  it('wires consolidated editor chrome stylesheet through app startup', () => {
    const main = read('src/main.tsx');
    expect(main).toContain('./styles/vish-editor-chrome.css');
    expect(main).not.toContain('./styles/vish-editor-polish.css');
  });

  it('uses shared toolMeta across rail, status bar, and radial menu', () => {
    const toolRail = read('src/components/editor/ToolRail.tsx');
    const statusBar = read('src/components/editor/StatusBar.tsx');
    const radial = read('src/components/editor/RadialToolMenu.tsx');
    const toolMeta = read('src/editor/toolMeta.ts');

    expect(toolRail).toContain("@/editor/toolMeta");
    expect(statusBar).toContain("@/editor/toolMeta");
    expect(radial).toContain("@/editor/toolMeta");
    expect(toolMeta).toContain('TOOL_META');
    expect(toolMeta).toContain("wall:");
  });

  it('keeps file strip free of duplicate open/save/sample actions', () => {
    const editor = read('src/pages/EditorPage.tsx');
    const topBar = read('src/components/editor/EditorTopBar.tsx');

    expect(editor).not.toContain('EditorCommandStrip');
    expect(editor).not.toContain('Open\n      </Button>');
    expect(editor).not.toContain('Sample\n      </Button>');
    expect(topBar).toContain('onOpenProject');
    expect(topBar).toContain('onSaveProject');
    expect(topBar).toContain('vish-editor-mode-badge');
  });

  it('uses distinct phase pill classes separate from workspace mode tabs', () => {
    const phasePills = read('src/components/editor/EditorPhasePills.tsx');
    expect(phasePills).toContain('vish-phase-pill-group');
    expect(phasePills).not.toContain('vish-mode-tab-group');
  });
});
