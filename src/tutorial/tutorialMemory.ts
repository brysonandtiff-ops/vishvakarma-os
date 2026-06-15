import type { TutorialProgress } from './types';

export const TUTORIAL_PROGRESS_KEY = 'vishvakarma.os.tutorialProgress.v1';
export const TUTORIAL_DISMISSED_KEY = 'vishvakarma.os.tutorialDismissed.v1';

const EMPTY_PROGRESS: TutorialProgress = {
  completed: [],
  lastStep: {},
};

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadTutorialProgress(): TutorialProgress {
  if (!hasStorage()) return { ...EMPTY_PROGRESS };
  try {
    const raw = window.localStorage.getItem(TUTORIAL_PROGRESS_KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as TutorialProgress;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      lastStep: parsed.lastStep && typeof parsed.lastStep === 'object' ? parsed.lastStep : {},
      lastActiveTrackId: parsed.lastActiveTrackId,
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export function saveTutorialProgress(progress: TutorialProgress) {
  if (!hasStorage()) return;
  window.localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(progress));
}

export function isTutorialAutoStartDismissed() {
  if (!hasStorage()) return false;
  return window.localStorage.getItem(TUTORIAL_DISMISSED_KEY) === '1';
}

export function dismissTutorialAutoStart() {
  if (!hasStorage()) return;
  window.localStorage.setItem(TUTORIAL_DISMISSED_KEY, '1');
}

export function markTrackCompleted(trackId: string, progress: TutorialProgress): TutorialProgress {
  const completed = progress.completed.includes(trackId)
    ? progress.completed
    : [...progress.completed, trackId];
  const lastStep = { ...progress.lastStep };
  delete lastStep[trackId];
  return { ...progress, completed, lastStep, lastActiveTrackId: undefined };
}

export function setTrackStep(trackId: string, stepId: string, progress: TutorialProgress): TutorialProgress {
  return {
    ...progress,
    lastStep: { ...progress.lastStep, [trackId]: stepId },
    lastActiveTrackId: trackId,
  };
}
