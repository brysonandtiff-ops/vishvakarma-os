import { Link } from 'react-router-dom';
import { Box, FileOutput, Layers, PenLine, Shield } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import MetricPill from '@/components/common/MetricPill';
import PageSection from '@/components/common/PageSection';
import { Button } from '@/components/ui/button';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import { EXPORT_FORMAT_COUNT } from '@/config/marketingFeatures';
import { useAuth } from '@/contexts/AuthContext';

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
  const startTo = user ? '/editor' : '/auth';

  return (
    <MarketingLayout>
      <PageMeta
        title="Vishvakarma.OS — iPad-First Architecture Studio"
        description="Draw floor plans, inspect Sacred 3D View, and export client-ready packages. A governed architecture workstation in your browser."
      />
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-14 md:px-8 md:pb-16 md:pt-20">
        <p className="vish-devanagari-hero mb-4">ॐ श्री विश्वकर्मणे नमः</p>
        <h1 className="vish-marketing-hero-title max-w-4xl vish-text-heading">
          iPad-first architecture studio.
          <br />
          <span className="vish-hero-gold">Sacred 3D View.</span>
          <br />
          Export-ready deliverables.
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-relaxed vish-text-body md:mt-10 md:text-lg">
          Vishvakarma.OS combines 2D blueprint drafting, live Sacred 3D View, Vastu Harmony overlays,
          NBC India pre-checks, INR cost regions, and professional Export Package delivery — with cloud save and local draft.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button variant="gold" size="gold" asChild>
            <Link to={startTo}>Start Free →</Link>
          </Button>
          <Button variant="goldOutline" size="gold" asChild>
            <Link to="/features">See All Features</Link>
          </Button>
        </div>
        <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <MetricPill key={stat.label} value={stat.value} label={stat.label} animate staggerIndex={index} />
          ))}
        </div>
      </section>

      <PageSection
        className="mx-auto max-w-6xl border-t border-primary/15 px-4 md:px-8"
        title="Blueprint to chamber"
        description="One floor plan powers 2D drafting, live 3D preview, and every export format."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-primary/25 bg-card/60 shadow-lg backdrop-blur-sm">
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
          <figure className="overflow-hidden rounded-2xl border border-primary/25 bg-card/60 shadow-lg backdrop-blur-sm">
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
        </div>
        <ol className="vish-workflow-strip mt-8 grid gap-6 md:grid-cols-3 md:gap-4">
          {WORKFLOW.map((item) => (
            <li key={item.step} className="flex items-start gap-3 md:flex-col md:items-center md:text-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{item.step}</p>
                <p className="mt-1 text-xs leading-relaxed vish-text-body">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection
        className="mx-auto max-w-6xl px-4 md:px-8"
        title="Built for professional delivery"
        description="A governed architectural workstation — specs, exports, and audit trail built in."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {PROOF.map((item) => (
            <div key={item.title} className="vish-feature-grid-card flex gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold vish-text-heading">{item.title}</h3>
                <p className="mt-1 text-sm vish-text-body">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      <section className="border-t border-primary/15 px-4 py-16 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ready to start</p>
          <p className="mt-4 text-lg vish-text-heading">
            Load the sample project, draw your first walls, and export a deliverable package in minutes.
          </p>
          <Button variant="gold" size="gold" className="mt-8" asChild>
            <Link to={startTo}>Create Your First Floor Plan →</Link>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}
