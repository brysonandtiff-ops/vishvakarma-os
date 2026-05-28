import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { backendStatus } from '@/backend/backendConfig';
import { createProject } from '@/db/api';
import { createLocalProject } from '@/editor/localProject';
import type { LightingConfig, Project, ProjectManifest } from '@/types';

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
  onProjectCreated: (project: Project) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    const initialManifest: ProjectManifest = {
      version: SPEC_VERSION,
      name: name.trim(),
      description: description.trim() || undefined,
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

    setSubmitting(true);

    try {
      const project = backendStatus.isConfigured
        ? await createProject(name.trim(), description.trim() || undefined, initialManifest)
        : createLocalProject(name.trim(), description.trim() || undefined, initialManifest);

      toast.success(backendStatus.isConfigured ? 'Project created' : 'Local project ready — draw and save to your browser');
      onOpenChange(false);
      setName('');
      setDescription('');
      onProjectCreated(project);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl md:max-w-md">
        <DialogHeader>
          <div className="vish-card-mantra mx-auto mb-2 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]">
            नूतन · New Project
          </div>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Start a new blueprint workspace with a clean canvas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Client floor plan"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional notes"
              rows={3}
              disabled={submitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
