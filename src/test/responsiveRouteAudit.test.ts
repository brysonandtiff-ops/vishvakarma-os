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

  it('does not ship a secure-session or startup boot composition at any phone width', () => {
    const guard = read('src/components/common/RouteGuard.tsx');
    const html = read('index.html');
    const authLayout = read('src/components/layouts/AuthLayout.tsx');

    expect(guard).not.toContain('SessionBootScreen');
    expect(guard).not.toContain('vish-boot-');
    expect(html).toContain('id="boot-splash"');
    expect(html).toContain('pointer-events:none');
    expect(html).toContain('rel="apple-touch-startup-image"');
    expect(authLayout).not.toContain('variant="boot"');
  });

  it('keeps detached 3D controls in horizontal rails instead of consuming the viewport', () => {
    const room = read('src/pages/ThreeDRoomPage.tsx');

    expect(room).toContain('data-testid="three-d-room-page"');
    expect(room).toContain('flex-nowrap items-center gap-2 overflow-x-auto');
    expect(room).toContain('shrink-0 touch-target');
    expect(room).toContain('relative min-h-0 flex-1 overflow-hidden');
  });
  it('detached room fits inside the workstation viewport on phone, tablet, and desktop', () => {
    const layout = read('src/components/layouts/AppLayout.tsx');
    const room = read('src/pages/ThreeDRoomPage.tsx');

    // Parent AppLayout already owns the viewport; a second 100dvh layer clipped
    // the 3D canvas underneath the command bar on short screens.
    expect(layout).toContain('vish-workspace-shell flex flex-col h-[100dvh]');
    expect(room).toContain('className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background text-ws-text"');
    expect(room).not.toContain('flex h-[100dvh] min-h-0 flex-col');
    expect(room).toContain('relative min-h-0 flex-1 overflow-hidden');
  });

  it('keeps small phone labels readable and desktop keyboard focus reachable', () => {
    const styles = read('src/styles/vish-device-unity.css');

    // The prior 0.54rem/0.58rem (~9px) trust/feature labels were too small.
    expect(styles).not.toContain('font-size: 0.54rem;');
    expect(styles).not.toContain('font-size: 0.58rem;');
    expect(styles).toContain('font-size: 0.8125rem;');
    expect(styles).toContain('@media (max-width: 390px)');
    expect(styles).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(styles).toContain('@media (pointer: coarse) and (max-width: 1194px)');
    expect(styles).toContain('font-size: max(16px, 1em)');
    expect(styles).toContain('@media (hover: hover) and (pointer: fine)');
    expect(styles).toContain(':focus-visible');
  });

  it('does not hide 3D movement actions on short phone landscape', () => {
    const styles = read('src/styles/vish-device-unity.css');
    const room = read('src/pages/ThreeDRoomPage.tsx');

    expect(styles).toContain("@media (orientation: landscape) and (max-height: 560px)");
    expect(styles).toContain("overflow-x: auto;");
    expect(room).toContain('Walk mode');
    expect(room).toContain('Reload snapshot');
    expect(room).toContain('Back to editor');
  });

});
