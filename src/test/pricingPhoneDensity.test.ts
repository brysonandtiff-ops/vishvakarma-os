import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('phone pricing density', () => {
  it('keeps pricing trust metrics compact at 640px and below', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/styles/vish-device-unity.css'),
      'utf8',
    );

    expect(css).toContain('.vish-marketing-page .vish-pricing-trust-row');
    expect(css).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(css).toContain('.vish-pricing-trust-row .vish-stat-pill');
    expect(css).toContain('padding: 0.8rem 0.35rem');
    expect(css).toContain('font-size: 0.54rem');
  });
});
