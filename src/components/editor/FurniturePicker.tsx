import { Button } from '@/components/ui/button';
import { FURNITURE_PRESETS, INDIAN_FURNITURE_TYPES } from '@/core/sceneVisualCatalog';

interface FurniturePickerProps {
  onSelectTool: () => void;
  highlightIndian?: boolean;
}

export default function FurniturePicker({ onSelectTool, highlightIndian = false }: FurniturePickerProps) {
  const indianSet = new Set<string>(INDIAN_FURNITURE_TYPES);
  const indianPresets = FURNITURE_PRESETS.filter((p) => indianSet.has(p.type));
  const generalPresets = FURNITURE_PRESETS.filter((p) => !indianSet.has(p.type));

  return (
    <div className="vish-editor-picker-card grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-xl border p-2">
      {highlightIndian && indianPresets.length > 0 && (
        <>
          <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Indian residential
          </p>
          {indianPresets.map((preset) => (
            <Button
              key={preset.type}
              variant="outline"
              size="sm"
              className="touch-target border-primary/30"
              onClick={onSelectTool}
            >
              {preset.label}
            </Button>
          ))}
          <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            General
          </p>
        </>
      )}
      {(highlightIndian ? generalPresets : FURNITURE_PRESETS).map((preset) => (
        <Button
          key={preset.type}
          variant="outline"
          size="sm"
          className="touch-target"
          onClick={onSelectTool}
        >
          {preset.label}
        </Button>
      ))}
      <p className="col-span-2 text-[10px] text-muted-foreground">
        Select furniture tool (F), then click on canvas to place. Drag to reposition in select mode.
      </p>
    </div>
  );
}
