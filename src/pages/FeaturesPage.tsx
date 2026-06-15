import { Link } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageMeta from '@/components/common/PageMeta';
import FeatureCard from '@/components/common/FeatureCard';
import MetricPill from '@/components/common/MetricPill';
import { Button } from '@/components/ui/button';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { EXPORT_FORMAT_COUNT } from '@/config/marketingFeatures';
import { useAuth } from '@/contexts/AuthContext';

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
    steps: ['Switch to Draft mode', 'Select Vastu tool', 'Adjust north orientation', 'Review 8-sector overlay'],
    icon: Compass,
    editorHint: 'Switch to Draft mode and select Vastu tool',
  },
  {
    title: 'India Locale & NBC',
    steps: ['Open locale pill (IN/AU)', 'Select India + metro', 'Review NBC compliance panel', 'Load Vastu 2BHK sample'],
    icon: Compass,
    editorHint: 'Use the globe locale control on the canvas',
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
  { name: 'Panchatattva Balance', ready: true, icon: Sparkles },
  { name: 'NBC India Pre-check', ready: true, icon: Route },
  { name: 'INR Cost Regions', ready: true, icon: Sparkles },
  { name: 'Collaboration', ready: false, preview: true, icon: Cloud },
  { name: 'Lighting Fixtures', ready: true, icon: Sparkles },
  { name: 'Custom Textures', ready: true, icon: Sparkles },
] as const;

export default function FeaturesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const startTo = user ? '/editor' : '/auth';

  const openGuideInEditor = (title: string, hint: string) => {
    toast.message(title, { description: `${hint} — opening the editor.` });
    navigate('/editor');
  };

  return (
    <MarketingLayout>
      <PageMeta
        title="Features & Guides — Vishvakarma.OS"
        description="Interactive editor guides and a full feature reference for Vishvakarma.OS — 2D drafting, Sacred 3D View, exports, and India compliance."
      />
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <MarketingPageHeader
          devanagari="मन्त्र यन्त्र वास्तु रचना"
          hero
          title={
            <>
              Interactive guides.
              <br />
              <span className="vish-hero-gold">Full feature reference.</span>
            </>
          }
          description="Step-by-step guides open the editor with contextual hints for each workflow."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricPill
            value={String(FEATURE_MODULES.filter((m) => m.ready).length)}
            label="ready now"
            animate
            staggerIndex={0}
          />
          <MetricPill value={String(FEATURE_MODULES.length)} label="feature modules" animate staggerIndex={1} />
          <MetricPill value={String(INTERACTIVE_GUIDES.length)} label="getting started guides" animate staggerIndex={2} />
          <MetricPill value={String(EXPORT_FORMAT_COUNT)} label="export formats" animate staggerIndex={3} />
        </div>
        <Tabs defaultValue="guides" className="mt-10">
          <TabsList className="vish-features-toggle h-auto w-full justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="guides" className="rounded-xl">
              Getting Started
            </TabsTrigger>
            <TabsTrigger value="features" className="rounded-xl">
              All Features
            </TabsTrigger>
          </TabsList>
          <TabsContent value="guides" className="mt-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          </TabsContent>
          <TabsContent value="features" className="mt-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_MODULES.map((mod) => (
                <FeatureCard
                  key={mod.name}
                  title={mod.name}
                  icon={mod.icon}
                  badge={mod.ready ? 'Available' : 'Preview'}
                  description={
                    mod.ready
                      ? 'Available now in the editor.'
                      : 'preview' in mod && mod.preview
                        ? 'Preview — collaboration planned for a future release.'
                        : 'Planned for a future release.'
                  }
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <section className="border-t border-primary/15 px-4 py-16 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ready to start</p>
          <p className="mt-4 text-lg vish-text-heading">
            Open the editor, load the sample project, and follow any guide above to draft your first floor plan.
          </p>
          <Button variant="gold" size="gold" className="mt-8" asChild>
            <Link to={startTo}>{user ? 'Open Editor →' : 'Start Free →'}</Link>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}
