import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('phone feature metric density', () => {
  it('keeps the feature proof grid compact on phones', () => {
    const page = readFileSync(resolve(process.cwd(), 'src/pages/FeaturesPage.tsx'), 'utf8');
    const css = readFileSync(resolve(process.cwd(), 'src/styles/vish-device-unity.css'), 'utf8');

    expect(page).toContain('vish-features-metrics');
    expect(page).toContain('mt-10 grid grid-cols-2 gap-2');
    expect(css).toContain('.vish-features-metrics .vish-stat-pill');
    expect(css).toContain('min-height: 4.4rem');
    expect(css).toContain('padding: 0.7rem 0.45rem');
    expect(css).toContain('font-size: 0.58rem');
  });
});
