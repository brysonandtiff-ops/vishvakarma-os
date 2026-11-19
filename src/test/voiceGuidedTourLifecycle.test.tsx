import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VoiceGuidedTour from '@/voice-tour/VoiceGuidedTour';
import { OPEN_VOICE_TOUR_EVENT } from '@/voice-tour/voiceTourContent';

vi.mock('@/tutorial/TutorialProvider', () => ({
  openTutorialHub: vi.fn(),
  startTutorial: vi.fn(),
}));

const speech = {
  cancel: vi.fn(),
  speak: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
};

describe('voice tour cancellation and audio safety', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.stubGlobal('speechSynthesis', speech);
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      text: string;
      rate = 1;
      pitch = 1;
      volume = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) { this.text = text; }
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('cancels delayed guided-tour autoplay when closed before the speech starts', () => {
    render(<MemoryRouter><VoiceGuidedTour /></MemoryRouter>);
    act(() => {
      window.dispatchEvent(new CustomEvent(OPEN_VOICE_TOUR_EVENT, { detail: { autoPlay: true } }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close voice tour' }));
    act(() => { vi.advanceTimersByTime(400); });
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it('never starts a second chapter after Next is queued and the tour is closed', () => {
    render(<MemoryRouter><VoiceGuidedTour /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Open voice guided software tour' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(speech.speak).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close voice tour' }));
    act(() => { vi.advanceTimersByTime(400); });
    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.cancel).toHaveBeenCalled();
  });
});
