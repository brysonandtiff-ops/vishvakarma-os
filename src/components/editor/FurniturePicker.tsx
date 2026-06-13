import { Button } from '@/components/ui/button';
import { FURNITURE_PRESETS } from '@/core/sceneVisualCatalog';

interface FurniturePickerProps {
  onSelectTool: () => void;
}

export default function FurniturePicker({ onSelectTool }: FurniturePickerProps) {
  return (
    <div className="vish-editor-picker-card grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-xl border p-2">
      {FURNITURE_PRESETS.map((preset) => (
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
