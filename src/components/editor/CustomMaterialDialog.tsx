import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Material } from '@/types';

interface CustomMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (material: Material) => void;
}

export default function CustomMaterialDialog({ open, onOpenChange, onCreate }: CustomMaterialDialogProps) {
  const [name, setName] = useState('Custom');
  const [color, setColor] = useState('#c4a882');

  const handleCreate = () => {
    const material: Material = {
      id: `material-custom-${Date.now()}`,
      name: name.trim() || 'Custom',
      type: 'custom',
      color,
      roughness: 0.7,
    };
    onCreate(material);
    onOpenChange(false);
    setName('Custom');
    setColor('#c4a882');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create custom material</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-name">Name</Label>
            <Input id="material-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="material-color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="material-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border"
                aria-label="Material color"
              />
              <span className="font-mono text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Add material</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
