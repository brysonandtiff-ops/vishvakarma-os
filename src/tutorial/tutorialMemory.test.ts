import { describe, expect, it, beforeEach } from 'vitest';
import {
  dismissTutorialAutoStart,
  isTutorialAutoStartDismissed,
  loadTutorialProgress,
  markTrackCompleted,
  saveTutorialProgress,
  setTrackStep,
  TUTORIAL_DISMISSED_KEY,
  TUTORIAL_PROGRESS_KEY,
} from './tutorialMemory';

describe('tutorialMemory', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads empty progress by default', () => {
    expect(loadTutorialProgress()).toEqual({ completed: [], lastStep: {} });
  });

  it('persists completed tracks and last step', () => {
    let progress = loadTutorialProgress();
    progress = setTrackStep('essentials', 'draw-wall', progress);
    saveTutorialProgress(progress);

    const loaded = loadTutorialProgress();
    expect(loaded.lastStep.essentials).toBe('draw-wall');
    expect(loaded.lastActiveTrackId).toBe('essentials');
  });

  it('marks tracks completed and clears resume pointer', () => {
    let progress = setTrackStep('essentials', 'toggle-3d', loadTutorialProgress());
    progress = markTrackCompleted('essentials', progress);
    saveTutorialProgress(progress);

    const loaded = loadTutorialProgress();
    expect(loaded.completed).toContain('essentials');
    expect(loaded.lastStep.essentials).toBeUndefined();
  });

  it('tracks auto-start dismiss flag', () => {
    expect(isTutorialAutoStartDismissed()).toBe(false);
    dismissTutorialAutoStart();
    expect(window.localStorage.getItem(TUTORIAL_DISMISSED_KEY)).toBe('1');
    expect(isTutorialAutoStartDismissed()).toBe(true);
  });

  it('recovers from corrupt progress json', () => {
    window.localStorage.setItem(TUTORIAL_PROGRESS_KEY, '{not-json');
    expect(loadTutorialProgress()).toEqual({ completed: [], lastStep: {} });
  });
});
