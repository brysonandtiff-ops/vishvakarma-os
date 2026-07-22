import { describe, expect, it } from 'vitest';
import { TUTORIAL_TRACKS } from './tutorialCatalog';

describe('tutorialCatalog', () => {
  it('defines all planned tracks with valid steps', () => {
    expect(TUTORIAL_TRACKS.length).toBeGreaterThanOrEqual(12);

    for (const track of TUTORIAL_TRACKS) {
      expect(track.id).toBeTruthy();
      expect(track.steps.length).toBeGreaterThan(0);

      for (const step of track.steps) {
        expect(step.id).toBeTruthy();
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.body.length).toBeGreaterThan(10);
        expect(step.target || step.placement === 'center').toBeTruthy();
      }
    }
  });

  it('uses unique track and step ids', () => {
    const trackIds = TUTORIAL_TRACKS.map((t) => t.id);
    expect(new Set(trackIds).size).toBe(trackIds.length);

    for (const track of TUTORIAL_TRACKS) {
      const stepIds = track.steps.map((s) => s.id);
      expect(new Set(stepIds).size).toBe(stepIds.length);
    }
  });
});
