import { Link } from 'react-router-dom';
import { Plus, Sparkles, WifiOff } from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { Button } from '@/components/ui/button';

const ONBOARDING_STEPS = [
  {
    sanskrit: 'रचना',
    english: 'Draw',
    detail: 'Tap Wall, then tap start and end points. Doors and windows snap onto walls.',
  },
  {
    sanskrit: 'दर्शन',
    english: 'Preview',
    detail: 'Open 3D only when needed. The heavy WebGL engine stays deferred.',
  },
  {
    sanskrit: 'प्रमाण',
    english: 'Prove',
    detail: 'Use Project Proof to show save mode, structure, spec, and export readiness.',
  },
] as const;

export default function OnboardingPanel({
  onLoadSample,
  onNewProject,
  showLocalDraftNotice = false,
}: {
  onLoadSample: () => void;
  onNewProject: () => void;
  showLocalDraftNotice?: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
      <div
        className="vish-onboarding-modal vish-glass-panel vish-glass-panel--interactive vish-fade-rise pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl"
        data-testid="first-run-welcome"
      >
        <div className="flex items-center gap-3 border-b border-primary/20 px-5 py-4">
          <div className="vish-logo-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl p-1.5">
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official user-supplied logo" className="h-full w-full rounded-xl object-cover" />
          </div>
          <div>
            <p className="font-devanagari text-[10px] uppercase tracking-[0.28em] text-primary/75">ॐ विश्वकर्मणे नमः · प्रथम रचना</p>
            <p className="text-base font-semibold text-ws-text">Build your first verified blueprint</p>
            <p className="text-[11px] text-ws-text-faint">Draw in 2D, preview in 3D, and keep proof visible while you work.</p>
          </div>
        </div>

        {showLocalDraftNotice && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-xs text-ws-text-dim">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
            <div>
              <p className="font-semibold text-ws-text">Local Draft — connect Supabase to sync</p>
              <p className="mt-1 leading-relaxed">
                Projects save in this browser until Supabase is configured.{' '}
                <Link to="/auth" className="text-primary underline-offset-2 hover:underline">
                  Sign in
                </Link>{' '}
                when cloud save is ready.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-3 px-5 py-4 text-xs text-ws-text-dim sm:grid-cols-3">
          {ONBOARDING_STEPS.map((step, index) => (
            <div key={step.english} className="rounded-2xl border border-primary/15 bg-white/5 p-3">
              <p className="font-semibold text-ws-text">
                {index + 1}. {step.english}
                <span className="font-devanagari ml-1.5 text-[10px] font-normal text-primary/70">· {step.sanskrit}</span>
              </p>
              <p className="mt-1 leading-relaxed">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-2 border-t border-primary/20 px-5 py-4 sm:grid-cols-2">
          <Button type="button" variant="gold" size="full" onClick={onLoadSample}>
            <Sparkles className="h-4 w-4" /> Load Demo Blueprint
          </Button>
          <Button type="button" variant="goldOutline" size="full" onClick={onNewProject}>
            <Plus className="h-4 w-4" /> Start Blank Project
          </Button>
        </div>
      </div>
    </div>
  );
}
