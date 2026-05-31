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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-6">
      <div className="vish-glass-panel max-w-md rounded-2xl p-6 text-center text-stone-100">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">Creation Ritual</p>
        <h2 className="mt-3 text-xl font-bold">Welcome to Vishvakarma.OS</h2>
        <p className="mt-2 text-sm text-stone-400">Draw your first floor plan or start from a template.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button className="w-full" onClick={() => { onNewProject(); onDismiss(); }}>New project</Button>
          <Button variant="outline" className="w-full" onClick={() => { onLoadSample(); onDismiss(); }}>Load sample</Button>
          <Link to="/features" className="text-xs text-primary" onClick={onDismiss}>Video guides</Link>
        </div>
        <button type="button" className="mt-4 min-h-[44px] px-4 text-sm text-stone-400 hover:text-stone-200" onClick={onDismiss}>
          Skip — start drawing
        </button>
      </div>
    </div>
  );
}
