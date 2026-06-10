import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AIDesignerResultsPanel from '@/components/editor/ai-designer/AIDesignerResultsPanel';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import { generateFromPrompt } from '@/modules/ai-designer/buildingDesignerModule';
import type { PipelineStage } from '@/services/floorplan-generation/orchestrator';
import type { Project, ProjectManifest } from '@/types';

const STAGE_LABELS: Record<PipelineStage, string> = {
  extracting: 'Extracting requirements…',
  constraints: 'Applying constraints…',
  layout: 'Solving room layout…',
  floorplan: 'Generating floor plan…',
  schedules: 'Building schedules…',
  complete: 'Complete',
  error: 'Error',
};

type ResultTab = 'site' | 'schedules' | 'map' | 'cost';

export default function AIDesignerDialog({
  open,
  onOpenChange,
  onOpenInEditor,
  onSaveProject,
  initialPrompt = '',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenInEditor: (manifest: ProjectManifest, projectName: string) => void;
  onSaveProject?: (manifest: ProjectManifest, projectName: string) => Promise<Project | void>;
  initialPrompt?: string;
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [parcelArea, setParcelArea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState<PipelineStage | null>(null);
  const [result, setResult] = useState<GeneratedBuilding | null>(null);
  const [tab, setTab] = useState<ResultTab>('site');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Describe the home you want to design');
      return;
    }

    setGenerating(true);
    setResult(null);
    setStage('extracting');

    try {
      const { building } = await generateFromPrompt({
        prompt: prompt.trim(),
        parcelOverride: parcelArea ? { area: Number(parcelArea) } : undefined,
        onStage: setStage,
      });
      setResult(building);
      setTab('site');
      toast.success('Building design generated');
    } catch (error) {
      console.error(error);
      setStage('error');
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const projectName = result?.manifest.name ?? 'AI Designed Home';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="vish-dialog-chrome max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl md:max-w-2xl">
        <DialogHeader>
          <div className="vish-card-mantra mx-auto mb-2 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]">
            AI · Building Designer
          </div>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Design with AI
          </DialogTitle>
          <DialogDescription>
            Describe your home — site plan, floor plan, schedules, 3D model, and cost estimate are generated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-prompt">Design brief</Label>
            <Textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="4-bedroom modern home on 600m² corner block with double garage"
              rows={3}
              disabled={generating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-parcel">Parcel area m² (optional)</Label>
            <Input
              id="ai-parcel"
              type="number"
              value={parcelArea}
              onChange={(e) => setParcelArea(e.target.value)}
              placeholder="600"
              disabled={generating}
            />
          </div>

          {generating && stage && (
            <p className="text-xs text-muted-foreground">{STAGE_LABELS[stage]}</p>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(['site', 'schedules', 'map', 'cost'] as ResultTab[]).map((key) => (
                  <Button key={key} size="sm" variant={tab === key ? 'default' : 'outline'} onClick={() => setTab(key)}>
                    {key === 'site' ? 'Site plan' : key === 'schedules' ? 'Schedules' : key === 'map' ? 'Architecture map' : 'Cost'}
                  </Button>
                ))}
              </div>
              <AIDesignerResultsPanel building={result} tab={tab} />
              <p className="text-xs text-muted-foreground">
                {result.floorPlan.rooms.length} rooms · {result.floorPlan.walls.length} walls · ${result.costSummary.total.toLocaleString()} est.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancel
          </Button>
          {!result ? (
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                'Generate design'
              )}
            </Button>
          ) : (
            <>
              {onSaveProject && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await onSaveProject(result.manifest, projectName);
                    onOpenChange(false);
                  }}
                >
                  Save project
                </Button>
              )}
              <Button
                onClick={() => {
                  onOpenInEditor(result.manifest, projectName);
                  onOpenChange(false);
                }}
              >
                Open in editor
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
