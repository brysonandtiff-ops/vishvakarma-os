import { Layers } from 'lucide-react';
import type { EditorLayerVisibility } from '@/types';

const LAYER_ITEMS: Array<{ key: keyof EditorLayerVisibility; label: string }> = [
  { key: 'walls', label: 'Walls' },
  { key: 'openings', label: 'Openings' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'dimensions', label: 'Dimensions' },
  { key: 'labels', label: 'Labels' },
  { key: 'mep', label: 'MEP' },
  { key: 'landscape', label: 'Landscape' },
  { key: 'terrain', label: 'Terrain' },
  { key: 'vastuOverlay', label: 'Vastu' },
];

export default function EditorLayerPanel({
  layers,
  onChange,
}: {
  layers: EditorLayerVisibility;
  onChange: (patch: Partial<EditorLayerVisibility>) => void;
}) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-white/70 p-3" data-testid="editor-layer-panel">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        <Layers className="h-3 w-3" aria-hidden />
        Canvas layers
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LAYER_ITEMS.map(({ key, label }) => {
          const active = layers[key];
          return (
            <button
              key={key}
              type="button"
              className={`touch-target rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
              aria-pressed={active}
              onClick={() => onChange({ [key]: !active })}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
