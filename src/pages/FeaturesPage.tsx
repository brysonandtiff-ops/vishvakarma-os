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
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { EXPORT_FORMAT_COUNT } from '@/config/marketingFeatures';
import { useAuth } from '@/contexts/AuthContext';

import { TUTORIAL_GUIDE_CARDS } from '@/tutorial/tutorialCatalog';

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

  const openGuideTour = (trackId: string, title: string) => {
    const track = TUTORIAL_GUIDE_CARDS.find((g) => g.trackId === trackId);
    const route = trackId === 'projects-library' ? '/projects' : trackId === 'design-optimization' ? '/optimization' : trackId === 'governance-os' ? '/spec-center' : '/editor';
    navigate(`${route}?tutorial=${trackId}`);
    toast.message(title, { description: 'In-app tour starting…' });
  };

  return (
    <>
      <PageMeta
        title="Features & Guides — Vishvakarma.OS"
        description="Interactive editor guides and a full feature reference for Vishvakarma.OS — 2D drafting, Sacred 3D View, exports, and India compliance."
      />
      <section className="vish-marketing-hero vish-stagger-children py-12 md:py-16">
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
          <MetricPill value={String(TUTORIAL_GUIDE_CARDS.length)} label="getting started guides" animate staggerIndex={2} />
          <MetricPill value={String(EXPORT_FORMAT_COUNT)} label="export formats" animate staggerIndex={3} />
        </div>
        <Tabs defaultValue="guides" className="mt-10">
          <TabsList className="vish-features-toggle h-auto min-h-nav-row w-full justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="guides" className="rounded-xl">
              Getting Started
            </TabsTrigger>
            <TabsTrigger value="features" className="rounded-xl">
              All Features
            </TabsTrigger>
          </TabsList>
          <TabsContent value="guides" className="mt-8">
            <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TUTORIAL_GUIDE_CARDS.map((guide) => (
                <FeatureCard
                  key={guide.title}
                  title={guide.title}
                  icon={guide.icon}
                  badge="In-app tour"
                  onClick={() => openGuideTour(guide.trackId, guide.title)}
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

      <section className="vish-marketing-section vish-marketing-section--bordered py-16">
        <div className="mx-auto max-w-prose-content text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ready to start</p>
          <p className="mt-4 text-lg vish-text-heading">
            Open the editor, load the sample project, and follow any guide above to draft your first floor plan.
          </p>
          <Button variant="gold" size="gold" className="mt-8" asChild>
            <Link to={startTo}>{user ? 'Open Editor →' : 'Start Free →'}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
