import { Button } from '@/components/ui/button';

const PRESETS = [
  { type: 'bed', label: 'Bed' },
  { type: 'table', label: 'Table' },
  { type: 'chair', label: 'Chair' },
  { type: 'sofa', label: 'Sofa' },
] as const;

interface FurniturePickerProps {
  onSelectTool: () => void;
}

export default function FurniturePicker({ onSelectTool }: FurniturePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map((preset) => (
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
