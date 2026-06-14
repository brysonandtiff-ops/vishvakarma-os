import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function WelcomeOverlay({
  open,
  onDismiss,
  onNewProject,
  onLoadSample,
}: {
  open: boolean;
  onDismiss: () => void;
  onNewProject: () => void;
  onLoadSample: () => void;
}) {
  if (!open) return null;
  return (
    <div className="vish-editor-overlay-backdrop absolute inset-0 z-20 flex items-center justify-center p-6">
      <div className="vish-onboarding-modal vish-glass-panel vish-glass-panel--interactive vish-fade-rise max-w-md rounded-2xl p-6 text-center">
        <p className="vish-eyebrow text-primary">Creation Ritual</p>
        <h2 className="mt-3 text-xl font-bold vish-text-heading">Welcome to Vishvakarma.OS</h2>
        <p className="mt-2 text-sm vish-text-body">Draw your first floor plan or start from a template.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button type="button" variant="gold" size="full" onClick={() => { onNewProject(); onDismiss(); }}>
            New project
          </Button>
          <Button type="button" variant="goldOutline" size="full" onClick={() => { onLoadSample(); onDismiss(); }}>
            Load sample
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
