import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

describe('Vishvakarma recovery UI contracts', () => {
  it('keeps Akasha Cast mounted and exposes presentation-lock controls', () => {
    const editor = read('src/pages/EditorPage.tsx');
    const castPanel = read('src/components/editor/panels/AkashaCastPanel.tsx');

    expect(editor).toContain("import AkashaCastPanel from '@/components/editor/panels/AkashaCastPanel'");
    expect(editor).toContain('<AkashaCastPanel {...castPanelProps} />');
    expect(editor).toContain('presentationControlsOnly');
    expect(castPanel).toContain('data-testid="akasha-cast-presentation-stop"');
    expect(castPanel).toContain('min-h-[44px]');
    expect(castPanel).toContain('min-w-[44px]');
  });

  it('keeps phone workspace header controls at the 44px recovery contract', () => {
    const layout = read('src/components/layouts/AppLayout.tsx');

    expect(layout).toContain('data-testid="workspace-command-search"');
    expect(layout).toContain('data-testid="workspace-account-control"');
    expect(layout).toContain('data-testid="workspace-mobile-menu"');
    expect(layout.match(/min-h-11/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(layout.match(/min-w-11/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('preserves onboarding and consent overlay exclusivity instead of rebuilding it', () => {
    const app = read('src/App.tsx');
    const safety = read('src/styles/vish-overlay-safety.css');

    expect(app).toContain('OverlayExclusivityController');
    expect(app).toContain('data-vish-blocking-overlay');
    expect(safety).toContain("body[data-vish-blocking-overlay] .vish-analytics-consent");
    expect(safety).toContain('pointer-events: none');
  });
});
