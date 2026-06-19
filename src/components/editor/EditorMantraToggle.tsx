import { useCallback, useEffect, useState } from 'react';
import { Music2, Pause } from 'lucide-react';
import { playMantra, stopMantra } from '@/modules/studio-audio/mantraPlayer';
import { loadMantraPrefs, saveMantraPrefs } from '@/modules/studio-audio/mantraPrefs';
import { unlockStudioAudio } from '@/modules/studio-audio/audioEngine';

/** Compact editor status-bar control for sacred mantra audio on touch devices. */
export default function EditorMantraToggle() {
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const prefs = loadMantraPrefs();
    setPlaying(prefs.enabled);
  }, []);

  const toggle = useCallback(async () => {
    setBusy(true);
    try {
      await unlockStudioAudio();
      const prefs = loadMantraPrefs();
      if (playing) {
        stopMantra();
        saveMantraPrefs({ ...prefs, enabled: false });
        setPlaying(false);
      } else {
        await playMantra(prefs.trackId, prefs.volume);
        saveMantraPrefs({ ...prefs, enabled: true });
        setPlaying(true);
      }
    } finally {
      setBusy(false);
    }
  }, [playing]);

  return (
    <button
      type="button"
      className="ws-status-item touch-target shrink-0"
      onClick={() => void toggle()}
      disabled={busy}
      aria-label={playing ? 'Pause mantra' : 'Play mantra'}
      aria-pressed={playing}
      title={playing ? 'Pause mantra' : 'Play mantra'}
      data-testid="editor-mantra-toggle"
    >
      {playing ? <Pause className="h-3 w-3" aria-hidden /> : <Music2 className="h-3 w-3" aria-hidden />}
      <span className="font-devanagari text-[9px]">{playing ? 'मौन' : 'मंत्र'}</span>
    </button>
  );
}
