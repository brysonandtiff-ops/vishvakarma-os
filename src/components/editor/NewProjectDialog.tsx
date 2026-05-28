import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createProject } from '@/db/api';
import type { ProjectManifest, LightingConfig } from '@/types';

const SPEC_VERSION = '1.0.0';
const DEFAULT_LIGHTING: LightingConfig = {
  sunAzimuth: 180,
  sunElevation: 45,
  timeOfDay: 12,
  intensity: 1,
};

export default function NewProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onProjectCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    const initialManifest: ProjectManifest = {
      version: SPEC_VERSION,
      name,
      description,
      walls: [],
      openings: [],
      materials: [],
      floorMaterial: 'material-concrete',
      lighting: DEFAULT_LIGHTING,
      gridSize: 20,
      snapToGrid: true,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      },
    };

    try {
      await createProject(name, description || undefined, initialManifest);
      toast.success('Project created');
      onOpenChange(false);
      setName('');
      setDescription('');
      onProjectCreated();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl md:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Start a new blueprint workspace with a clean canvas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Client floor plan" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea id="project-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional notes" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
