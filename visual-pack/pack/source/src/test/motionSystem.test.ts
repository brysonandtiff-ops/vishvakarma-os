import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('motion system assets', () => {
  it('defines core motion utility classes', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/vish-motion-system.css'), 'utf8');
    expect(css).toContain('.vish-page-enter');
    expect(css).toContain('.vish-pressable');
    expect(css).toContain('.vish-panel-reveal');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('imports motion system from main entry', () => {
    const main = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8');
    expect(main).toContain('vish-motion-system.css');
  });
});
