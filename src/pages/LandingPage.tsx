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
import {
  Box,
  CheckCircle2,
  FileOutput,
  Layers,
  PenLine,
  Shield,
  TabletSmartphone,
} from 'lucide-react';

const STATS = [
  { value: 'Plan → 3D', label: 'Connected design flow' },
  { value: String(EXPORT_FORMAT_COUNT), label: 'Export formats' },
  { value: 'iPad-first', label: 'Touch-ready PWA' },
  { value: 'Gated', label: 'Specs + audit trail' },
] as const;

const HERO_PILLS = [
  { icon: Layers, label: '2D ↔ 3D sync' },
  { icon: FileOutput, label: 'Client-ready export pack' },
  { icon: Shield, label: '13 release gates' },
  { icon: TabletSmartphone, label: 'iPad-first workflow' },
] as const;

const PROOF = [
  { icon: Shield, title: 'Governed from the start', desc: 'Specs, change requests, releases, and audit logs keep every project accountable.' },
  { icon: FileOutput, title: 'Export without rebuilding', desc: 'Create JSON, PNG, PDF, DXF, and SVG packages from one floor-plan source.' },
  { icon: Box, title: 'Live Sacred 3D View', desc: 'Walls and openings extrude as you draft, so clients understand the plan faster.' },
  { icon: Layers, title: 'Built for real projects', desc: 'Multi-floor geometry, project state, and proof panels support serious design work.' },
] as const;

const WORKFLOW = [
  { step: 'Draw the plan', icon: PenLine, desc: 'Start with walls, rooms, doors, windows, dimensions, furniture, MEP, terrain, and Vastu layers.' },
  { step: 'Inspect in 3D', icon: Box, desc: 'Open Sacred 3D View to check shape, openings, room flow, and presentation clarity.' },
  { step: 'Export proof', icon: FileOutput, desc: 'Package the same governed project into client-ready files for review and handoff.' },
] as const;

const CLARITY_POINTS = [
  'Browser-native: no heavy desktop install required.',
  'Designed around iPad landscape, then checked down to mobile.',
  'One workspace connects drafting, 3D review, release governance, and export proof.',
] as const;

const DEVICE_PROOF = [
  { label: 'iPad landscape', value: 'Editor-first layout' },
  { label: 'Tablet portrait', value: 'Stacked proof flow' },
  { label: 'Phone', value: 'Readable marketing path' },
] as const;

const GOVERNANCE_GATES = [
  'spec.verify · sha256 match',
  'registry.integrity · 0 drift',
  'audit.chain · continuous',
  'editor.render · 2D/3D checked',
  'export.package · proof ready',
] as const;

const ROOMS = [
  {
    eyebrow: 'Drafting room',
    title: 'Fast 2D plan work',
    body: 'Draw, select, place openings, measure, load samples, and keep local drafts safe while the project grows.',
    to: '/editor-lite',
  },
  {
    eyebrow: 'Sacred 3D room',
    title: 'Client-ready spatial review',
    body: 'Live 3D keeps the same project understandable with standard, premium, and cinematic atmosphere modes.',
    to: '/editor',
  },
  {
    eyebrow: 'Governance room',
    title: 'Proof before promise',
    body: 'Spec center, registry, change requests, releases, and audit trails keep the product proof honest.',
    to: '/releases',
  },
  {
    eyebrow: 'Delivery room',
    title: 'Export and handoff',
    body: 'One manifest drives JSON, image, drawing, and proof-package outputs instead of rebuilding the same job twice.',
    to: '/projects',
  },
] as const;

