import { useMemo, useState } from 'react';
import { Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  DEFAULT_SAMPLE_ID,
  getSamplesForSurface,
  getSampleFeatureBadges,
  getSampleStats,
  SAMPLE_CATEGORY_LABELS,
  type SampleCategory,
  type SampleDefinition,
} from '@/core/sampleCatalog';
import { EDITOR_ACTION_LABELS } from '@/editor/editorActionRegistry';

const CATEGORY_ORDER: SampleCategory[] = [
  'starter',
  'residential',
  'indian',
  'shapes',
  'interior',
  'landscape',
  'mep',
  'full',
];

function groupSamplesByCategory(samples: SampleDefinition[]) {
  const groups = new Map<SampleCategory, SampleDefinition[]>();
  for (const category of CATEGORY_ORDER) {
    groups.set(category, []);
  }
  for (const sample of samples) {
    const list = groups.get(sample.category) ?? [];
    list.push(sample);
    groups.set(sample.category, list);
  }
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: SAMPLE_CATEGORY_LABELS[category],
    samples: groups.get(category) ?? [],
  })).filter((group) => group.samples.length > 0);
}

export default function SamplePickerDialog({
  open,
  onOpenChange,
  onSelect,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSelect: (sampleId: string) => void | Promise<void>;
  loading?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(DEFAULT_SAMPLE_ID);
  const samples = useMemo(() => getSamplesForSurface('load-sample'), []);
  const groups = useMemo(() => groupSamplesByCategory(samples), [samples]);
  const selected = samples.find((entry) => entry.id === selectedId) ?? samples[0];
  const stats = selected ? getSampleStats(selected) : { walls: 0, openings: 0 };
  const badges = selected ? getSampleFeatureBadges(selected) : [];

  const handleLoad = () => {
    if (!selectedId) return;
    void onSelect(selectedId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="vish-dialog-chrome max-h-[min(90vh,720px)] max-w-[calc(100%-2rem)] overflow-hidden rounded-3xl md:max-w-2xl">
        <DialogHeader>
          <div className="vish-card-mantra mx-auto mb-2 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]">
            नमूना · Sample Blueprints
          </div>
          <DialogTitle className="flex items-center justify-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {EDITOR_ACTION_LABELS.loadSampleDialogTitle}
          </DialogTitle>
          <DialogDescription>
            Choose a demo floor plan — houses, Indian templates, shapes, furniture, nature, and MEP showcases.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(52vh,420px)] space-y-4 overflow-y-auto pr-1">
          {groups.map((group) => (
            <div key={group.category} className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.samples.map((sample) => (
                  <Button
                    key={sample.id}
                    type="button"
                    size="sm"
                    variant={selectedId === sample.id ? 'default' : 'outline'}
                    className="min-h-[44px] touch-target text-left"
                    onClick={() => setSelectedId(sample.id)}
                    disabled={loading}
                  >
                    {sample.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm">
            <p className="font-semibold vish-text-heading">{selected.name}</p>
            <p className="mt-1 text-muted-foreground">{selected.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.walls} walls · {stats.openings} openings
            </p>
            {badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {badges.map((badge) => (
                  <Badge key={badge} variant="secondary" className="text-[10px]">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="min-h-[44px]">
            Cancel
          </Button>
          <Button onClick={handleLoad} disabled={loading || !selectedId} className="min-h-[44px]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              'Load Blueprint'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
