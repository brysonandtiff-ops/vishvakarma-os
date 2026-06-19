import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import CopilotSwanMark from '@/components/brand/CopilotSwanMark';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { editorDialogClassNameLg } from '@/lib/editorDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { backendStatus } from '@/backend/backendConfig';
import { trackEvent } from '@/lib/analytics';
import { createProject } from '@/db/api';
import { createLocalProject } from '@/editor/localProject';
import { upsertLocalProject } from '@/editor/localProjects';
import { createProjectManifest } from '@/core/projectModel';
import {
  getFloorTemplate,
  getNewProjectTemplates,
  SAMPLE_CATEGORY_LABELS,
  type SampleCategory,
} from '@/core/sampleCatalog';
import type { Project, ProjectManifest } from '@/types';

const NEW_PROJECT_CATEGORY_ORDER: SampleCategory[] = ['residential', 'indian', 'shapes'];

export default function NewProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
  onOpenAIDesigner,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onProjectCreated: (project: Project) => void;
  onOpenAIDesigner?: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [templateId, setTemplateId] = useState<string>('blank');
  const projectTemplates = useMemo(() => getNewProjectTemplates(), []);

  const groupedTemplates = useMemo(() => {
    return NEW_PROJECT_CATEGORY_ORDER.map((category) => ({
      category,
      label: SAMPLE_CATEGORY_LABELS[category],
      templates: projectTemplates.filter((entry) => entry.category === category),
    })).filter((group) => group.templates.length > 0);
  }, [projectTemplates]);

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

      trackEvent('project_created', {
        backend: backendStatus.isConfigured ? 'supabase' : 'local',
        template: templateId,
      });

      toast.success(backendStatus.isConfigured ? 'Project created' : 'Local project ready — draw and save to your browser');
      onOpenChange(false);
      setName('');
      setDescription('');
      setTemplateId('blank');
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
      <DialogContent className={editorDialogClassNameLg}>
        <DialogHeader>
          <div className="vish-card-mantra mx-auto mb-2 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]">
            नूतन · New Project
          </div>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Start a new blueprint workspace with a clean canvas or floor plan template.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(52vh,420px)] space-y-4 overflow-y-auto pr-1">
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
          {onOpenAIDesigner && (
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2 min-h-[44px]"
              onClick={() => {
                onOpenChange(false);
                onOpenAIDesigner();
              }}
            >
              <CopilotSwanMark motion="idle" size="sm" />
              Start with Architecture Copilot
            </Button>
          )}
          <div className="space-y-3">
            <Label>Template</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={templateId === 'blank' ? 'default' : 'outline'}
                className="min-h-[44px] touch-target"
                onClick={() => setTemplateId('blank')}
              >
                Blank
              </Button>
            </div>
            {groupedTemplates.map((group) => (
              <div key={group.category} className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.templates.map((template) => (
                    <Button
                      key={template.id}
                      type="button"
                      size="sm"
                      variant={templateId === template.id ? 'default' : 'outline'}
                      className="min-h-[44px] touch-target"
                      onClick={() => setTemplateId(template.id)}
                      title={template.description}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="min-h-[44px]">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={submitting} className="min-h-[44px]">
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
