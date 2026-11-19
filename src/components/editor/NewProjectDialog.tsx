import { useMemo, useRef, useState, type FormEvent } from 'react';
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
  sourceManifest,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onProjectCreated: (project: Project) => void;
  onOpenAIDesigner?: () => void;
  sourceManifest?: ProjectManifest;
}) {
  const savingPlan = sourceManifest !== undefined;
  const [name, setName] = useState(sourceManifest?.name === 'Untitled Project' ? '' : sourceManifest?.name ?? '');
  const [description, setDescription] = useState(sourceManifest?.description ?? '');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef(false);
  const [templateId, setTemplateId] = useState<string>('blank');

  const groupedTemplates = useMemo(() => {
    if (savingPlan) return [];
    const projectTemplates = getNewProjectTemplates();
    return NEW_PROJECT_CATEGORY_ORDER.map((category) => ({
      category,
      label: SAMPLE_CATEGORY_LABELS[category],
      templates: projectTemplates.filter((entry) => entry.category === category),
    })).filter((group) => group.templates.length > 0);
  }, [savingPlan]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending.current) return;
    const projectName = name.trim();
    const projectDescription = description.trim() || undefined;
    if (!projectName) {
      setSaveError('Enter a project name.');
      return;
    }

    pending.current = true;
    setSubmitting(true);
    setSaveError(null);

    let project: Project;
    try {
      const details = { name: projectName, description: projectDescription };
      const template = sourceManifest ?? (templateId !== 'blank' ? getFloorTemplate(templateId) : null);
      const initialManifest = template ? { ...template, ...details } : createProjectManifest(details);
      project = backendStatus.isConfigured
        ? await createProject(projectName, projectDescription, initialManifest)
        : createLocalProject(projectName, projectDescription, initialManifest);

      if (!backendStatus.isConfigured && !upsertLocalProject(project)) {
        throw new Error('Browser storage is unavailable.');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      setSaveError(error instanceof Error ? error.message : 'Could not save the project.');
      return;
    } finally {
      pending.current = false;
      setSubmitting(false);
    }

    trackEvent('project_created', {
      backend: backendStatus.isConfigured ? 'supabase' : 'local',
      template: savingPlan ? 'existing-plan' : templateId,
    });

    if (savingPlan) toast.success(backendStatus.isConfigured ? 'Project saved' : 'Project saved locally');
    else toast.success(backendStatus.isConfigured ? 'Project created' : 'Local project ready — draw and save to your browser');
    setName('');
    setDescription('');
    setTemplateId('blank');
    onOpenChange(false);
    onProjectCreated(project);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!pending.current) onOpenChange(nextOpen); }}>
      <DialogContent className={editorDialogClassNameLg}>
        <DialogHeader>
          {!savingPlan && (
            <div className="vish-card-mantra mx-auto mb-2 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]">
              नूतन · New Project
            </div>
          )}
          <DialogTitle>{savingPlan ? 'Save Plan as Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>{savingPlan ? 'Name this plan so you can reopen it from Projects.' : 'Start a new blueprint workspace with a clean canvas or floor plan template.'}</DialogDescription>
        </DialogHeader>
        <form id="project-details-form" onSubmit={handleCreate} className="min-w-0 max-h-[min(52vh,420px)] space-y-4 overflow-y-auto pr-1">
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
          {!savingPlan && onOpenAIDesigner && (
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
          {!savingPlan && (
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
          )}
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
        </form>
        {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="min-h-[44px]">
            Cancel
          </Button>
          <Button type="submit" form="project-details-form" disabled={submitting} className="min-h-[44px]">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {savingPlan ? 'Saving…' : 'Creating…'}
              </>
            ) : (
              savingPlan ? 'Save Project' : 'Create Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