export default function LandingPage() {
  const { user } = useAuth();
  const cta = getMarketingCta(user);

  return (
    <>
      <PageMeta
        title="Vishvakarma.OS — Draw floor plans, review in 3D, export proof"
        description="Browser-native architecture studio for 2D floor plans, live 3D review, governed releases, and client-ready export packages."
      />

      <section className="vish-marketing-hero vish-landing-hero vish-stagger-children vish-page-enter py-14 md:py-24">
        <div className="vish-hero-split vish-landing-hero__split lg:gap-16">
          <div className="vish-hero-copy vish-landing-hero__copy">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ws-text-dim shadow-lg backdrop-blur" aria-label="Release status">
              <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_14px_hsl(142_60%_45%/0.75)]" />
              <span>v1.5 · Production UI pass</span>
            </div>

            <MarketingPageHeader
              devanagari="ॐ श्री विश्वकर्मणे नमः"
              hero
              title={
                <>
                  Draw floor plans.
                  <br />
                  <span className="vish-hero-gold drop-shadow-sm">Review in 3D.</span>
                  <br />
                  Export proof.
                </>
              }
              description="Vishvakarma.OS is an iPad-first, browser-native architecture studio that turns one governed project into a 2D plan, a live 3D review, and a client-ready export package."
            />

            <div className="vish-hero-cta mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button variant="gold" size="gold" className="touch-target w-full gap-2 px-8 sm:w-auto" asChild>
                <Link to={cta.to}>{cta.primary}</Link>
              </Button>
              <Button variant="goldOutline" size="gold" className="touch-target w-full px-8 sm:w-auto" asChild>
                <Link to="/features">View features</Link>
              </Button>
              <Button variant="goldOutline" size="gold" className="touch-target w-full px-8 sm:w-auto" asChild>
                <Link to="/editor-lite">Try Lite Editor</Link>
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Product proof points">
              {HERO_PILLS.map((pill) => (
                <li key={pill.label} className="inline-flex min-h-[34px] items-center gap-2 rounded-full border border-primary/20 bg-card/60 px-3 py-1 text-xs font-medium text-ws-text-dim shadow-sm backdrop-blur-sm">
                  <pill.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {pill.label}
                </li>
              ))}
            </ul>

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
            <figure className="vish-hero-showcase__main vish-frame-bezel overflow-hidden rounded-2xl border border-primary/25">
              <div className="flex min-h-[38px] items-center gap-1.5 border-b border-border/60 bg-muted/35 px-4 py-2.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <strong className="ml-3 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-ws-text-dim">sacred-3d-view · Premium</strong>
              </div>
              <img src="/marketing/product-3d.png" alt="Live Sacred 3D View generated from a floor plan" width={1280} height={800} decoding="async" loading="eager" />
              <figcaption>
                <span className="vish-hero-showcase__dot" />
                Sacred 3D View · live sync
              </figcaption>
            </figure>
            <figure className="vish-hero-showcase__inset vish-frame-bezel overflow-hidden rounded-2xl border border-primary/25">
              <div className="flex min-h-[32px] items-center gap-1.5 border-b border-border/60 bg-muted/35 px-3 py-2" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-destructive/70" />
                <span className="h-2 w-2 rounded-full bg-primary/70" />
                <span className="h-2 w-2 rounded-full bg-success/70" />
                <strong className="ml-2 truncate font-mono text-[9px] uppercase tracking-[0.18em] text-ws-text-dim">2D blueprint</strong>
              </div>
              <img src="/marketing/product-2d.png" alt="2D blueprint editor with a sample floor plan" width={1280} height={800} decoding="async" loading="lazy" />
              <figcaption>2D Blueprint</figcaption>
            </figure>
            <span className="vish-hero-showcase__flow">2D&nbsp;→&nbsp;3D&nbsp;live</span>
          </div>
        </div>
      </section>

      <MarketingSection
        className="vish-fade-rise vish-landing-clarity-section"
        title="A complete project path, not just a toolbar"
        description="The landing page now leads with the real buyer journey: draw the plan, inspect it in 3D, prove the release state, then export the handoff package."
      >
        <ol className="vish-workflow-strip vish-landing-clarity-grid" aria-label="Vishvakarma.OS workflow">
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
        title="Nothing ships unless it is specified, gated, and provable"
        description="Vish’s proof model stays visible: specs, registry, audit, editor rendering, export evidence, and release gates."
      >
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="rounded-2xl border border-primary/20 bg-card/45 p-6 shadow-lg backdrop-blur-sm md:p-8">
            <p className="vish-marketing-section-label">Governance model</p>
            <h3 className="mt-3 text-3xl font-semibold leading-tight vish-text-heading md:text-4xl">
              Proof before polish.
              <span className="block text-primary">Claims stay honest.</span>
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-relaxed vish-text-body md:text-base">
              Every serious workflow needs visible state: what is available, what is preview, what requires Supabase, and what has been verified by evidence.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="goldOutline" className="touch-target">
                <Link to="/spec-center">Spec Center</Link>
              </Button>
              <Button asChild variant="goldOutline" className="touch-target">
                <Link to="/releases">Release gates</Link>
              </Button>
            </div>
          </div>

          <div className="vish-frame-bezel rounded-2xl border border-primary/25 p-5 md:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ws-text-dim">Release · current</p>
                <strong className="mt-1 block text-lg vish-text-heading">Ship candidate</strong>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> gated
              </span>
            </div>
            <ul className="mt-5 space-y-3" aria-label="Release gate examples">
              {GOVERNANCE_GATES.map((gate) => (
                <li key={gate} className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/45 px-4 py-3 text-sm text-ws-text-dim">
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                  <span>{gate}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection
        className="vish-fade-rise"
        title="Rooms for every step of the architecture workflow"
        description="Each room has a clear purpose so users know where to draw, inspect, govern, and deliver."
      >
        <PageSectionGrid cols={4}>
          {ROOMS.map((room) => (
            <FeatureCard
              key={room.title}
              title={room.title}
              description={room.body}
              badge={room.eyebrow}
              className="vish-landing-room-card"
              footer={
                <Link to={room.to} className="inline-flex text-sm font-semibold text-primary hover:text-primary/80">
                  Open room →
                </Link>
              }
            />
          ))}
        </PageSectionGrid>
      </MarketingSection>

      <MarketingSection
        className="vish-fade-rise"
        title="Device checks are part of the product, not an afterthought"
        description="The interface is tuned for touch targets, safe-area spacing, and readable cards across iPad and phone layouts."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {DEVICE_PROOF.map((item) => (
            <div key={item.label} className="rounded-2xl border border-primary/20 bg-card/45 p-6 shadow-sm backdrop-blur-sm">
              <p className="vish-marketing-section-label">{item.label}</p>
              <p className="mt-3 text-xl font-semibold vish-text-heading">{item.value}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        className="vish-fade-rise"
        title="Proof pillars"
        description="The public page now mirrors the software honestly: editor, 3D view, exports, and release evidence."
      >
        <PageSectionGrid cols={4}>
          {PROOF.map((item) => (
            <FeatureCard key={item.title} title={item.title} description={item.desc} icon={item.icon} />
          ))}
        </PageSectionGrid>
      </MarketingSection>

      <MarketingCtaSection
        eyebrow="Start with a plan"
        body="Open the workspace, load a sample, inspect it in 3D, and export a proof package from the same governed project."
        user={user}
        secondaryLink={{ label: 'View release gates', to: '/releases' }}
      />
    </>
  );
}
