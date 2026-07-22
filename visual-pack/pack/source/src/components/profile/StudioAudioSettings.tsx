import { Volume2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useStudioAudio } from '@/modules/studio-audio/StudioAudioProvider';
import { playStudioSound } from '@/modules/studio-audio/audioEngine';

export default function StudioAudioSettings() {
  const { prefs, setPrefs } = useStudioAudio();

  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-card/80 p-6 shadow-sm vish-panel-reveal">
      <div className="flex items-start gap-3">
        <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Studio audio</p>
          <p className="mt-1 text-sm text-muted-foreground">
            UI feedback sounds and optional editor ambient. Respects reduced-motion preferences.
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
        <span className="text-sm text-foreground">UI sounds</span>
        <input
          type="checkbox"
          checked={prefs.sfxEnabled}
          onChange={(e) => {
            setPrefs({ sfxEnabled: e.target.checked });
            if (e.target.checked) playStudioSound('buttonPress');
          }}
          className="h-4 w-4 accent-primary"
          aria-label="Enable UI sounds"
        />
      </label>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
        <span className="text-sm text-foreground">Editor ambient</span>
        <input
          type="checkbox"
          checked={prefs.ambientEnabled}
          onChange={(e) => setPrefs({ ambientEnabled: e.target.checked })}
          className="h-4 w-4 accent-primary"
          aria-label="Enable editor ambient sound"
        />
      </label>

      <div className="space-y-2 px-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Master volume</Label>
          <span className="font-mono text-[11px] text-muted-foreground">{Math.round(prefs.masterVolume * 100)}%</span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[prefs.masterVolume]}
          onValueChange={([value]) => setPrefs({ masterVolume: value })}
          aria-label="Master volume"
        />
      </div>
    </div>
  );
}
