import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';

export default function OnboardingPanel({ onLoadSample, onNewProject }: { onLoadSample: () => void; onNewProject: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
      <div className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl border border-primary/30 bg-black/85 shadow-2xl backdrop-blur-xl" data-testid="first-run-welcome">
        <div className="flex items-center gap-3 border-b border-primary/20 px-5 py-4">
          <div className="vish-logo-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl p-1.5">
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official user-supplied logo" className="h-full w-full rounded-xl object-cover" />
          </div>
          <div>
            <p className="text-base font-semibold text-ws-text">Build your first verified blueprint</p>
            <p className="text-[11px] text-ws-text-faint">Draw in 2D, preview in 3D, and keep proof visible while you work.</p>
          </div>
        </div>

        <div className="grid gap-3 px-5 py-4 text-xs text-ws-text-dim sm:grid-cols-3">
          <div className="rounded-2xl border border-primary/15 bg-white/5 p-3">
            <p className="font-semibold text-ws-text">1. Draw</p>
            <p className="mt-1 leading-relaxed">Tap Wall, then tap start and end points. Doors and windows snap onto walls.</p>
          </div>
          <div className="rounded-2xl border border-primary/15 bg-white/5 p-3">
            <p className="font-semibold text-ws-text">2. Preview</p>
            <p className="mt-1 leading-relaxed">Open 3D only when needed. The heavy WebGL engine stays deferred.</p>
          </div>
          <div className="rounded-2xl border border-primary/15 bg-white/5 p-3">
            <p className="font-semibold text-ws-text">3. Prove</p>
            <p className="mt-1 leading-relaxed">Use Project Proof to show save mode, structure, spec, and export readiness.</p>
          </div>
        </div>

        <div className="grid gap-2 border-t border-primary/20 px-5 py-4 sm:grid-cols-2">
          <Button onClick={onLoadSample} className="rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="mr-2 h-4 w-4" /> Load Demo Blueprint
          </Button>
          <Button onClick={onNewProject} variant="outline" className="rounded-xl border-primary/30 bg-white/5 text-ws-text hover:bg-primary/15">
            <Plus className="mr-2 h-4 w-4" /> Start Blank Project
          </Button>
        </div>
      </div>
    </div>
  );
}
