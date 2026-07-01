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
import { Box, CheckCircle2, FileOutput, Layers, PenLine, Shield, TabletSmartphone } from 'lucide-react';

const STATS = [
  { value: '2D + 3D', label: 'Live design sync' },
  { value: String(EXPORT_FORMAT_COUNT), label: 'Export formats' },
  { value: 'iPad-first', label: 'Touch-ready PWA' },
  { value: 'Governed', label: 'Specs + audit trail' },
] as const;

const PROOF = [
  { icon: Shield, title: 'Governed from the start', desc: 'Specs, change requests, releases, and audit logs keep every project accountable.' },
  { icon: FileOutput, title: 'Export without rebuilding', desc: 'Create JSON, PNG, PDF, DXF, and SVG packages from one floor-plan source.' },
  { icon: Box, title: 'Live Sacred 3D View', desc: 'Walls and openings extrude as you draft, so clients understand the plan faster.' },
  { icon: Layers, title: 'Built for real projects', desc: 'Multi-floor geometry, project state, and proof panels support serious design work.' },
] as const;

const WORKFLOW = [
  { step: 'Draw the plan', icon: PenLine, desc: 'Start with walls, doors, windows, dimensions, rooms, furniture, MEP, terrain, and Vastu layers.' },
  { step: 'Inspect in 3D', icon: Box, desc: 'Open Sacred 3D View to check shape, openings, room flow, and presentation clarity.' },
  { step: 'Export proof', icon: FileOutput, desc: 'Package the same governed project into client-ready files for review and handoff.' },
] as const;

const CLARITY_POINTS = [
  'Browser-native: no heavy desktop install required.',
  'Designed around iPad landscape, then checked down to mobile.',
  'One workspace connects drafting, 3D review, governance, and export proof.',
] as const;

const DEVICE_PROOF = [
  { label: 'iPad landscape', value: 'Editor-first layout' },
  { label: 'Tablet portrait', value: 'Stacked proof flow' },
  { label: 'Phone', value: 'Readable marketing path' },
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
      <section className="vish-marketing-hero vish-landing-hero vish-stagger-children vish-page-enter py-16 md:py-24">
        <div className="vish-hero-split vish-landing-hero__split lg:gap-16">
          <div className="vish-hero-copy vish-landing-hero__copy">
            <MarketingPageHeader
              devanagari="ॐ श्री विश्वकर्मणे नमः"
              hero
              title={
                <>
                  Draw floor plans.
                  <br />
                  <span className="vish-hero-gold drop-shadow-sm">Inspect live 3D.</span>
                  <br />
                  Export the proof.
                </>
              }
              description="Vishvakarma.OS is an iPad-first architecture workstation for drafting, Sacred 3D View, governed project proof, and client-ready exports — all in the browser."
            />

            <div className="vish-hero-cta mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button variant="gold" size="gold" className="touch-target w-full px-8 sm:w-auto" asChild>
                <Link to={cta.to}>{cta.primary}</Link>
              </Button>
              {cta.secondary && (
                <Button variant="goldOutline" size="gold" className="touch-target w-full px-8 sm:w-auto" asChild>
                  <Link to={cta.secondary.to}>{cta.secondary.label}</Link>
                </Button>
              )}
            </div>

            <p className="vish-landing-cta-note mt-4 text-sm leading-relaxed vish-text-body">
              Best first test: open on iPad 10 in landscape, load the demo project, draw a wall, toggle 3D, then export.
            </p>

            <ul className="vish-landing-checklist mt-8" aria-label="What Vishvakarma.OS does clearly">
              {CLARITY_POINTS.map((point) => (
                <li key={point}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="vish-hero-stats mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {STATS.map((stat, index) => (
                <MetricPill key={stat.label} value={stat.value} label={stat.label} animate staggerIndex={index} />
              ))}
            </div>
          </div>

          <div className="vish-hero-showcase vish-landing-showcase" aria-label="Vishvakarma.OS product preview">
            <figure className="vish-hero-showcase__main vish-frame-bezel">
              <img src="/marketing/product-3d.png" alt="Live Sacred 3D View generated from a floor plan" width={1280} height={800} decoding="async" />
              <figcaption>
                <span className="vish-hero-showcase__dot" />
                Sacred 3D View · live sync
              </figcaption>
            </figure>
            <figure className="vish-hero-showcase__inset vish-frame-bezel">
              <img src="/marketing/product-2d.png" alt="2D blueprint editor with a sample floor plan" width={1280} height={800} decoding="async" />
              <figcaption>2D Blueprint</figcaption>
            </figure>
            <span className="vish-hero-showcase__flow">2D&nbsp;→&nbsp;3D&nbsp;live</span>
          </div>
        </div>
      </section>

      <MarketingSection
        className="vish-fade-rise vish-landing-clarity-section"
        title="What it does in plain English"
        description="A clear architecture flow: draw the plan, inspect it in live 3D, keep the project governed, then export proof for the next conversation."
      >
        <ol className="vish-landing-clarity-grid" aria-label="Vishvakarma.OS workflow">
          {WORKFLOW.map((item, index) => (
            <li key={item.step} className="vish-landing-clarity-card">
              <span className="vish-workflow-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="vish-landing-clarity-icon" aria-hidden="true">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <h3>{item.step}</h3>
                <p>{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection
        className="vish-fade-rise"
        title="See the same project from every angle"
        description="One floor plan powers 2D drafting, live 3D review, and every export package. The page now stacks cleanly from desktop to iPad to phone."
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
      </MarketingSection>

      <MarketingSection
        bordered={false}
        className="vish-fade-rise"
        title="Built for professional delivery"
        description="Clear value for real users: client explanation, traceable changes, export packages, and device-aware layout."
      >
        <PageSectionGrid cols={2} className="mt-2">
          {PROOF.map((item) => (
            <FeatureCard key={item.title} title={item.title} icon={item.icon} description={item.desc} />
          ))}
        </PageSectionGrid>
        <div className="vish-landing-device-proof mt-8" aria-label="Device layout proof summary">
          <div className="vish-landing-device-proof__lead">
            <TabletSmartphone className="h-5 w-5" aria-hidden="true" />
            <span>Device clarity pass</span>
          </div>
          <div className="vish-landing-device-proof__grid">
            {DEVICE_PROOF.map((item) => (
              <p key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </p>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingCtaSection
        user={user}
        body="Open the sample project, draw your first walls, inspect the Sacred 3D View, and export a deliverable package in minutes."
      />
    </>
  );
}
