// Solar timeline scrubber for lighting control
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Sun, Sunrise, Sunset } from 'lucide-react';
import type { LightingConfig } from '@/types';

interface SolarTimelineProps {
  lighting: LightingConfig;
  onLightingChange: (lighting: LightingConfig) => void;
}

export default function SolarTimeline({ lighting, onLightingChange }: SolarTimelineProps) {
  const handleTimeChange = (value: number[]) => {
    const timeOfDay = value[0];
    // Calculate sun elevation based on time (simple sine curve)
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

  const getTimeIcon = () => {
    if (lighting.timeOfDay < 6 || lighting.timeOfDay > 20) return Sunset;
    if (lighting.timeOfDay < 8) return Sunrise;
    return Sun;
  };

  const TimeIcon = getTimeIcon();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TimeIcon className="h-4 w-4" />
          Solar Lighting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time of Day */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Time of Day</Label>
            <span className="font-technical text-xs text-muted-foreground">
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
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>00:00</span>
            <span>12:00</span>
            <span>24:00</span>
          </div>
        </div>

        {/* Sun Direction (Azimuth) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Sun Direction</Label>
            <span className="font-technical text-xs text-muted-foreground">
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
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>N</span>
            <span>E</span>
            <span>S</span>
            <span>W</span>
          </div>
        </div>

        {/* Light Intensity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Intensity</Label>
            <span className="font-technical text-xs text-muted-foreground">
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
        <div className="rounded-md bg-muted p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Sun Elevation</span>
            <span className="font-technical font-medium">
              {Math.round(lighting.sunElevation)}°
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
