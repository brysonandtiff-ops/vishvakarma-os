import { useState } from 'react';
import { Compass, DollarSign, Globe } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import {
  JURISDICTION_OPTIONS,
  type ProjectJurisdiction,
} from '@/domain/projects/jurisdiction';
import { getRegionsForJurisdiction } from '@/data/cost/regionalIndices';
import { getRegionById } from '@/services/cost-estimation/regionalCostIndex';
import { sumCostItems } from '@/utils/costEstimate';
import { formatCurrency } from '@/utils/currencyFormat';
import type { CostItem } from '@/types';

interface EditorCompassCostProps {
  northOrientation: number;
  jurisdiction: ProjectJurisdiction;
  regionId: string;
  costItems: CostItem[];
  costRange?: { bestCase: number; worstCase: number; confidence: number };
  onNorthChange: (degrees: number) => void;
  onJurisdictionChange: (jurisdiction: ProjectJurisdiction) => void;
  onRegionChange: (regionId: string) => void;
}

export default function EditorCompassCost({
  northOrientation,
  jurisdiction,
  regionId,
  costItems,
  costRange,
  onNorthChange,
  onJurisdictionChange,
  onRegionChange,
}: EditorCompassCostProps) {
  const [compassOpen, setCompassOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const totalCost = sumCostItems(costItems);
  const region = getRegionById(regionId);
  const regions = getRegionsForJurisdiction(jurisdiction);

  return (
    <div className="vish-compass-cost-widget pointer-events-auto absolute bottom-4 right-4 z-20 flex flex-wrap items-center justify-end gap-2" data-testid="editor-compass-cost" data-tutorial="locale-compass">
      <Popover open={localeOpen} onOpenChange={setLocaleOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="vish-canvas-overlay-pill gap-1.5"
            aria-label="Project locale"
            data-testid="editor-locale-toggle"
            data-tutorial="editor-locale"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            {jurisdiction === 'in' ? 'IN' : 'AU'}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 space-y-3">
          <p className="text-xs font-semibold text-foreground">Project locale</p>
          <div className="flex gap-2">
            {JURISDICTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] ${
                  jurisdiction === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
                onClick={() => onJurisdictionChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <label className="block space-y-1">
            <span className="text-[11px] text-muted-foreground">Metro / region</span>
            <select
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              value={regionId}
              onChange={(e) => onRegionChange(e.target.value)}
              data-testid="editor-region-select"
              data-tutorial="editor-region"
            >
              {regions.map((r) => (
                <option key={r.regionId} value={r.regionId}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[11px] text-muted-foreground">
            {jurisdiction === 'in'
              ? 'NBC pre-check + INR cost bands for Indian residential planning.'
              : 'NCC audit + AUD cost bands for Australian projects.'}
          </p>
        </PopoverContent>
      </Popover>

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
            ? `Expected ${formatCurrency(totalCost, region.currency)} · Range ${formatCurrency(costRange.bestCase, region.currency)}–${formatCurrency(costRange.worstCase, region.currency)} · ${costRange.confidence}% confidence`
            : costItems.map((item) => `${item.label}: ${formatCurrency(item.amount, region.currency)}`).join('\n') || 'No cost items yet'
        }
      >
        <DollarSign className="h-3.5 w-3.5 text-primary" />
        {totalCost > 0 ? formatCurrency(totalCost, region.currency) : 'Cost'}
      </button>
    </div>
  );
}
