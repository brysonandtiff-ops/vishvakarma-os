import { useState } from 'react';
import { Compass, DollarSign } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { sumCostItems } from '@/utils/costEstimate';
import type { CostItem } from '@/types';

interface EditorCompassCostProps {
  northOrientation: number;
  costItems: CostItem[];
  costRange?: { bestCase: number; worstCase: number; confidence: number };
  onNorthChange: (degrees: number) => void;
}

export default function EditorCompassCost({
  northOrientation,
  costItems,
  costRange,
  onNorthChange,
}: EditorCompassCostProps) {
  const [compassOpen, setCompassOpen] = useState(false);
  const totalCost = sumCostItems(costItems);

  return (
    <div className="vish-compass-cost-widget pointer-events-auto absolute bottom-4 right-4 z-20 flex items-center gap-2" data-testid="editor-compass-cost">
      <Popover open={compassOpen} onOpenChange={setCompassOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="vish-canvas-overlay-pill gap-1.5"
            aria-label="Compass orientation"
          >
            <Compass className="h-3.5 w-3.5 text-primary" style={{ transform: `rotate(${northOrientation}deg)` }} />
            N {Math.round(northOrientation)}°
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 space-y-3">
          <p className="text-xs font-semibold text-foreground">North bearing</p>
          <Slider
            value={[northOrientation]}
            min={0}
            max={360}
            step={1}
            onValueChange={(value) => {
              const next = value[0] ?? 0;
              if (next !== northOrientation) {
                onNorthChange(next);
              }
            }}
          />
          <p className="text-[11px] text-muted-foreground">Aligns vastu compass overlay on the 2D canvas.</p>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        className="vish-canvas-overlay-pill gap-1.5"
        aria-label={`Cost estimate ${totalCost}`}
        title={
          costRange
            ? `Expected $${totalCost.toLocaleString()} · Range $${costRange.bestCase.toLocaleString()}–$${costRange.worstCase.toLocaleString()} · ${costRange.confidence}% confidence`
            : costItems.map((item) => `${item.label}: $${item.amount}`).join('\n') || 'No cost items yet'
        }
      >
        <DollarSign className="h-3.5 w-3.5 text-primary" />
        {totalCost > 0 ? `$${totalCost.toLocaleString()}` : 'Cost'}
      </button>
    </div>
  );
}
