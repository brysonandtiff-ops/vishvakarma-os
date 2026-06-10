import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Cloud,
  Compass,
  FileOutput,
  PenLine,
  Route,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import PageMeta from '@/components/common/PageMeta';
import FeatureCard from '@/components/common/FeatureCard';
import MetricPill from '@/components/common/MetricPill';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';

const INTERACTIVE_GUIDES = [
  {
    title: 'Your First Floor Plan',
    steps: ['Load sample project', 'Draw walls (W)', 'Place door and window', 'Toggle 3D view'],
    icon: PenLine,
    editorHint: 'Start with Wall (W) and sample project',
  },
  {
    title: 'Sacred 3D View Walkthrough',
    steps: ['Draw enclosed room', 'Open 3D panel', 'Orbit and inspect openings', 'Adjust solar timeline'],
    icon: Box,
    editorHint: 'Press 3 or tap the 3D toggle',
  },
  {
    title: 'Export Package',
    steps: ['Open Export dialog', 'Choose PDF or PNG', 'Download manifest JSON', 'Verify round-trip import'],
    icon: FileOutput,
    editorHint: 'Open Export from the editor menu',
  },
  {
    title: 'Cloud Save & Local Draft',
    steps: ['Check save badge', 'Save project', 'Reload browser', 'Recover local draft if needed'],
    icon: Cloud,
    editorHint: 'Save badge shows cloud vs local draft',
  },
  {
    title: 'Vastu Harmony Overview',
    steps: ['Switch to Draft mode', 'Select Vastu tool', 'Adjust north orientation', 'Review compass overlay'],
    icon: Compass,
    editorHint: 'Switch to Draft mode and select Vastu tool',
  },
  {
    title: 'MEP & Routing Analysis',
    steps: ['Switch to MEP mode', 'Place symbols on plan', 'Review routing panel', 'Inspect fixtures in 3D'],
    icon: Route,
    editorHint: 'Switch to MEP workspace mode',
  },
] as const;

const FEATURE_MODULES = [
  { name: '2D Drafting', ready: true, icon: PenLine },
  { name: 'Sacred 3D View', ready: true, icon: Box },
  { name: 'Export Package', ready: true, icon: FileOutput },
  { name: 'Cloud Save', ready: true, icon: Cloud },
  { name: 'Local Draft', ready: true, icon: Sparkles },
  { name: 'Vastu Harmony', ready: true, icon: Compass },
  { name: 'MEP Routing', ready: true, icon: Route },
  { name: 'Collaboration', ready: false, preview: true, icon: Cloud },
  { name: 'Lighting Fixtures', ready: true, icon: Sparkles },
  { name: 'Custom Textures', ready: true, icon: Sparkles },
] as const;

export default function FeaturesPage() {
  const [tab, setTab] = useState<'guides' | 'features'>('guides');
  const navigate = useNavigate();

  const openGuideInEditor = (title: string, hint: string) => {
    toast.message(title, { description: `${hint} — opening the editor.` });
    navigate('/editor');
  };

  return (
    <MarketingLayout>
      <PageMeta title="Features & Guides" description="Learn Vishvakarma.OS with interactive guides and feature reference." />
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold vish-text-heading md:text-4xl">
          Feature guides &amp; Project Proof reference
        </h1>
        <p className="mt-3 vish-text-body">Step-by-step interactive guides open the editor with contextual hints</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MetricPill value={String(FEATURE_MODULES.filter((m) => m.ready).length)} label="ready now" />
          <MetricPill value={String(FEATURE_MODULES.length)} label="feature modules" />
          <MetricPill value={String(INTERACTIVE_GUIDES.length)} label="getting started guides" />
        </div>
        <div className="vish-features-toggle mt-10 flex gap-2">
          <button
            type="button"
            data-active={tab === 'guides'}
            onClick={() => setTab('guides')}
            className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
              tab === 'guides'
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border text-foreground/80 hover:border-primary/30 hover:text-foreground'
            }`}
          >
            Getting Started
          </button>
          <button
            type="button"
            data-active={tab === 'features'}
            onClick={() => setTab('features')}
            className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
              tab === 'features'
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border text-foreground/80 hover:border-primary/30 hover:text-foreground'
            }`}
          >
            All Features
          </button>
        </div>
        {tab === 'guides' ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INTERACTIVE_GUIDES.map((guide) => (
              <FeatureCard
                key={guide.title}
                title={guide.title}
                icon={guide.icon}
                badge="Interactive guide"
                onClick={() => openGuideInEditor(guide.title, guide.editorHint)}
                footer={
                  <ol className="list-inside list-decimal space-y-1 text-xs text-foreground/75">
                    {guide.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                }
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_MODULES.map((mod) => (
              <FeatureCard
                key={mod.name}
                title={mod.name}
                icon={mod.icon}
                badge={mod.ready ? 'Available' : 'Preview'}
                description={
                  mod.ready
                    ? 'Available now in editor.'
                    : 'preview' in mod && mod.preview
                      ? 'Preview — full collaboration ships in v2.'
                      : 'Planned — remote collaboration in a future release.'
                }
              />
            ))}
          </div>
        )}
      </section>
    </MarketingLayout>
  );
}
