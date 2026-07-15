import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('cross-route responsive visual audit', () => {
  it('loads the final responsive override in workspace and editor route families', () => {
    const workspaceEntry = read('src/styles/entries/workspace-base.ts');
    const editorEntry = read('src/styles/entries/editor.ts');

    expect(workspaceEntry).toContain("import '../vish-responsive-route-audit.css'");
    expect(editorEntry.trim().endsWith("import '../vish-responsive-route-audit.css';")).toBe(true);
  });

  it('prevents stale workspace classes from collapsing Projects and Profile layouts', () => {
    const styles = read('src/styles/vish-responsive-route-audit.css');

    expect(styles).toContain('.vish-projects-grid');
    expect(styles).toContain('repeat(auto-fit, minmax(min(100%, 17.5rem), 1fr))');
    expect(styles).toContain('.vish-profile-layout');
    expect(styles).toContain('flex-direction: column');
    expect(styles).toContain('.vish-profile-layout .vish-profile-sidebar');
    expect(styles).toContain('background: transparent');
  });

  it('keeps governance controls, dialogs, release cards, and audit details reachable on mobile', () => {
    const styles = read('src/styles/vish-responsive-route-audit.css');

    expect(styles).toContain(".vish-governance-shell [role='tablist']");
    expect(styles).toContain('overflow-x: auto');
    expect(styles).toContain("[data-slot='dialog-content'] .grid.grid-cols-2");
    expect(styles).toContain('.grid.grid-cols-3');
    expect(styles).toContain('.vish-audit-details');
    expect(styles).toContain('display: flex !important');
  });

  it('keeps Cast and Lite editor panes inside short touch viewports', () => {
    const styles = read('src/styles/vish-responsive-route-audit.css');

    expect(styles).toContain("[data-testid='cast-viewer-page'] > .relative.grid");
    expect(styles).toContain("[data-testid='cast-viewer-3d']");
    expect(styles).toContain("[data-testid='lite-editor-page']");
    expect(styles).toContain('height: 100dvh');
    expect(styles).toContain('overscroll-behavior: contain');
  });

  it('scales the secure-session boot composition below phone width', () => {
    const guard = read('src/components/common/RouteGuard.tsx');

    expect(guard).toContain('h-72 w-72 max-w-full');
    expect(guard).toContain('sm:h-96 sm:w-96');
    expect(guard).toContain('text-base font-bold tracking-[0.28em]');
  });

  it('keeps detached 3D controls in horizontal rails instead of consuming the viewport', () => {
    const room = read('src/pages/ThreeDRoomPage.tsx');

    expect(room).toContain('data-testid="three-d-room-page"');
    expect(room).toContain('flex-nowrap items-center gap-2 overflow-x-auto');
    expect(room).toContain('shrink-0 touch-target');
    expect(room).toContain('relative min-h-0 flex-1 overflow-hidden');
  });
});
