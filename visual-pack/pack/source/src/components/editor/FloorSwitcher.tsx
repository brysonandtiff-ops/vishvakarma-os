import { Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BuildingFloor } from '@/types';

interface FloorSwitcherProps {
  floors: BuildingFloor[];
  activeFloorIndex: number;
  onFloorChange: (index: number) => void;
  onAddFloor: () => void;
}

export default function FloorSwitcher({
  floors,
  activeFloorIndex,
  onFloorChange,
  onAddFloor,
}: FloorSwitcherProps) {
  if (floors.length <= 1) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="touch-target h-7 min-h-[44px] gap-1.5 text-ws-text-dim hover:bg-ws-hover hover:text-ws-text"
          onClick={onAddFloor}
          aria-label="Add floor level"
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{floors[0]?.name ?? 'Ground Floor'}</span>
          <Plus className="h-3 w-3 opacity-60" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Select value={String(activeFloorIndex)} onValueChange={(value) => onFloorChange(Number(value))}>
        <SelectTrigger
          className="touch-target h-7 min-h-[44px] w-[9.5rem] border-ws-border bg-ws-menubar text-xs text-ws-text"
          aria-label="Active floor level"
        >
          <Layers className="mr-1 h-3.5 w-3.5 shrink-0 text-primary" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {floors.map((floor, index) => (
            <SelectItem key={floor.id} value={String(index)}>
              {floor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="touch-target h-7 min-h-[44px] min-w-[44px] text-ws-text-dim hover:bg-ws-hover hover:text-ws-text"
        onClick={onAddFloor}
        aria-label="Add floor level"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
