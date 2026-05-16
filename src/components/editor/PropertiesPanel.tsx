// Properties Panel for Selected Elements
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Trash2, Ruler, DoorOpen, SquareDashed } from 'lucide-react';
import type { Wall, Opening } from '@/types';

interface PropertiesPanelProps {
  selectedWall?: Wall;
  openings: Opening[];
  onWallUpdate: (wallId: string, updates: Partial<Wall>) => void;
  onOpeningUpdate: (openingId: string, updates: Partial<Opening>) => void;
  onWallDelete: (wallId: string) => void;
  onOpeningDelete: (openingId: string) => void;
}

export default function PropertiesPanel({
  selectedWall,
  openings,
  onWallUpdate,
  onOpeningUpdate,
  onWallDelete,
  onOpeningDelete,
}: PropertiesPanelProps) {
  if (!selectedWall) {
    return (
      <div className="flex h-full flex-col" style={{ background: 'hsl(var(--ws-panel))', borderLeft: '1px solid hsl(var(--ws-border))' }}>
        {/* Panel header */}
        <div className="ws-pane-header">
          <span className="ws-pane-label">Properties</span>
        </div>
        {/* Empty state */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ws-border bg-ws-toolbar">
            <Ruler className="h-5 w-5 text-ws-text-faint" />
          </div>
          <div>
            <p className="text-xs font-medium text-ws-text">No selection</p>
            <p className="mt-0.5 text-[10px] text-ws-text-faint text-pretty">
              Select a wall to view and edit its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  const wallLength = Math.sqrt(
    Math.pow(selectedWall.end.x - selectedWall.start.x, 2) +
    Math.pow(selectedWall.end.y - selectedWall.start.y, 2)
  );

  const wallOpenings = openings.filter((o) => o.wallId === selectedWall.id);

  return (
    <div
      className="flex h-full flex-col overflow-y-auto"
      style={{ background: 'hsl(var(--ws-panel))', borderLeft: '1px solid hsl(var(--ws-border))' }}
    >
      {/* Panel header */}
      <div className="ws-pane-header shrink-0">
        <span className="ws-pane-label">Wall Properties</span>
        <span className="ws-pane-stat">{selectedWall.id.slice(0, 10)}</span>
      </div>

      <div className="flex-1 space-y-0 overflow-y-auto">
        {/* Dimensions section */}
        <div className="ws-panel-section px-3 py-3">
          <p className="ws-panel-label mb-2 px-0 text-[9px] font-semibold uppercase tracking-widest text-ws-text-faint">Dimensions</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ws-text-faint">Length</span>
              <span className="font-mono text-[11px] text-ws-text">{Math.round(wallLength)}px</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ws-text-faint">ID</span>
              <span className="font-mono text-[10px] text-ws-text">{selectedWall.id.slice(0, 12)}...</span>
            </div>

            {/* Thickness */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="thickness" className="text-[10px] font-normal text-ws-text-faint">Thickness</Label>
                <span className="font-mono text-[11px] text-ws-text">{selectedWall.thickness}px</span>
              </div>
              <Slider
                id="thickness"
                min={5} max={30} step={1}
                value={[selectedWall.thickness]}
                onValueChange={([v]) => onWallUpdate(selectedWall.id, { thickness: v })}
                className="w-full"
              />
            </div>

            {/* Height */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="height" className="text-[10px] font-normal text-ws-text-faint">Height</Label>
                <span className="font-mono text-[11px] text-ws-text">{selectedWall.height}cm</span>
              </div>
              <Slider
                id="height"
                min={200} max={400} step={10}
                value={[selectedWall.height]}
                onValueChange={([v]) => onWallUpdate(selectedWall.id, { height: v })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-ws-border" />

        {/* Openings section */}
        <div className="px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ws-text-faint">
              Openings ({wallOpenings.length})
            </p>
          </div>
          {wallOpenings.length === 0 ? (
            <p className="text-[10px] text-ws-text-faint">No doors or windows on this wall</p>
          ) : (
            <div className="space-y-3">
              {wallOpenings.map((opening) => {
                const OpeningIcon = opening.type === 'door' ? DoorOpen : SquareDashed;
                return (
                  <div
                    key={opening.id}
                    className="rounded-lg border border-ws-border-subtle bg-ws-toolbar p-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <OpeningIcon className="h-3 w-3 text-ws-text-dim" />
                        <span className="text-[10px] font-semibold capitalize text-ws-text">
                          {opening.type}
                        </span>
                      </div>
                      <button
                        onClick={() => onOpeningDelete(opening.id)}
                        className="flex h-5 w-5 items-center justify-center rounded text-ws-text-faint transition-colors hover:bg-destructive/20 hover:text-destructive"
                        aria-label={`Delete ${opening.type}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-normal text-ws-text-faint">Width</Label>
                        <span className="font-mono text-[10px] text-ws-text">{opening.width}cm</span>
                      </div>
                      <Slider min={60} max={200} step={10} value={[opening.width]}
                        onValueChange={([v]) => onOpeningUpdate(opening.id, { width: v })} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-normal text-ws-text-faint">Height</Label>
                        <span className="font-mono text-[10px] text-ws-text">{opening.height}cm</span>
                      </div>
                      <Slider min={60} max={250} step={10} value={[opening.height]}
                        onValueChange={([v]) => onOpeningUpdate(opening.id, { height: v })} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-normal text-ws-text-faint">Position</Label>
                        <span className="font-mono text-[10px] text-ws-text">{Math.round(opening.position * 100)}%</span>
                      </div>
                      <Slider min={0} max={1} step={0.01} value={[opening.position]}
                        onValueChange={([v]) => onOpeningUpdate(opening.id, { position: v })} />
                    </div>

                    {opening.type === 'window' && opening.sillHeight !== undefined && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-normal text-ws-text-faint">Sill Height</Label>
                          <span className="font-mono text-[10px] text-ws-text">{opening.sillHeight}cm</span>
                        </div>
                        <Slider min={0} max={150} step={10} value={[opening.sillHeight]}
                          onValueChange={([v]) => onOpeningUpdate(opening.id, { sillHeight: v })} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator className="bg-ws-border" />

        {/* Delete */}
        <div className="px-3 py-3">
          <Button
            variant="destructive"
            size="sm"
            className="h-8 w-full gap-2 text-xs"
            onClick={() => onWallDelete(selectedWall.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Wall
          </Button>
        </div>
      </div>
    </div>
  );
}
