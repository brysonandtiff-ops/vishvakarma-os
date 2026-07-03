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
  ArrowRight,
  Box,
  CheckCircle2,
  FileOutput,
  Layers,
  PenLine,
  Shield,
  TabletSmartphone,
} from 'lucide-react';

const STATS = [
  { value: '2D + 3D', label: 'Live design sync' },
  { value: String(EXPORT_FORMAT_COUNT), label: 'Export formats' },
  { value: 'iPad-first', label: 'Touch-ready PWA' },
  { value: 'Governed', label: 'Specs + audit trail' },
] as const;

const HERO_PILLS = [
  { icon: Layers, label: '2D ↔ 3D sync' },
  { icon: FileOutput, label: 'JSON · SVG · DXF · PDF export' },
  { icon: Shield, label: '13 release gates' },
  { icon: TabletSmartphone, label: '44px touch targets' },
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
    body: 'Spec center, registry, change requests, releases, audit, and world-record candidate wording stay visibly truthful.',
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
        title="Vishvakarma.OS — Governed architectural studio in the browser"
        description="Precision 2D blueprint canvas, live Sacred 3D View, and a governance operating system that gates every change. iPad-first, browser-native."
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
                  The governed
                  <br />
                  <span className="vish-hero-gold drop-shadow-sm">Sacred 3D View</span>
                  <br />
                  for architects.
                </>
              }
              description="An iPad-first, browser-native blueprint editor and live 3D studio — now shaped around a cleaner VIP landing flow while keeping Vish governance, evidence, export proof, and Google SSO intact."
            />

            <div className="vish-hero-cta mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button variant="gold" size="gold" className="touch-target w-full gap-2 px-8 sm:w-auto" asChild>
                <Link to={cta.to}>
                  {cta.primary}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="goldOutline" size="gold" className="touch-target w-full px-8 sm:w-auto" asChild>
                <Link to="/features">See what is inside</Link>
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
              <img src="/marketing/product-3d.png" alt="Live Sacred 3D View generated from a floor plan" width={1280} height={800} decoding="async" />
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
              <img src="/marketing/product-2d.png" alt="2D blueprint editor with a sample floor plan" width={1280} height={800} decoding="async" />
              <figcaption>2D Blueprint</figcaption>
            </figure>
            <span className="vish-hero-showcase__flow">2D&nbsp;→&nbsp;3D&nbsp;live</span>
          </div>
        </div>
      </section>

      <MarketingSection
        className="vish-fade-rise vish-landing-clarity-section"
        title="A studio, not a toolbar"
        description="The VIP layout’s best idea was clarity: one visual path from drawing to 3D to governance to delivery. Vish keeps the deeper feature set, but presents it cleaner."
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
        title="Nothing ships unless it is specified, gated, and provable"
        description="This section borrows the VIP governance strip layout and maps it to Vish’s real proof model: specs, registry, audit, editor rendering, export evidence, and release gates."
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
            <ul className="mt-5 space-y-3 font-mono text-xs text-ws-text-dim">
              {GOVERNANCE_GATES.map((gate) => (
                <li key={gate} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                  <span>{gate}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection
        className="vish-fade-rise"
        title="Better rooms for the product journey"
        description="The VIP build separated the product into cleaner rooms. Vish now mirrors that idea: draft, review, govern, deliver."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ROOMS.map((room) => (
            <Link key={room.title} to={room.to} className="vish-frame-bezel group flex min-h-[230px] flex-col rounded-2xl border border-primary/20 p-5 transition-transform hover:-translate-y-0.5 hover:border-primary/40 md:p-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{room.eyebrow}</span>
              <h3 className="mt-4 text-xl font-semibold vish-text-heading">{room.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed vish-text-body">{room.body}</p>
              <strong className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary">
                Open room <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </strong>
            </Link>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        className="vish-fade-rise"
        title="See the same project from every angle"
        description="One floor plan powers 2D drafting, live 3D review, and every export package. The page stacks cleanly from desktop to iPad to phone."
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
        body="Open the Lite Editor for a guaranteed working 2D/3D path, then move into the full studio for governance, export, and professional delivery."
      />
    </>
  );
}
