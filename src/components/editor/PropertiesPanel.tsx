// Properties Panel for Selected Elements and tool defaults
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash2, DoorOpen, SquareDashed, ChevronDown } from 'lucide-react';
import { getToolDefaults } from '@/components/editor/toolDefaults';
import { scrollFocusedFieldIntoView } from '@/utils/scrollFocusedFieldIntoView';
import { ROOM_TYPES, roomTypeLabel, type RoomType } from '@/domain/rooms/roomType';
import { formatDimensionBySystem, type UnitSystem } from '@/utils/measurements';
import { playStudioSound } from '@/modules/studio-audio/audioEngine';
import { VishInspector, VishInspectorHeader, VishInspectorContent, VishInspectorSection } from '@/components/common/vish-primitives';
import type { ToolType, Wall, Opening, Label as TextLabel, Room, FixtureItem } from '@/types';
interface PropertiesPanelProps {
  currentTool: ToolType;
  selectedWall?: Wall;
  selectedLabel?: TextLabel;
  selectedFixture?: FixtureItem;
  selectedRoom?: Room;
  pendingRoomType?: string;
  onPendingRoomTypeChange?: (type: string) => void;
  onRoomUpdate?: (roomId: string, updates: Partial<Room>) => void;
  openings: Opening[];
  onWallUpdate: (wallId: string, updates: Partial<Wall>) => void;
  onOpeningUpdate: (openingId: string, updates: Partial<Opening>) => void;
  onWallDelete: (wallId: string) => void;
  onOpeningDelete: (openingId: string) => void;
  onLabelUpdate?: (labelId: string, updates: Partial<TextLabel>) => void;
  onLabelDelete?: (labelId: string) => void;
  onFixtureUpdate?: (fixtureId: string, updates: Partial<FixtureItem>) => void;
  onFixtureDelete?: (fixtureId: string) => void;
  unitSystem?: UnitSystem;
  morePanel?: React.ReactNode;
}

function ToolDefaultsPanel({ currentTool }: { currentTool: ToolType }) {
  const config = getToolDefaults(currentTool);

  return (
    <div className="space-y-4 px-4 py-4">
      <VishInspectorHeader>
        {config.sectionTitle}
      </VishInspectorHeader>
      <div className="space-y-4">
      {config.fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">
            {field.label}
          </Label>
          {field.type === 'select' ? (
            <select
              className="w-full h-9 bg-vish-navy-800 border border-vish-navy-600 rounded-[8px] text-white text-xs px-2 focus:border-vish-blue-500 focus:ring-1 focus:ring-vish-blue-500 outline-none transition-all"
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
              className="w-full h-9 bg-vish-navy-800/50 border border-vish-navy-700 rounded-[8px] text-vish-text-300 text-xs px-2"
            />
          )}
        </div>
      ))}
      </div>
      <p className="text-[10px] text-vish-text-500 italic mt-2">{config.footnote}</p>
    </div>
  );
}

