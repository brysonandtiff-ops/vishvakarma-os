import { Compass, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function EditorCompassCost() {
  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-20 flex items-center gap-2" data-testid="editor-compass-cost">
      <button
        type="button"
        className="vish-canvas-overlay-pill gap-1.5"
        aria-label="Compass orientation"
        onClick={() => toast.message('Compass', { description: 'North orientation control coming soon.' })}
      >
        <Compass className="h-3.5 w-3.5 text-primary" />
        N
      </button>
      <button
        type="button"
        className="vish-canvas-overlay-pill gap-1.5"
        aria-label="Cost estimate"
        onClick={() => toast.message('Cost estimate', { description: 'Material cost rollup coming soon.' })}
      >
        <DollarSign className="h-3.5 w-3.5 text-primary" />
        Cost
      </button>
    </div>
  );
}
