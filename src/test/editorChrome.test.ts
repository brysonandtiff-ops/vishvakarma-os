import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Editor chrome consolidation', () => {
  it('wires consolidated editor chrome through the lazy editor style entry', () => {
    const editorStyles = read('src/styles/entries/editor.ts');
    const routes = read('src/AppRoutes.tsx');

    expect(editorStyles).toContain("import '../vish-editor-chrome.css'");
    expect(editorStyles).toContain("import '../vish-editor-polish.css'");
    expect(editorStyles).toContain("import '../vish-ipad-editor-usability.css'");
    expect(routes).toContain("import('@/styles/entries/editor')");
  });

  it('uses shared editor action registry for project menus', () => {
    const registry = read('src/editor/editorActionRegistry.ts');
    const topBar = read('src/components/editor/EditorTopBar.tsx');
    const welcome = read('src/components/editor/WelcomeOverlay.tsx');

    expect(registry).toContain('loadSampleBlueprint');
    expect(topBar).toContain('editorActionRegistry');
    expect(welcome).toContain('editorActionRegistry');
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

  it('guards iPad editor controls with reliable touch/pen activation', () => {
    const helper = read('src/hooks/useReliablePress.ts');
    const topBar = read('src/components/editor/EditorTopBar.tsx');
    const statusBar = read('src/components/editor/StatusBar.tsx');

    expect(helper).toContain("event.pointerType !== 'touch'");
    expect(helper).toContain("event.pointerType !== 'pen'");
    expect(helper).toContain('suppressNextClickRef');
    expect(topBar).toContain('useReliablePress');
    expect(topBar).toContain("label={gridVisible ? 'Hide grid' : 'Show grid'}");
    expect(topBar).toContain('touch-manipulation');
    expect(statusBar).toContain('StatusActionButton');
    expect(statusBar).toContain('touch-manipulation');
  });

  it('keeps iPad editor windows and chrome reachable inside safe areas', () => {
    const ipadCss = read('src/styles/vish-ipad-editor-usability.css');
    const ipadKingCss = read('src/styles/vish-ipad-king-polish.css');
    const dialog = read('src/components/ui/dialog.tsx');
    const sheet = read('src/components/ui/sheet.tsx');

    expect(ipadCss).toContain('.bg-ws-canvas .vish-editor-topbar');
    expect(ipadCss).toContain('overflow-x: auto');
    expect(ipadCss).toContain("[role='dialog']");
    expect(ipadCss).toContain("[data-slot='dialog-content']");
    expect(ipadCss).toContain("[data-slot='dialog-footer']");
    expect(ipadCss).toContain('[data-radix-popper-content-wrapper]');
    expect(ipadCss).toContain('.bg-ws-canvas .vish-3d-viewport-pane');
    expect(ipadCss).toContain('var(--vish-safe-bottom');
    expect(ipadKingCss).toContain("[data-slot='dialog-content']");
    expect(ipadKingCss).toContain('overflow-y: auto !important');
    expect(dialog).toContain('data-slot="dialog-content"');
    expect(dialog).toContain('min-h-[44px]');
    expect(sheet).toContain('data-slot="sheet-content"');
    expect(sheet).toContain('min-h-[44px]');
  });

  it('remeasures canvas on iPad orientation and visual viewport changes', () => {
    const resizeHook = read('src/hooks/useCanvasResize.ts');

    expect(resizeHook).toContain("window.addEventListener('orientationchange'");
    expect(resizeHook).toContain("window.visualViewport?.addEventListener('resize'");
    expect(resizeHook).toContain('requestAnimationFrame');
    expect(resizeHook).toContain('clearTimeout');
  });

  it('uses distinct phase pill classes separate from workspace mode tabs', () => {
    const phasePills = read('src/components/editor/EditorPhasePills.tsx');
    expect(phasePills).toContain('vish-phase-pill-group');
    expect(phasePills).not.toContain('vish-mode-tab-group');
  });
});
