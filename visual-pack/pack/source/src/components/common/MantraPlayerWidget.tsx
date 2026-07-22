/**
 * MantraPlayerWidget.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A floating sacred mantra audio player widget for Vishvakarma.OS.
 *
 * Features:
 * - Floating button (bottom-right) with animated mandala ring when playing
 * - Expandable panel with track selector, volume slider, and play/pause
 * - Three authentic Indian mantra tracks
 * - Persists user preference to localStorage
 * - Respects prefers-reduced-motion
 * - Integrates with the existing StudioAudio AudioContext
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Music2, Pause, Play, Volume2, VolumeX, X, ChevronUp } from 'lucide-react';
import {
  MANTRA_TRACKS,
  playMantra,
  stopMantra,
  setMantraVolume,
  resumeMantraAfterGesture,
} from '@/modules/studio-audio/mantraPlayer';
import {
  loadMantraPrefs,
  saveMantraPrefs,
  type MantraPrefs,
} from '@/modules/studio-audio/mantraPrefs';
import { unlockStudioAudio } from '@/modules/studio-audio/audioEngine';

// ── Component ─────────────────────────────────────────────────────────────────

export function MantraPlayerWidget() {
  const [prefs, setPrefsState] = useState<MantraPrefs>(() => loadMantraPrefs());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Persist prefs whenever they change
  const setPrefs = useCallback((patch: Partial<MantraPrefs>) => {
    setPrefsState((current) => {
      const next = { ...current, ...patch };
      saveMantraPrefs(next);
      return next;
    });
  }, []);

  // Resume after autoplay block on first gesture
  useEffect(() => {
    const onGesture = () => {
      void unlockStudioAudio().then(() => resumeMantraAfterGesture());
    };
    window.addEventListener('pointerdown', onGesture, { once: true });
    return () => window.removeEventListener('pointerdown', onGesture);
  }, []);

  // Resume playback when prefs load (e.g., user had it enabled last session)
  useEffect(() => {
    if (prefs.enabled) {
      setLoading(true);
      void playMantra(prefs.trackId, prefs.volume).finally(() => setLoading(false));
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleTogglePlay = useCallback(async () => {
    await unlockStudioAudio();
    if (prefs.enabled) {
      stopMantra();
      setPrefs({ enabled: false });
    } else {
      setLoading(true);
      try {
        await playMantra(prefs.trackId, prefs.volume);
        setPrefs({ enabled: true });
      } finally {
        setLoading(false);
      }
    }
  }, [prefs.enabled, prefs.trackId, prefs.volume, setPrefs]);

  const handleSelectTrack = useCallback(
    async (trackId: string) => {
      setPrefs({ trackId });
      if (prefs.enabled) {
        setLoading(true);
        try {
          await playMantra(trackId, prefs.volume);
        } finally {
          setLoading(false);
        }
      }
    },
    [prefs.enabled, prefs.volume, setPrefs],
  );

  const handleVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = parseFloat(e.target.value);
      setPrefs({ volume: vol });
      setMantraVolume(vol);
    },
    [setPrefs],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        void handleTogglePlay();
      }
    },
    [handleTogglePlay],
  );

  const currentTrack = MANTRA_TRACKS.find((t) => t.id === prefs.trackId) ?? MANTRA_TRACKS[0];

  return (
    <div className="mantra-widget" aria-label="Mantra audio player">
      {/* ── Expanded panel ── */}
      {open && (
        <div
          ref={panelRef}
          className="mantra-panel"
          role="dialog"
          aria-label="Mantra player controls"
        >
          {/* Panel header */}
          <div className="mantra-panel__header">
            <div className="mantra-panel__header-left">
              <span className="mantra-panel__icon">
                <Music2 size={14} />
              </span>
              <span className="mantra-panel__title">Sacred Mantras</span>
            </div>
            <button
              className="mantra-panel__close"
              onClick={() => setOpen(false)}
              aria-label="Close mantra player"
            >
              <X size={14} />
            </button>
          </div>

          {/* Now playing */}
          <div className="mantra-panel__now-playing">
            <div className="mantra-panel__sanskrit">{currentTrack.sanskrit}</div>
            <div className="mantra-panel__track-name">{currentTrack.title}</div>
            <div className="mantra-panel__track-sub">{currentTrack.subtitle}</div>
          </div>

          {/* Play / pause */}
          <button
            className={`mantra-panel__play-btn ${prefs.enabled ? 'playing' : ''}`}
            onClick={() => void handleTogglePlay()}
            disabled={loading}
            aria-label={prefs.enabled ? 'Pause mantra' : 'Play mantra'}
          >
            {loading ? (
              <span className="mantra-panel__loading-ring" aria-hidden="true" />
            ) : prefs.enabled ? (
              <Pause size={20} />
            ) : (
              <Play size={20} />
            )}
          </button>

          {/* Track selector */}
          <div className="mantra-panel__tracks" role="radiogroup" aria-label="Select mantra track">
            {MANTRA_TRACKS.map((track) => (
              <button
                key={track.id}
                role="radio"
                aria-checked={prefs.trackId === track.id}
                className={`mantra-track-btn ${prefs.trackId === track.id ? 'active' : ''}`}
                onClick={() => void handleSelectTrack(track.id)}
              >
                <span className="mantra-track-btn__sanskrit">{track.sanskrit}</span>
                <span className="mantra-track-btn__name">{track.title}</span>
                <span className="mantra-track-btn__sub">{track.subtitle}</span>
              </button>
            ))}
          </div>

          {/* Volume */}
          <div className="mantra-panel__volume">
            <span className="mantra-panel__vol-icon" aria-hidden="true">
              {prefs.volume < 0.05 ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={prefs.volume}
              onChange={handleVolume}
              className="mantra-volume-slider"
              aria-label="Mantra volume"
            />
            <span className="mantra-panel__vol-pct">{Math.round(prefs.volume * 100)}%</span>
          </div>

          {/* Footer note */}
          <p className="mantra-panel__footer">
            ॐ — Sacred ambient music for focused creation
          </p>
        </div>
      )}

      {/* Discoverable label when collapsed */}
      {!open && (
        <span className="mantra-fab__label" aria-hidden="true">
          Mantras
        </span>
      )}

      {/* ── Floating trigger button ── */}
      <button
        ref={buttonRef}
        className={`mantra-fab ${prefs.enabled ? 'playing' : ''} ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-label={
          open
            ? 'Close mantra player'
            : prefs.enabled
              ? 'Mantra playing — click to open controls'
              : 'Open mantra player'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {/* Animated mandala ring when playing */}
        {prefs.enabled && (
          <>
            <span className="mantra-fab__ring mantra-fab__ring--outer" aria-hidden="true" />
            <span className="mantra-fab__ring mantra-fab__ring--inner" aria-hidden="true" />
          </>
        )}

        {/* Icon */}
        <span className="mantra-fab__icon" aria-hidden="true">
          {open ? <ChevronUp size={18} /> : <Music2 size={18} />}
        </span>

        {/* Playing dot indicator */}
        {prefs.enabled && !open && (
          <span className="mantra-fab__dot" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export default MantraPlayerWidget;
