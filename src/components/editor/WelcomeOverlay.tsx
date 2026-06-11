import { Link } from 'react-router-dom';

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
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">Creation Ritual</p>
        <h2 className="mt-3 text-xl font-bold vish-text-heading">Welcome to Vishvakarma.OS</h2>
        <p className="mt-2 text-sm vish-text-body">Draw your first floor plan or start from a template.</p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" className="vish-gold-action w-full" onClick={() => { onNewProject(); onDismiss(); }}>
            New project
          </button>
          <button type="button" className="vish-gold-cta-outline w-full" onClick={() => { onLoadSample(); onDismiss(); }}>
            Load sample
          </button>
          <Link to="/features" className="text-xs text-primary" onClick={onDismiss}>
            Video guides
          </Link>
        </div>
        <button
          type="button"
          className="mt-4 min-h-[44px] px-4 text-sm vish-text-body hover:text-primary"
          onClick={onDismiss}
        >
          Skip — start drawing
        </button>
      </div>
    </div>
  );
}
