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
import { upsertLocalProject } from '@/editor/localProjects';
import { createProjectManifest } from '@/core/projectModel';
import { getFloorTemplate, TEMPLATE_IDS, type TemplateId } from '@/core/templates';
import type { Project, ProjectManifest } from '@/types';

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
  const [templateId, setTemplateId] = useState<TemplateId | 'blank'>('blank');

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    const initialManifest: ProjectManifest =
      templateId === 'blank'
        ? createProjectManifest({ name: name.trim(), description: description.trim() || undefined })
        : { ...getFloorTemplate(templateId), name: name.trim(), description: description.trim() || undefined };

    setSubmitting(true);

    try {
      const project = backendStatus.isConfigured
        ? await createProject(name.trim(), description.trim() || undefined, initialManifest)
        : createLocalProject(name.trim(), description.trim() || undefined, initialManifest);

      if (!backendStatus.isConfigured) {
        upsertLocalProject(project);
      }

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
      <DialogContent className="vish-dialog-chrome max-w-[calc(100%-2rem)] rounded-3xl md:max-w-md">
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
            <Label>Template</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={templateId === 'blank' ? 'default' : 'outline'} onClick={() => setTemplateId('blank')}>
                Blank
              </Button>
              {TEMPLATE_IDS.map((id) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={templateId === id ? 'default' : 'outline'}
                  onClick={() => setTemplateId(id)}
                >
                  {id === 'studio' ? 'Studio' : id === '2bhk' ? '2BHK' : '3BHK'}
                </Button>
              ))}
            </div>
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
