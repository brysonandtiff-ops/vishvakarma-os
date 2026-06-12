// Properties Panel for Selected Elements and tool defaults
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash2, DoorOpen, SquareDashed, ChevronDown } from 'lucide-react';
import { getToolDefaults } from '@/components/editor/toolDefaults';
import { scrollFocusedFieldIntoView } from '@/utils/scrollFocusedFieldIntoView';
import type { ToolType, Wall, Opening, Label as TextLabel, Room, FixtureItem } from '@/types';

interface PropertiesPanelProps {
  currentTool: ToolType;
  selectedWall?: Wall;
  selectedLabel?: TextLabel;
  selectedFixture?: FixtureItem;
  selectedRoom?: Room;
  openings: Opening[];
  onWallUpdate: (wallId: string, updates: Partial<Wall>) => void;
  onOpeningUpdate: (openingId: string, updates: Partial<Opening>) => void;
  onWallDelete: (wallId: string) => void;
  onOpeningDelete: (openingId: string) => void;
  onLabelUpdate?: (labelId: string, updates: Partial<TextLabel>) => void;
  onLabelDelete?: (labelId: string) => void;
  onFixtureUpdate?: (fixtureId: string, updates: Partial<FixtureItem>) => void;
  onFixtureDelete?: (fixtureId: string) => void;
  morePanel?: React.ReactNode;
}

function ToolDefaultsPanel({ currentTool }: { currentTool: ToolType }) {
  const config = getToolDefaults(currentTool);

  return (
    <div className="space-y-4 px-4 py-4">
      <div>
        <p className="ws-pane-label text-primary">Properties</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ws-text">
          {config.sectionTitle}
        </p>
      </div>
      {config.fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label className="text-[10px] font-semibold uppercase tracking-widest text-ws-text-dim">
            {field.label}
          </Label>
          {field.type === 'select' ? (
            <select
              className="vish-mockup-input h-9 text-xs"
              defaultValue={field.value}
              aria-label={field.label}
            >
              {field.options?.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              readOnly
              value={field.value}
              aria-label={field.label}
              className="vish-mockup-input h-9 text-xs"
            />
          )}
        </div>
      ))}
      <p className="text-[10px] text-ws-text-faint">{config.footnote}</p>
    </div>
  );
}

