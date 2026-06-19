import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function WelcomeOverlay({
  open,
  onDismiss,
  onNewProject,
  onLoadSample,
  onOpenProjects,
  returningUser = false,
  hasCloudProjects = false,
}: {
  open: boolean;
  onDismiss: () => void;
  onNewProject: () => void;
  onLoadSample: () => void;
  onOpenProjects?: () => void;
  returningUser?: boolean;
  hasCloudProjects?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="vish-editor-overlay-backdrop absolute inset-0 z-20 flex items-center justify-center p-6">
      <div className="vish-onboarding-modal vish-glass-panel vish-glass-panel--interactive vish-fade-rise max-w-md rounded-card-lg p-card-md text-center" data-testid="first-run-welcome">
        <p className="vish-eyebrow text-primary">{returningUser ? 'Welcome back' : 'Creation Ritual'}</p>
        <h2 className="mt-3 text-xl font-bold vish-text-heading">
          {returningUser ? 'Your workspace is ready' : 'Welcome to Vishvakarma.OS'}
        </h2>
        <p className="mt-2 max-w-prose-content mx-auto text-sm vish-text-body">
          {returningUser
            ? 'Continue a cloud project or start fresh on the blueprint canvas.'
            : 'Draw your first floor plan or start from a template.'}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {hasCloudProjects && onOpenProjects && (
            <Button type="button" variant="gold" size="full" className="touch-target" onClick={() => { onOpenProjects(); onDismiss(); }}>
              Continue from cloud
            </Button>
          )}
          <Button type="button" variant={hasCloudProjects ? 'goldOutline' : 'gold'} size="full" className="touch-target" onClick={() => { onNewProject(); onDismiss(); }}>
            New project
          </Button>
          <Button type="button" variant="goldOutline" size="full" className="touch-target" onClick={() => { onLoadSample(); onDismiss(); }}>
            Load sample blueprint
          </Button>
          <Link to="/features" className="text-xs text-primary" onClick={onDismiss}>
            Video guides
          </Link>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-4 min-h-[44px] px-4 text-sm vish-text-body hover:text-primary"
          onClick={onDismiss}
        >
          Skip — start drawing
        </Button>
      </div>
    </div>
  );
}
