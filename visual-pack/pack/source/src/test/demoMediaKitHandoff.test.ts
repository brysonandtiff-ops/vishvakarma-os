import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readme = readFileSync(resolve(process.cwd(), 'docs/demo/README.md'), 'utf8');
const verifier = readFileSync(resolve(process.cwd(), 'scripts/demo/verify-demo-assets.mjs'), 'utf8');

const expectedScreenshots = [
  '01-landing.png',
  '02-projects-demo-cards.png',
  '03-editor-2d-demo-blueprint.png',
  '04-editor-3d-preview.png',
  '05-ai-copilot-proof-flow.png',
  '06-export-preview.png',
];

describe('demo media kit handoff', () => {
  it('documents and verifies the full demo screenshot pack', () => {
    expect(readme).toContain('Landing → Projects demo card → Editor → 2D/3D → AI Copilot proof flow → Export preview');
    expect(readme).toContain('pnpm run test:screenshots');
    expect(readme).toContain('node scripts/demo/verify-demo-assets.mjs');
    expect(readme).toContain('decision-support only');

    for (const screenshot of expectedScreenshots) {
      expect(readme).toContain(screenshot);
      expect(verifier).toContain(screenshot);
    }
  });
});
