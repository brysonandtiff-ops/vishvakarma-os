import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const demoFlow = readFileSync(
  new URL('../../docs/demo/VISHVAKARMA_OS_2_MIN_DEMO_FLOW.md', import.meta.url),
  'utf8',
);

describe('2-minute demo flow documentation', () => {
  it('keeps the investor walkthrough and safety wording aligned', () => {
    expect(demoFlow).toContain('Landing → Projects demo card → Editor → 2D/3D → AI Copilot proof flow → Export preview');
    expect(demoFlow).toContain('AUD estimate');
    expect(demoFlow).toContain('decision-support');
    expect(demoFlow).toContain('not certified building approval');
    expect(demoFlow).toContain('No secrets, keys, dashboards');
  });
});