export default function PropertiesPanel({
  currentTool,
  selectedWall,
  selectedLabel,
  selectedFixture,
  selectedRoom,
  pendingRoomType,
  onPendingRoomTypeChange,
  onRoomUpdate,
  openings,
  onWallUpdate,
  onOpeningUpdate,
  onWallDelete,
  onOpeningDelete,
  onLabelUpdate,
  onLabelDelete,
  onFixtureUpdate,
  onFixtureDelete,
  unitSystem = 'metric',
  morePanel,
}: PropertiesPanelProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const wallLength = selectedWall
    ? Math.hypot(selectedWall.end.x - selectedWall.start.x, selectedWall.end.y - selectedWall.start.y)
    : 0;
  
  const wallOpenings = selectedWall
    ? openings.filter((o) => o.wallId === selectedWall.id)
    : [];

  if (!selectedWall && selectedFixture && onFixtureUpdate) {
    return (
      <VishInspector>
        <VishInspectorHeader>Lighting Fixture</VishInspectorHeader>
        <VishInspectorSection className="flex-1 overflow-y-auto">
          <VishInspectorContent className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Type</Label>
                <select
                  className="w-full h-9 bg-vish-navy-800 border border-vish-navy-600 rounded-[8px] text-white text-xs px-2 focus:border-vish-blue-500 focus:ring-1 focus:ring-vish-blue-500 outline-none transition-all"
                  value={selectedFixture.type}
                  onChange={(e) => onFixtureUpdate(selectedFixture.id, { type: e.target.value as FixtureItem['type'] })}
                  aria-label="Fixture type"
                >
                  <option value="point">Point light</option>
                  <option value="spot">Spot light</option>
                  <option value="ceiling">Ceiling light</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Intensity</Label>
                  <span className="font-mono text-[11px] text-white">{(selectedFixture.intensity ?? 1).toFixed(1)}</span>
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
                <div className="pt-4 mt-4 border-t border-vish-navy-700/50">
                  <Button variant="destructive" size="sm" className="h-10 w-full gap-2 text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300" onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(50);
                    playStudioSound('buttonPress');
                    onFixtureDelete(selectedFixture.id);
                  }}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete fixture
                  </Button>
                </div>
              )}
            </div>
          </VishInspectorContent>
        </VishInspectorSection>
      </VishInspector>
    );
  }

  if (!selectedWall && selectedLabel && onLabelUpdate) {
    return (
      <VishInspector>
        <VishInspectorHeader>Label Properties</VishInspectorHeader>
        <VishInspectorSection className="flex-1 overflow-y-auto">
          <VishInspectorContent className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Text</Label>
                <input
                  className="w-full h-9 bg-vish-navy-800 border border-vish-navy-600 rounded-[8px] text-white text-xs px-2 focus:border-vish-blue-500 focus:ring-1 focus:ring-vish-blue-500 outline-none transition-all"
                  value={selectedLabel.text}
                  onChange={(e) => onLabelUpdate(selectedLabel.id, { text: e.target.value })}
                  onFocus={scrollFocusedFieldIntoView}
                  aria-label="Label text"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Font size</Label>
                  <span className="font-mono text-[11px] text-white">{selectedLabel.fontSize ?? 14}</span>
                </div>
                <Slider
                  min={10}
                  max={32}
                  step={1}
                  value={[selectedLabel.fontSize ?? 14]}
                  onValueChange={([v]) => onLabelUpdate(selectedLabel.id, { fontSize: v })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Color</Label>
                <input
                  type="color"
                  value={selectedLabel.color ?? '#2c1810'}
                  onChange={(e) => onLabelUpdate(selectedLabel.id, { color: e.target.value })}
                  className="h-9 w-full cursor-pointer rounded-[8px] border border-vish-navy-600 bg-vish-navy-800 p-0.5 overflow-hidden"
                  aria-label="Label color"
                />
              </div>
              
              {selectedRoom?.area !== undefined && (
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-vish-navy-700/50 mt-2">
                  <span className="text-vish-text-400 uppercase font-semibold tracking-widest">Room area</span>
                  <span className="font-mono text-white">{selectedRoom.area.toFixed(1)} m²</span>
                </div>
              )}
              
              {selectedRoom && onRoomUpdate && (
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Room type</Label>
                  <select
                    className="w-full h-9 bg-vish-navy-800 border border-vish-navy-600 rounded-[8px] text-white text-xs px-2 focus:border-vish-blue-500 focus:ring-1 focus:ring-vish-blue-500 outline-none transition-all"
                    value={selectedRoom.roomType ?? 'Bedroom'}
                    onChange={(e) => {
                      const roomType = e.target.value as RoomType;
                      onRoomUpdate(selectedRoom.id, {
                        roomType,
                        name: roomTypeLabel(roomType),
                      });
                      if (onLabelUpdate && selectedLabel) {
                        onLabelUpdate(selectedLabel.id, { text: roomTypeLabel(roomType) });
                      }
                    }}
                    aria-label="Room type"
                  >
                    {ROOM_TYPES.map((type) => (
                      <option key={type} value={type}>{roomTypeLabel(type)}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {onLabelDelete && (
                <div className="pt-4 mt-4 border-t border-vish-navy-700/50">
                  <Button variant="destructive" size="sm" className="h-10 w-full gap-2 text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300" onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(50);
                    playStudioSound('buttonPress');
                    onLabelDelete(selectedLabel.id);
                  }}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete label
                  </Button>
                </div>
              )}
            </div>
          </VishInspectorContent>
        </VishInspectorSection>
      </VishInspector>
    );
  }

  if (!selectedWall) {
    return (
      <VishInspector>
        <VishInspectorSection className="flex-1 overflow-y-auto">
          {currentTool === 'room' && onPendingRoomTypeChange && (
            <div className="border-b border-vish-navy-600/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Room type</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ROOM_TYPES.slice(0, 8).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`rounded-md border px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider transition-all duration-200 ${
                      pendingRoomType === type
                        ? 'border-vish-blue-500 bg-vish-blue-500/20 text-white shadow-[0_0_10px_rgba(42,167,255,0.2)]'
                        : 'border-vish-navy-600 text-vish-text-400 hover:border-vish-blue-400/50 hover:text-white'
                    }`}
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      playStudioSound('buttonPress');
                      onPendingRoomTypeChange(type);
                    }}
                  >
                    {roomTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <ToolDefaultsPanel currentTool={currentTool} />
        </VishInspectorSection>
        {morePanel && (
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="shrink-0 border-t border-vish-navy-600/50 bg-vish-navy-900/50">
            <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-vish-text-400 hover:text-white transition-colors">
              Simulation &amp; proof panels
              <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className={`max-h-[min(42vh,24rem)] overflow-y-auto ${moreOpen ? 'vish-panel-reveal' : ''}`}>{morePanel}</CollapsibleContent>
          </Collapsible>
        )}
      </VishInspector>
    );
  }

  return (
    <VishInspector>
      <VishInspectorHeader>Wall Properties · {selectedWall.id.slice(0, 8)}</VishInspectorHeader>
      <VishInspectorSection className="flex-1 overflow-y-auto">
        <VishInspectorContent className="pt-4">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-vish-text-500">Dimensions</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-vish-navy-700/50 pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Length</span>
              <span className="font-mono text-xs font-semibold text-white" data-testid="wall-property-length">
                {formatDimensionBySystem(wallLength, unitSystem, 2)}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="thickness" className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Thickness</Label>
                <span className="font-mono text-xs font-semibold text-white">{selectedWall.thickness}px</span>
              </div>
              <Slider
                id="thickness"
                min={5} max={30} step={1}
                value={[selectedWall.thickness]}
                onValueChange={([v]) => onWallUpdate(selectedWall.id, { thickness: v })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="height" className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Height</Label>
                <span className="font-mono text-xs font-semibold text-white">{selectedWall.height}cm</span>
              </div>
              <Slider
                id="height"
                min={200} max={400} step={10}
                value={[selectedWall.height]}
                onValueChange={([v]) => onWallUpdate(selectedWall.id, { height: v })}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="fachwerk" className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Exposed Fachwerk</Label>
              <input
                id="fachwerk"
                type="checkbox"
                checked={selectedWall.fachwerk || false}
                onChange={(e) => onWallUpdate(selectedWall.id, { fachwerk: e.target.checked })}
                className="h-4 w-4 rounded border-vish-navy-600 bg-vish-navy-800 text-vish-blue-500 focus:ring-vish-blue-500 focus:ring-offset-vish-navy-900"
                data-testid="fachwerk-toggle"
              />
            </div>
          </div>
        </VishInspectorContent>

        <Separator className="bg-vish-navy-600/50" />

        <VishInspectorContent className="pt-4">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-vish-text-500">
            Openings ({wallOpenings.length})
          </p>
          <div data-testid="wall-openings-count" className="sr-only">{wallOpenings.length}</div>
          {wallOpenings.length === 0 ? (
            <p className="text-xs text-vish-text-500 italic">No doors or windows on this wall</p>
          ) : (
            <div className="space-y-3">
              {wallOpenings.map((opening) => {
                const OpeningIcon = opening.type === 'door' ? DoorOpen : SquareDashed;
                return (
                  <div
                    key={opening.id}
                    className="space-y-3 rounded-[10px] border border-vish-navy-700 bg-vish-navy-800/30 p-3"
                  >
                    <div className="flex items-center justify-between border-b border-vish-navy-700/50 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <OpeningIcon className="h-4 w-4 text-vish-text-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{opening.type}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(50);
                          onOpeningDelete(opening.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-vish-text-400 transition-colors hover:bg-rose-500/20 hover:text-rose-400 active:bg-rose-500/30 active:text-rose-400"
                        aria-label={`Delete ${opening.type}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Width</Label>
                        <span className="font-mono text-[10px] text-white">{opening.width}cm</span>
                      </div>
                      <Slider min={60} max={200} step={10} value={[opening.width]}
                        onValueChange={([v]) => onOpeningUpdate(opening.id, { width: v })} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Height</Label>
                        <span className="font-mono text-[10px] text-white">{opening.height}cm</span>
                      </div>
                      <Slider min={60} max={250} step={10} value={[opening.height]}
                        onValueChange={([v]) => onOpeningUpdate(opening.id, { height: v })} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Position</Label>
                        <span className="font-mono text-[10px] text-white">{Math.round(opening.position * 100)}%</span>
                      </div>
                      <Slider min={0} max={1} step={0.01} value={[opening.position]}
                        onValueChange={([v]) => onOpeningUpdate(opening.id, { position: v })} />
                    </div>

                    {opening.type === 'window' && opening.sillHeight !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-semibold uppercase tracking-widest text-vish-text-400">Sill Height</Label>
                          <span className="font-mono text-[10px] text-white">{opening.sillHeight}cm</span>
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
        </VishInspectorContent>

        <Separator className="bg-vish-navy-600/50" />

        <div className="px-4 py-4">
          <Button
            variant="destructive"
            size="sm"
            className="h-10 w-full gap-2 text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(50);
              onWallDelete(selectedWall.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Wall
          </Button>
        </div>

        {morePanel && (
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="shrink-0 border-t border-vish-navy-600/50 bg-vish-navy-900/50">
            <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-vish-text-400 hover:text-white transition-colors">
              Simulation &amp; proof panels
              <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className={`max-h-[min(42vh,24rem)] overflow-y-auto ${moreOpen ? 'vish-panel-reveal' : ''}`}>{morePanel}</CollapsibleContent>
          </Collapsible>
        )}
      </VishInspectorSection>
    </VishInspector>
  );
}
