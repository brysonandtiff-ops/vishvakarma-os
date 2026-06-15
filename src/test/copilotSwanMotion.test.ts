import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('copilot swan motion assets', () => {
  it('defines wing flap keyframes and reduced-motion guard', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/vish-copilot-swan.css'), 'utf8');
    expect(css).toContain('@keyframes vish-copilot-wing-flap');
    expect(css).toContain('@keyframes vish-copilot-sparkle-twinkle');
    expect(css).toContain('@keyframes vish-copilot-scan-shimmer');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('imports copilot swan styles from main entry', () => {
    const main = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8');
    expect(main).toContain('vish-copilot-swan.css');
  });

  it('registers optional flap frame paths in officialLogo.ts', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/brand/officialLogo.ts'), 'utf8');
    expect(source).toContain('COPILOT_SWAN_FLAP_FRAMES');
    expect(source).toContain('hasCopilotSwanFlapFrames');
  });
});
