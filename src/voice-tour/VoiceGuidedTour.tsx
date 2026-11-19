import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mic2,
  Pause,
  Play,
  Radio,
  Volume2,
  X,
} from 'lucide-react';
import { openTutorialHub, startTutorial } from '@/tutorial/TutorialProvider';
import { useNarrationVoices } from '@/voice-tour/useNarrationVoices';
import { createNarrationUtterance, NARRATION_VOICE_SAMPLE } from '@/voice-tour/voiceQuality';
import {
  OPEN_VOICE_TOUR_EVENT,
  VOICE_TOUR_CHAPTERS,
  WHOLE_SOFTWARE_TOUR_ID,
  type VoiceTourChapter,
} from './voiceTourContent';

type PlaybackState = 'idle' | 'speaking' | 'paused';

function hasBrowserSpeech(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

export function openVoiceTour(options?: { autoPlay?: boolean }) {
  window.dispatchEvent(
    new CustomEvent(OPEN_VOICE_TOUR_EVENT, {
      detail: { autoPlay: options?.autoPlay ?? false },
    }),
  );
}

export default function VoiceGuidedTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [playback, setPlayback] = useState<PlaybackState>('idle');
  const [preferMp3, setPreferMp3] = useState(false);
  const [status, setStatus] = useState('Tap Play to try the device narrator, or read the complete chapter below.');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoPlayTimerRef = useRef<number | null>(null);
  const speechSupported = useMemo(() => hasBrowserSpeech(), []);
  const { voices, settings, updateSettings } = useNarrationVoices();

  const chapter = VOICE_TOUR_CHAPTERS[chapterIndex] ?? VOICE_TOUR_CHAPTERS[0];

  const stopPlayback = useCallback(() => {
    if (autoPlayTimerRef.current !== null) {
      window.clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (speechRef.current) {
      speechRef.current.onend = null;
      speechRef.current.onerror = null;
      speechRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayback('idle');
  }, []);

  const navigateForChapter = useCallback(
    (nextChapter: VoiceTourChapter) => {
      if (nextChapter.route && location.pathname !== nextChapter.route) {
        navigate(nextChapter.route);
      }
    },
    [location.pathname, navigate],
  );

  const speakWithBrowser = useCallback(
    (nextChapter: VoiceTourChapter) => {
      if (!speechSupported) {
        setStatus('Spoken narration is unavailable here. Read the complete chapter below; you can still navigate every lesson.');
        setPlayback('idle');
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = createNarrationUtterance(`${nextChapter.title}. ${nextChapter.narration}`, voices, settings);
      utterance.onend = () => {
        if (speechRef.current !== utterance) return;
        speechRef.current = null;
        setPlayback('idle');
        setStatus('Chapter complete. Choose Next or replay this chapter.');
      };
      utterance.onerror = () => {
        if (speechRef.current !== utterance) return;
        speechRef.current = null;
        setPlayback('idle');
        setStatus('Device narration was interrupted. The complete chapter is readable below; try another voice if you wish.');
      };
      speechRef.current = utterance;
      setPlayback('speaking');
      setStatus('Speaking with your selected device voice.');
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        speechRef.current = null;
        setPlayback('idle');
        setStatus('This device could not start speech. Read the complete chapter below or try another voice.');
      }
    },
    [speechSupported, voices, settings],
  );

  const playChapter = useCallback(
    (nextChapter: VoiceTourChapter = chapter) => {
      setOpen(true);
      stopPlayback();
      navigateForChapter(nextChapter);

      if (preferMp3) {
        const audio = new Audio(nextChapter.mp3Src);
        audioRef.current = audio;
        audio.onended = () => {
          if (audioRef.current !== audio) return;
          audioRef.current = null;
          setPlayback('idle');
          setStatus('MP3 chapter complete.');
        };
        audio.onerror = () => {
          if (audioRef.current !== audio) return;
          audioRef.current = null;
          setStatus('MP3 not available. Switching to selected device voice.');
          speakWithBrowser(nextChapter);
        };
        setPlayback('speaking');
        setStatus('Trying MP3 voice file.');
        void audio.play().catch(() => {
          if (audioRef.current !== audio) return;
          audioRef.current = null;
          setStatus('MP3 was blocked or missing. Switching to selected device voice.');
          speakWithBrowser(nextChapter);
        });
        return;
      }

      speakWithBrowser(nextChapter);
    },
    [chapter, navigateForChapter, preferMp3, speakWithBrowser, stopPlayback],
  );

  const pauseOrResume = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        void audioRef.current.play();
        setPlayback('speaking');
      } else {
        audioRef.current.pause();
        setPlayback('paused');
      }
      return;
    }

    if (!speechSupported) return;
    if (playback === 'speaking') {
      window.speechSynthesis.pause();
      setPlayback('paused');
    } else if (playback === 'paused') {
      window.speechSynthesis.resume();
      setPlayback('speaking');
    }
  }, [playback, speechSupported]);

  const selectChapter = useCallback(
    (index: number, autoPlay = false) => {
      const clamped = Math.max(0, Math.min(index, VOICE_TOUR_CHAPTERS.length - 1));
      const nextChapter = VOICE_TOUR_CHAPTERS[clamped];
      setChapterIndex(clamped);
      stopPlayback();
      navigateForChapter(nextChapter);
      setStatus(`Ready: ${nextChapter.title}`);
      if (autoPlay) {
        autoPlayTimerRef.current = window.setTimeout(() => {
          autoPlayTimerRef.current = null;
          playChapter(nextChapter);
        }, 250);
      }
    },
    [navigateForChapter, playChapter, stopPlayback],
  );

  useEffect(() => {
    const onOpenVoiceTour = (event: Event) => {
      const detail = (event as CustomEvent<{ autoPlay?: boolean }>).detail;
      setOpen(true);
      if (detail?.autoPlay) {
        stopPlayback();
        autoPlayTimerRef.current = window.setTimeout(() => {
          autoPlayTimerRef.current = null;
          playChapter(VOICE_TOUR_CHAPTERS[chapterIndex]);
        }, 150);
      }
    };
    window.addEventListener(OPEN_VOICE_TOUR_EVENT, onOpenVoiceTour);
    return () => window.removeEventListener(OPEN_VOICE_TOUR_EVENT, onOpenVoiceTour);
  }, [chapterIndex, playChapter, stopPlayback]);

  useEffect(() => stopPlayback, [stopPlayback]);

  const hearVoiceSample = () => {
    stopPlayback();
    if (!speechSupported) {
      setStatus('This browser does not support speech. All chapter text is available below.');
      return;
    }
    const utterance = createNarrationUtterance(NARRATION_VOICE_SAMPLE, voices, settings);
    utterance.onend = () => {
      if (speechRef.current !== utterance) return;
      speechRef.current = null;
      setStatus('Voice sample completed.');
    };
    utterance.onerror = () => {
      if (speechRef.current !== utterance) return;
      speechRef.current = null;
      setStatus('Voice sample unavailable. Try another installed voice.');
    };
    speechRef.current = utterance;
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      speechRef.current = null;
      setStatus('Voice sample could not start. Try another installed voice.');
    }
    setStatus('Playing selected narrator sample.');
  };

  const nextDisabled = chapterIndex >= VOICE_TOUR_CHAPTERS.length - 1;
  const prevDisabled = chapterIndex <= 0;

  if (!open) {
    return (
      <button
        type="button"
        className="vish-voice-tour-launch touch-target"
        onClick={() => setOpen(true)}
        aria-label="Open voice guided software tour"
      >
        <Volume2 className="h-4 w-4" />
        Voice tour
      </button>
    );
  }

  return (
    <aside className="vish-voice-tour-panel" aria-label="Voice guided software tour">
      <div className="vish-voice-tour-panel__header">
        <div>
          <p className="vish-voice-tour-panel__eyebrow">Guided tour</p>
          <h2>Whole software walkthrough</h2>
        </div>
        <button type="button" className="vish-voice-tour-panel__icon" onClick={() => { stopPlayback(); setOpen(false); }} aria-label="Close voice tour">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="vish-voice-tour-panel__active">
        <span>{chapterIndex + 1}/{VOICE_TOUR_CHAPTERS.length}</span>
        <strong>{chapter.title}</strong>
        <p>{chapter.summary}</p>
      </div>

      <details className="vish-voice-tour-panel__transcript" open>
        <summary>Complete chapter narration — read without sound</summary>
        <p>{chapter.narration}</p>
        <small>These are the chapter's spoken words. Reading them does not require an account upgrade, audio playback or any external service.</small>
      </details>

      <div className="vish-voice-tour-panel__controls">
        <button type="button" onClick={() => playChapter()} className="vish-voice-tour-panel__primary touch-target">
          <Play className="h-4 w-4" />
          Play
        </button>
        <button type="button" onClick={pauseOrResume} className="vish-voice-tour-panel__secondary touch-target" disabled={playback === 'idle'}>
          {playback === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {playback === 'paused' ? 'Resume' : 'Pause'}
        </button>
        <button type="button" onClick={stopPlayback} className="vish-voice-tour-panel__secondary touch-target">
          Stop
        </button>
      </div>

      <div className="vish-voice-tour-panel__row">
        <button type="button" onClick={() => selectChapter(chapterIndex - 1)} disabled={prevDisabled} className="vish-voice-tour-panel__nav touch-target">
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button type="button" onClick={() => selectChapter(chapterIndex + 1, playback === 'speaking')} disabled={nextDisabled} className="vish-voice-tour-panel__nav touch-target">
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="vish-voice-tour-panel__toggles">
        <button
          type="button"
          className="vish-voice-tour-panel__chip touch-target"
          aria-pressed={preferMp3}
          onClick={() => setPreferMp3((value) => !value)}
        >
          <Radio className="h-4 w-4" />
          {preferMp3 ? 'MP3 first' : 'Browser voice'}
        </button>
        <button
          type="button"
          className="vish-voice-tour-panel__chip touch-target"
          onClick={() => startTutorial(chapter.tutorialTrackId ?? WHOLE_SOFTWARE_TOUR_ID)}
        >
          <Mic2 className="h-4 w-4" />
          Overlay steps
        </button>
      </div>

      <div className="vish-voice-tour-panel__voice-options">
        <label htmlFor="vish-tour-narrator">Narrator
          <select id="vish-tour-narrator" value={settings.voiceURI}
            onChange={(event) => { stopPlayback(); updateSettings({ voiceURI: event.target.value }); }}>
            <option value="">Automatic — Australian English preferred</option>
            {voices.map((item) => <option key={item.voiceURI} value={item.voiceURI}>{item.name} · {item.lang}</option>)}
          </select>
        </label>
        <label htmlFor="vish-tour-pace">Pace
          <select id="vish-tour-pace" value={settings.rate}
            onChange={(event) => { stopPlayback(); updateSettings({ rate: Number(event.target.value) }); }}>
            <option value="0.9">Relaxed</option><option value="0.98">Natural</option><option value="1.08">Brisk</option>
          </select>
        </label>
        <button type="button" onClick={hearVoiceSample} disabled={!speechSupported}
          className="vish-voice-tour-panel__secondary touch-target">Hear voice sample</button>
        <p>Voices are from this device. Preview to find one you enjoy.</p>
      </div>
      <div className="vish-voice-tour-panel__chapters" aria-label="Voice tour chapters">
        {VOICE_TOUR_CHAPTERS.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`vish-voice-tour-panel__chapter ${index === chapterIndex ? 'active' : ''}`}
            onClick={() => selectChapter(index)}
          >
            <span>{index + 1}</span>
            <strong>{item.title}</strong>
            {index < chapterIndex && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
          </button>
        ))}
      </div>

      <div className="vish-voice-tour-panel__footer">
        <span aria-live="polite">{status}</span>
        <button type="button" onClick={openTutorialHub}>Open tutorial hub</button>
      </div>
    </aside>
  );
}
