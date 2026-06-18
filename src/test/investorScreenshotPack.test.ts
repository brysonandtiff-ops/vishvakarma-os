import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const investorPack = readFileSync(
  resolve(process.cwd(), 'docs/demo/VISHVAKARMA_OS_INVESTOR_SCREENSHOT_PACK.md'),
  'utf8',
);

const requiredSections = [
  '## 1. Problem',
  '## 2. Product',
  '## 3. Demo flow',
  '## 6. AI proof',
  '## 7. Export preview',
  '## 8. Market use',
  '## 9. AUD value frame',
  '## 10. Next pilot plan',
];

const requiredScreenshots = [
  'screenshots/01-landing.png',
  'screenshots/02-projects-demo-cards.png',
  'screenshots/03-editor-2d-demo-blueprint.png',
  'screenshots/04-editor-3d-preview.png',
  'screenshots/05-ai-copilot-proof-flow.png',
  'screenshots/06-export-preview.png',
];

describe('investor screenshot pack', () => {
  it('keeps the pitch story, screenshots, AUD framing, and safety wording aligned', () => {
    for (const section of requiredSections) {
      expect(investorPack).toContain(section);
    }

    for (const screenshot of requiredScreenshots) {
      expect(investorPack).toContain(screenshot);
    }

    expect(investorPack).toContain('Problem → Product → Demo flow → AI proof → Export preview → Market use → AUD value → Next pilot');
    expect(investorPack).toContain('AUD');
    expect(investorPack).toContain('decision-support');
    expect(investorPack).toContain('not certified building approval');
    expect(investorPack).toContain('fixed construction quote');
  });
});
