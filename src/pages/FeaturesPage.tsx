import { Link, useNavigate } from 'react-router-dom';
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
import { MarketingCtaSection } from '@/components/marketing/MarketingCtaSection';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { EXPORT_FORMAT_COUNT, PRICING_PAGE_ENABLED } from '@/config/marketingFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { getMarketingCta } from '@/lib/marketingCta';

import { TUTORIAL_GUIDE_CARDS } from '@/tutorial/tutorialCatalog';

const FEATURE_CATEGORIES = ['Drafting', 'Compliance', 'Delivery'] as const;
type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

const FEATURE_MODULES = [
  {
    name: '2D Drafting',
    ready: true,
    icon: PenLine,
    category: 'Drafting' satisfies FeatureCategory,
    description: 'Wall, door, and window tools with snap, grid, and precision overlays on the blueprint canvas.',
  },
  {
    name: 'Sacred 3D View',
    ready: true,
    icon: Box,
    category: 'Drafting' satisfies FeatureCategory,
    description: 'Walls and openings extrude live as you draft — inspect chamber geometry without leaving the editor.',
  },
  {
    name: 'Lighting Fixtures',
    ready: true,
    icon: Sparkles,
    category: 'Drafting' satisfies FeatureCategory,
    description: 'Place and tune lighting fixtures with live preview in Sacred 3D View.',
  },
  {
    name: 'Custom Textures',
    ready: true,
    icon: Sparkles,
    category: 'Drafting' satisfies FeatureCategory,
    description: 'Apply surface textures to walls and floors for client-ready 3D presentation.',
  },
  {
    name: 'Collaboration',
    ready: false,
    preview: true,
    icon: Cloud,
    category: 'Drafting' satisfies FeatureCategory,
    description: 'Preview shared presence and co-editing chrome — full collaboration planned for a future release.',
  },
  {
    name: 'Vastu Harmony',
    ready: true,
    icon: Compass,
    category: 'Compliance' satisfies FeatureCategory,
    description: 'Live Vastu overlay checks while you draft — direction, zone, and placement guidance.',
  },
  {
    name: 'Panchatattva Balance',
    ready: true,
    icon: Sparkles,
    category: 'Compliance' satisfies FeatureCategory,
    description: 'Five-element balance indicators to support holistic spatial planning decisions.',
  },
  {
    name: 'NBC India Pre-check',
    ready: true,
    icon: Route,
    category: 'Compliance' satisfies FeatureCategory,
    description: 'Pre-check floor plans against NBC India references before client delivery.',
  },
  {
    name: 'INR Cost Regions',
    ready: true,
    icon: Sparkles,
    category: 'Compliance' satisfies FeatureCategory,
    description: 'Regional INR cost bands for materials and labour tied to your project geography.',
  },
  {
    name: 'Export Package',
    ready: true,
    icon: FileOutput,
    category: 'Delivery' satisfies FeatureCategory,
    description: 'JSON, PNG, PDF, DXF, and SVG from one floor plan manifest — client-ready deliverables.',
  },
  {
    name: 'Cloud Save',
    ready: true,
    icon: Cloud,
    category: 'Delivery' satisfies FeatureCategory,
    description: 'Persist projects to Supabase with authenticated cloud sync and project library access.',
  },
  {
    name: 'Local Draft',
    ready: true,
    icon: Sparkles,
    category: 'Delivery' satisfies FeatureCategory,
    description: 'Work offline with local draft recovery — no account required in development mode.',
  },
] as const;

export default function FeaturesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cta = getMarketingCta(user);
  const heroSecondary = PRICING_PAGE_ENABLED
    ? { to: '/pricing', label: 'View Pricing' }
    : { to: '/', label: 'Back to Home' };

  const openGuideTour = (trackId: string, title: string) => {
    const route =
      trackId === 'projects-library'
        ? '/projects'
        : trackId === 'design-optimization'
          ? '/optimization'
          : trackId === 'governance-os'
            ? '/spec-center'
            : '/editor';
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
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Button variant="gold" size="gold" className="touch-target w-full sm:w-auto" asChild>
            <Link to={cta.to}>{cta.primary}</Link>
          </Button>
          <Button variant="goldOutline" size="gold" className="touch-target w-full sm:w-auto" asChild>
            <Link to={heroSecondary.to}>{heroSecondary.label}</Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
            <TabsTrigger value="guides" className="touch-target rounded-xl" data-testid="features-tab-guides">
              Getting Started
            </TabsTrigger>
            <TabsTrigger value="features" className="touch-target rounded-xl" data-testid="features-tab-all">
              All Features
            </TabsTrigger>
          </TabsList>
          <TabsContent value="guides" className="mt-8" data-testid="features-panel-guides">
            <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TUTORIAL_GUIDE_CARDS.map((guide) => (
                <FeatureCard
                  key={guide.title}
                  title={guide.title}
                  icon={guide.icon}
                  badge="In-app tour"
                  onClick={() => openGuideTour(guide.trackId, guide.title)}
                  className="touch-target min-h-[44px]"
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
          <TabsContent value="features" className="mt-8 space-y-10" data-testid="features-panel-all">
            {FEATURE_CATEGORIES.map((category) => {
              const modules = FEATURE_MODULES.filter((mod) => mod.category === category);
              return (
                <div key={category}>
                  <h2 className="vish-features-category-label">{category}</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {modules.map((mod) => (
                      <FeatureCard
                        key={mod.name}
                        title={mod.name}
                        icon={mod.icon}
                        badge={mod.ready ? 'Available' : 'Preview'}
                        description={mod.description}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </section>

      <MarketingCtaSection
        user={user}
        secondaryLink={null}
        body="Open the editor, load the sample project, and follow any guide above to draft your first floor plan."
      />
    </>
  );
}
