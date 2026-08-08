// Solar timeline scrubber for lighting control
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { LightingConfig } from '@/types';
import { LIGHTING_PRESETS } from '@/core/lightingPresets';

interface SolarTimelineProps {
  lighting: LightingConfig;
  onLightingChange: (lighting: LightingConfig) => void;
}

export default function SolarTimeline({ lighting, onLightingChange }: SolarTimelineProps) {
  const handleTimeChange = (value: number[]) => {
    const timeOfDay = value[0];
    const sunElevation = Math.max(0, Math.sin(((timeOfDay - 6) / 12) * Math.PI) * 90);

    onLightingChange({
      ...lighting,
      timeOfDay,
      sunElevation,
    });
  };

  const handleAzimuthChange = (value: number[]) => {
    onLightingChange({
      ...lighting,
      sunAzimuth: value[0],
    });
  };

  const handleIntensityChange = (value: number[]) => {
    onLightingChange({
      ...lighting,
      intensity: value[0],
    });
  };

  return (
    <div data-tutorial="solar-timeline" className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs text-slate-300">Presets</Label>
        <div className="flex flex-wrap gap-1.5">
          {LIGHTING_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 touch-target px-2 text-[10px] font-semibold uppercase tracking-wide border-vish-navy-700/50 hover:bg-vish-navy-800 text-slate-300"
              onClick={() => onLightingChange({ ...lighting, ...preset.lighting })}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Time of Day */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-slate-300">Time of Day</Label>
          <span className="font-technical text-xs text-vish-gold">
            {Math.floor(lighting.timeOfDay)}:
            {String(Math.round((lighting.timeOfDay % 1) * 60)).padStart(2, '0')}
          </span>
        </div>
        <Slider
          value={[lighting.timeOfDay]}
          onValueChange={handleTimeChange}
          min={0}
          max={24}
          step={0.25}
          className="touch-target"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-technical uppercase">
          <span>00:00</span>
          <span>12:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* Sun Direction (Azimuth) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-slate-300">Sun Direction</Label>
          <span className="font-technical text-xs text-vish-gold">
            {Math.round(lighting.sunAzimuth)}°
          </span>
        </div>
        <Slider
          value={[lighting.sunAzimuth]}
          onValueChange={handleAzimuthChange}
          min={0}
          max={360}
          step={1}
          className="touch-target"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-technical uppercase">
          <span>N</span>
          <span>E</span>
          <span>S</span>
          <span>W</span>
        </div>
      </div>

      {/* Light Intensity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-slate-300">Intensity</Label>
          <span className="font-technical text-xs text-vish-gold">
            {Math.round(lighting.intensity * 100)}%
          </span>
        </div>
        <Slider
          value={[lighting.intensity]}
          onValueChange={handleIntensityChange}
          min={0}
          max={1}
          step={0.01}
          className="touch-target"
        />
      </div>

      {/* Sun Elevation (Read-only display) */}
      <div className="rounded-md bg-vish-navy-950 border border-vish-navy-800 p-3 shadow-inner">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Sun Elevation</span>
          <span className="font-technical font-medium text-slate-200">
            {Math.round(lighting.sunElevation)}°
          </span>
        </div>
      </div>
    </div>
  );
}
