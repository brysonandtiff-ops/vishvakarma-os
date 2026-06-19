import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import FeatureCard from '@/components/common/FeatureCard';
import MetricPill from '@/components/common/MetricPill';
import PageSectionGrid from '@/components/common/PageSectionGrid';
import { MarketingCtaSection } from '@/components/marketing/MarketingCtaSection';
import MarketingSection from '@/components/marketing/MarketingSection';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { Button } from '@/components/ui/button';
import { EXPORT_FORMAT_COUNT } from '@/config/marketingFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { getMarketingCta } from '@/lib/marketingCta';
import { Box, FileOutput, Layers, PenLine, Shield } from 'lucide-react';

const STATS = [
  { value: 'Live 2D↔3D', label: 'One manifest' },
  { value: String(EXPORT_FORMAT_COUNT), label: 'Export formats' },
  { value: 'Vastu + NBC', label: 'India compliance' },
  { value: '44px', label: 'Touch targets' },
] as const;

const PROOF = [
  { icon: Shield, title: 'Spec governance', desc: 'Locked specs, change requests, and audit trail for accountable delivery.' },
  { icon: FileOutput, title: 'Export Package', desc: 'JSON, PNG, PDF, DXF, and SVG from one floor plan source.' },
  { icon: Box, title: 'Sacred 3D View', desc: 'Walls and openings extrude live as you draft on the blueprint canvas.' },
  { icon: Layers, title: 'Multi-floor ready', desc: 'Per-floor geometry and floor switcher for multi-level projects.' },
] as const;

const WORKFLOW = [
  { step: 'Draw', icon: PenLine, desc: 'Wall, door, and window tools with snap and Vastu overlays.' },
  { step: 'Inspect 3D', icon: Box, desc: 'Sacred 3D View updates live as you edit the blueprint canvas.' },
  { step: 'Export Package', icon: FileOutput, desc: 'Client-ready JSON, PNG, PDF, DXF, and SVG from one manifest.' },
] as const;

export default function LandingPage() {
  const { user } = useAuth();
  const cta = getMarketingCta(user);

  return (
    <>
      <PageMeta
        title="Vishvakarma.OS — iPad-First Architecture Studio"
        description="Draw floor plans, inspect Sacred 3D View, and export client-ready packages. A governed architecture workstation in your browser."
      />
      <section className="vish-marketing-hero vish-stagger-children vish-page-enter">
        <div className="vish-hero-split">
          <div className="vish-hero-copy">
            <MarketingPageHeader
              devanagari="ॐ श्री विश्वकर्मणे नमः"
              hero
              title={
                <>
                  iPad-first architecture studio.
                  <br />
                  <span className="vish-hero-gold">Sacred 3D View.</span>
                  <br />
                  Export-ready deliverables.
                </>
              }
              description="Draw floor plans, inspect live Sacred 3D View, and export client-ready packages — governed architecture in your browser."
            />
            <div className="vish-hero-cta mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button variant="gold" size="gold" className="touch-target w-full sm:w-auto" asChild>
                <Link to={cta.to}>{cta.primary}</Link>
              </Button>
              {cta.secondary && (
                <Button variant="goldOutline" size="gold" className="touch-target w-full sm:w-auto" asChild>
                  <Link to={cta.secondary.to}>{cta.secondary.label}</Link>
                </Button>
              )}
            </div>
            <div className="vish-hero-stats mt-14 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:mt-16">
              {STATS.map((stat, index) => (
                <MetricPill key={stat.label} value={stat.value} label={stat.label} animate staggerIndex={index} />
              ))}
            </div>
          </div>

          <div className="vish-hero-showcase" aria-hidden="true">
            <figure className="vish-hero-showcase__main vish-frame-bezel">
              <img src="/marketing/product-3d.png" alt="" width={1280} height={800} decoding="async" />
              <figcaption>
                <span className="vish-hero-showcase__dot" />
                Sacred 3D View · live sync
              </figcaption>
            </figure>
            <figure className="vish-hero-showcase__inset vish-frame-bezel">
              <img src="/marketing/product-2d.png" alt="" width={1280} height={800} decoding="async" />
              <figcaption>2D Blueprint</figcaption>
            </figure>
            <span className="vish-hero-showcase__flow">2D&nbsp;→&nbsp;3D&nbsp;live</span>
          </div>
        </div>
      </section>

      <MarketingSection
        className="vish-fade-rise"
        title="Blueprint to chamber"
        description="One floor plan powers 2D drafting, live 3D preview, and every export format."
      >
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <figure className="vish-frame-bezel flex flex-col overflow-hidden rounded-card-lg border border-primary/25 bg-card/60 shadow-lg backdrop-blur-sm">
            <img
              src="/marketing/product-2d.png"
              alt="2D blueprint editor with sample floor plan"
              className="aspect-[16/10] h-auto w-full object-cover"
              loading="lazy"
            />
            <figcaption className="border-t border-border/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] vish-text-heading">
              2D Blueprint Canvas
            </figcaption>
          </figure>
          <figure className="vish-frame-bezel flex flex-col overflow-hidden rounded-card-lg border border-primary/25 bg-card/60 shadow-lg backdrop-blur-sm">
            <img
              src="/marketing/product-3d.png"
              alt="Live 3D model chamber with extruded walls"
              className="aspect-[16/10] h-auto w-full object-cover"
              loading="lazy"
            />
            <figcaption className="border-t border-border/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] vish-text-heading">
              Sacred 3D View
            </figcaption>
          </figure>
          <figure className="vish-frame-bezel flex flex-col overflow-hidden rounded-card-lg border border-primary/25 bg-card/60 shadow-lg backdrop-blur-sm lg:col-span-2 xl:col-span-1">
            <img
              src="/marketing/product-export.png"
              alt="Export Package dialog with JSON, PNG, PDF, DXF, and SVG formats"
              className="aspect-[16/10] h-auto w-full object-cover"
              loading="lazy"
            />
            <figcaption className="border-t border-border/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] vish-text-heading">
              Export Package
            </figcaption>
          </figure>
        </div>
        <ol className="vish-workflow-strip mt-8 grid gap-6 md:grid-cols-3 md:gap-4">
          {WORKFLOW.map((item, index) => (
            <li key={item.step} className="vish-workflow-step flex items-start gap-3 md:flex-col md:items-center md:text-center">
              <span className="vish-workflow-number shrink-0" aria-hidden="true">
                {index + 1}
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary md:mt-1">
                <item.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{item.step}</p>
                <p className="mt-1 text-xs leading-relaxed vish-text-body">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection
        bordered={false}
        className="vish-fade-rise"
        title="Built for professional delivery"
        description="A governed architectural workstation — specs, exports, and audit trail built in."
      >
        <PageSectionGrid cols={2} className="mt-2">
          {PROOF.map((item) => (
            <FeatureCard key={item.title} title={item.title} icon={item.icon} description={item.desc} />
          ))}
        </PageSectionGrid>
      </MarketingSection>

      <MarketingCtaSection
        user={user}
        body="Load the sample project, draw your first walls, and export a deliverable package in minutes."
      />
    </>
  );
}
