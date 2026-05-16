// Properties Panel for Selected Elements
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
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
      <Card className="architect-properties">
        <CardHeader>
          <CardTitle className="text-sm">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a wall to view and edit its properties
          </p>
        </CardContent>
      </Card>
    );
  }

  const wallLength = Math.sqrt(
    Math.pow(selectedWall.end.x - selectedWall.start.x, 2) +
    Math.pow(selectedWall.end.y - selectedWall.start.y, 2)
  );

  const wallOpenings = openings.filter((o) => o.wallId === selectedWall.id);

  return (
    <Card className="architect-properties">
      <CardHeader>
        <CardTitle className="text-sm">Wall Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wall Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Length</span>
            <span className="font-mono">{Math.round(wallLength)}px</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono text-xs">{selectedWall.id.slice(0, 12)}...</span>
          </div>
        </div>

        <Separator />

        {/* Wall Thickness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="thickness" className="text-xs">
              Thickness
            </Label>
            <span className="text-xs font-mono">{selectedWall.thickness}px</span>
          </div>
          <Slider
            id="thickness"
            min={5}
            max={30}
            step={1}
            value={[selectedWall.thickness]}
            onValueChange={([value]) =>
              onWallUpdate(selectedWall.id, { thickness: value })
            }
            className="w-full"
          />
        </div>

        {/* Wall Height */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="height" className="text-xs">
              Height
            </Label>
            <span className="text-xs font-mono">{selectedWall.height}cm</span>
          </div>
          <Slider
            id="height"
            min={200}
            max={400}
            step={10}
            value={[selectedWall.height]}
            onValueChange={([value]) =>
              onWallUpdate(selectedWall.id, { height: value })
            }
            className="w-full"
          />
        </div>

        <Separator />

        {/* Openings */}
        <div className="space-y-2">
          <Label className="text-xs">Openings ({wallOpenings.length})</Label>
          {wallOpenings.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No doors or windows on this wall
            </p>
          ) : (
            <div className="space-y-3">
              {wallOpenings.map((opening) => (
                <Card key={opening.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold capitalize">
                        {opening.type}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpeningDelete(opening.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Width */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Width</Label>
                        <span className="text-xs font-mono">{opening.width}cm</span>
                      </div>
                      <Slider
                        min={60}
                        max={200}
                        step={10}
                        value={[opening.width]}
                        onValueChange={([value]) =>
                          onOpeningUpdate(opening.id, { width: value })
                        }
                      />
                    </div>

                    {/* Height */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Height</Label>
                        <span className="text-xs font-mono">{opening.height}cm</span>
                      </div>
                      <Slider
                        min={60}
                        max={250}
                        step={10}
                        value={[opening.height]}
                        onValueChange={([value]) =>
                          onOpeningUpdate(opening.id, { height: value })
                        }
                      />
                    </div>

                    {/* Position */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Position</Label>
                        <span className="text-xs font-mono">
                          {Math.round(opening.position * 100)}%
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[opening.position]}
                        onValueChange={([value]) =>
                          onOpeningUpdate(opening.id, { position: value })
                        }
                      />
                    </div>

                    {/* Sill Height (Windows only) */}
                    {opening.type === 'window' && opening.sillHeight !== undefined && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Sill Height</Label>
                          <span className="text-xs font-mono">{opening.sillHeight}cm</span>
                        </div>
                        <Slider
                          min={0}
                          max={150}
                          step={10}
                          value={[opening.sillHeight]}
                          onValueChange={([value]) =>
                            onOpeningUpdate(opening.id, { sillHeight: value })
                          }
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Delete Wall */}
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => onWallDelete(selectedWall.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Wall
        </Button>
      </CardContent>
    </Card>
  );
}
