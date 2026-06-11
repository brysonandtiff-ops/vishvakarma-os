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
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';

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
        <MarketingPageHeader
          devanagari="मन्त्र यन्त्र वास्तु रचना"
          title="Feature guides & Project Proof reference"
          description="Step-by-step interactive guides open the editor with contextual hints"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MetricPill
            value={String(FEATURE_MODULES.filter((m) => m.ready).length)}
            label="ready now"
            animate
            staggerIndex={0}
          />
          <MetricPill value={String(FEATURE_MODULES.length)} label="feature modules" animate staggerIndex={1} />
          <MetricPill value={String(INTERACTIVE_GUIDES.length)} label="getting started guides" animate staggerIndex={2} />
        </div>
        <div className="vish-features-toggle mt-10" role="tablist" aria-label="Features page sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'guides'}
            data-active={tab === 'guides'}
            onClick={() => setTab('guides')}
          >
            Getting Started
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'features'}
            data-active={tab === 'features'}
            onClick={() => setTab('features')}
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
                  <ol className="vish-feature-grid-card__steps list-inside list-decimal space-y-1.5">
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