export default function PropertiesPanel({
  currentTool,
  selectedWall,
  selectedLabel,
  selectedFixture,
  selectedRoom,
  openings,
  onWallUpdate,
  onOpeningUpdate,
  onWallDelete,
  onOpeningDelete,
  onLabelUpdate,
  onLabelDelete,
  onFixtureUpdate,
  onFixtureDelete,
  morePanel,
}: PropertiesPanelProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  if (!selectedWall && selectedFixture && onFixtureUpdate) {
    return (
      <div className="vish-properties-panel vish-dark-panel flex h-full flex-col overflow-y-auto">
        <div className="ws-pane-header shrink-0">
          <span className="ws-pane-label">Lighting Fixture</span>
        </div>
        <div className="space-y-4 px-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-widest text-ws-text-dim">Type</Label>
            <select
              className="vish-mockup-input h-9 w-full text-xs"
              value={selectedFixture.type}
              onChange={(e) => onFixtureUpdate(selectedFixture.id, { type: e.target.value as FixtureItem['type'] })}
              aria-label="Fixture type"
            >
              <option value="point">Point light</option>
              <option value="spot">Spot light</option>
              <option value="ceiling">Ceiling light</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold uppercase tracking-widest text-ws-text-dim">Intensity</Label>
              <span className="font-mono text-[11px] text-ws-text">{(selectedFixture.intensity ?? 1).toFixed(1)}</span>
            </div>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={[selectedFixture.intensity ?? 1]}
              onValueChange={([v]) => onFixtureUpdate(selectedFixture.id, { intensity: v })}
            />
          </div>
          {onFixtureDelete && (
            <Button variant="destructive" size="sm" className="w-full" onClick={() => onFixtureDelete(selectedFixture.id)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete fixture
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!selectedWall && selectedLabel && onLabelUpdate) {
    return (
      <div className="vish-properties-panel vish-dark-panel flex h-full flex-col overflow-y-auto">
        <div className="ws-pane-header shrink-0">
          <span className="ws-pane-label">Label Properties</span>
        </div>
        <div className="space-y-4 px-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-widest text-ws-text-dim">Text</Label>
            <input
              className="vish-mockup-input h-9 w-full text-xs"
              value={selectedLabel.text}
              onChange={(e) => onLabelUpdate(selectedLabel.id, { text: e.target.value })}
              onFocus={scrollFocusedFieldIntoView}
              aria-label="Label text"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-widest text-ws-text-dim">Font size</Label>
            <Slider
              min={10}
              max={32}
              step={1}
              value={[selectedLabel.fontSize ?? 14]}
              onValueChange={([v]) => onLabelUpdate(selectedLabel.id, { fontSize: v })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-widest text-ws-text-dim">Color</Label>
            <input
              type="color"
              value={selectedLabel.color ?? '#2c1810'}
              onChange={(e) => onLabelUpdate(selectedLabel.id, { color: e.target.value })}
              className="h-9 w-full cursor-pointer rounded border border-border"
              aria-label="Label color"
            />
          </div>
          {selectedRoom?.area !== undefined && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-ws-text-faint">Room area</span>
              <span className="font-mono text-ws-text">{selectedRoom.area.toFixed(1)} m²</span>
            </div>
          )}
          {onLabelDelete && (
            <Button variant="destructive" size="sm" className="w-full" onClick={() => onLabelDelete(selectedLabel.id)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete label
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!selectedWall) {
    return (
      <div className="vish-properties-panel vish-dark-panel flex h-full min-h-0 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ToolDefaultsPanel currentTool={currentTool} />
        </div>
        {morePanel && (
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="shrink-0 border-t border-ws-border">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-ws-text-dim hover:text-ws-text">
              Simulation &amp; proof panels
              <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="max-h-[min(42vh,24rem)] overflow-y-auto">{morePanel}</CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  }

  const wallLength = Math.sqrt(
    Math.pow(selectedWall.end.x - selectedWall.start.x, 2) +
    Math.pow(selectedWall.end.y - selectedWall.start.y, 2)
  );

  const wallOpenings = openings.filter((o) => o.wallId === selectedWall.id);

  return (
    <div className="vish-properties-panel vish-dark-panel flex h-full flex-col overflow-y-auto">
      <div className="ws-pane-header shrink-0">
        <span className="ws-pane-label">Wall Properties</span>
        <span className="ws-pane-stat">{selectedWall.id.slice(0, 10)}</span>
      </div>

      <div className="flex-1 space-y-0 overflow-y-auto">
        <div className="ws-panel-section px-3 py-3">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-ws-text-faint">Dimensions</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ws-text-faint">Length</span>
              <span className="font-mono text-[11px] text-ws-text">{Math.round(wallLength)}px</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ws-text-faint">ID</span>
              <span className="font-mono text-[10px] text-ws-text">{selectedWall.id.slice(0, 12)}...</span>
            </div>
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

        <div className="px-3 py-3">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-ws-text-faint">
            Openings ({wallOpenings.length})
          </p>
          {wallOpenings.length === 0 ? (
            <p className="text-[10px] text-ws-text-faint">No doors or windows on this wall</p>
          ) : (
            <div className="space-y-3">
              {wallOpenings.map((opening) => {
                const OpeningIcon = opening.type === 'door' ? DoorOpen : SquareDashed;
                return (
                  <div
                    key={opening.id}
                    className="space-y-2 rounded-lg border border-ws-border-subtle bg-ws-toolbar p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <OpeningIcon className="h-3 w-3 text-ws-text-dim" />
                        <span className="text-[10px] font-semibold capitalize text-ws-text">{opening.type}</span>
                      </div>
                      <button
                        type="button"
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

        {morePanel && (
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="shrink-0 border-t border-ws-border">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-ws-text-dim hover:text-ws-text">
              Simulation &amp; proof panels
              <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="max-h-[min(42vh,24rem)] overflow-y-auto">{morePanel}</CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
