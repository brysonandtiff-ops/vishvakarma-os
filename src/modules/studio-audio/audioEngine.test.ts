import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { loadStudioAudioPrefs, prefersReducedMotion, saveStudioAudioPrefs } from '@/modules/studio-audio/audioPrefs';
import { playStudioSound, resetStudioAudioForTests } from '@/modules/studio-audio/audioEngine';

describe('studio audio prefs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads defaults when storage is empty', () => {
    expect(loadStudioAudioPrefs()).toEqual({
      sfxEnabled: true,
      ambientEnabled: false,
      masterVolume: 0.65,
    });
  });

  it('persists preference updates', () => {
    saveStudioAudioPrefs({ sfxEnabled: false, ambientEnabled: true, masterVolume: 0.4 });
    expect(loadStudioAudioPrefs().sfxEnabled).toBe(false);
    expect(loadStudioAudioPrefs().ambientEnabled).toBe(true);
  });
});

describe('playStudioSound', () => {
  const createOscillator = vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    detune: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));

  beforeEach(() => {
    resetStudioAudioForTests();
    localStorage.clear();
    createOscillator.mockClear();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    vi.stubGlobal(
      'AudioContext',
      class MockAudioContext {
        state = 'running';
        currentTime = 0;
        destination = {};
        createGain = () => ({
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), value: 0.65 },
          connect: vi.fn(),
        });
        createOscillator = createOscillator;
        resume = vi.fn().mockResolvedValue(undefined);
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetStudioAudioForTests();
  });

  it('skips playback when sfx disabled', () => {
    saveStudioAudioPrefs({ sfxEnabled: false, ambientEnabled: false, masterVolume: 0.65 });
    playStudioSound('toolSelect');
    expect(createOscillator).not.toHaveBeenCalled();
  });

  it('plays when sfx enabled', () => {
    playStudioSound('toolSelect');
    expect(createOscillator).toHaveBeenCalled();
  });

  it('respects reduced motion preference', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    expect(prefersReducedMotion()).toBe(true);
    playStudioSound('toolSelect');
    expect(createOscillator).not.toHaveBeenCalled();
  });
});
