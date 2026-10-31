import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('marketing phone floating controls', () => {
  it('marks the marketing surface and keeps global helpers compact on phones', () => {
    const layout = readFileSync(
      resolve(process.cwd(), 'src/components/layouts/MarketingLayout.tsx'),
      'utf8',
    );
    const css = readFileSync(
      resolve(process.cwd(), 'src/styles/vish-device-unity.css'),
      'utf8',
    );

    expect(layout).toContain("document.body.dataset.vishSurface = 'marketing'");
    expect(layout).toContain("delete document.body.dataset.vishSurface");

    expect(css).toContain("body[data-vish-surface='marketing'] .vish-voice-tour-launch");
    expect(css).toContain("body[data-vish-surface='marketing'] .vish-theme-controller");
    expect(css).toContain("body[data-vish-surface='marketing'] .mantra-widget");
    expect(css).toContain('width: 46px');
    expect(css).toContain('height: 46px');
    expect(css).toContain('font-size: 0');
    expect(css).toContain('.vish-theme-controller__toggle-text');
    expect(css).toContain('display: none');
  });
});
