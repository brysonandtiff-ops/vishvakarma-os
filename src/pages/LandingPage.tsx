import { Link } from 'react-router-dom';
import { Box, FileOutput, Layers, Shield } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import MetricPill from '@/components/common/MetricPill';
import PageSection from '@/components/common/PageSection';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import { useAuth } from '@/contexts/AuthContext';

const STATS = [
  { value: '2D+3D', label: 'Live sync' },
  { value: '5', label: 'Export formats' },
  { value: '13', label: 'Release gates' },
  { value: 'iPad', label: 'Touch-first' },
] as const;

const PROOF = [
  { icon: Shield, title: 'Governance OS', desc: 'Specs, registry, change requests, and audit trail built in.' },
  { icon: FileOutput, title: 'Export Package', desc: 'JSON, PNG, PDF, DXF, and SVG from one floor plan source.' },
  { icon: Box, title: 'Sacred 3D View', desc: 'Walls and openings extrude live as you draft on the blueprint canvas.' },
  { icon: Layers, title: 'Multi-floor ready', desc: 'Floor switcher and per-level geometry scaffold for v2 stacking.' },
] as const;

export default function LandingPage() {
  const { user } = useAuth();
  const startTo = user ? '/editor' : '/auth';

  return (
    <MarketingLayout>
      <PageMeta
        title="Vishvakarma.OS — iPad-Native Architecture Studio"
        description="Draw floor plans, inspect Sacred 3D View, export your Project Proof. Premium architecture studio in your browser."
      />
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12 md:px-8 md:pt-20">
        <p className="vish-marketing-section-label vish-devanagari-accent mb-4">ॐ श्री विश्वकर्मणे नमः</p>
        <h1 className="vish-marketing-hero-title max-w-4xl vish-text-heading">
          iPad-native architecture studio.
          <br />
          <span className="vish-hero-gold">Sacred 3D View.</span>
          <br />
          Export Package ready.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed vish-text-body md:text-lg">
          Vishvakarma.OS combines 2D blueprint drafting, live Sacred 3D View, Vastu Harmony overlays,
          and professional Export Package delivery — Cloud Save when configured, Local Draft always available.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to={startTo} className="vish-gold-cta">
            Start Free — Protected Workspace →
          </Link>
          <Link to="/features" className="vish-gold-cta-outline">
            ▷ See All Features
          </Link>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <MetricPill key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </section>

      <PageSection className="mx-auto max-w-6xl border-t border-primary/15 px-4 md:px-8" title="Blueprint to chamber" description="One manifest powers 2D drafting, 3D preview, and every export format.">
        <div className="grid gap-6 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-primary/20 bg-card/40 shadow-lg">
            <img src="/marketing/product-2d.png" alt="2D blueprint editor with sample floor plan" className="h-auto w-full object-cover" loading="lazy" />
            <figcaption className="border-t border-border/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/80">
              2D Blueprint Canvas
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-2xl border border-primary/20 bg-card/40 shadow-lg">
            <img src="/marketing/product-3d.png" alt="Live 3D model chamber with extruded walls" className="h-auto w-full object-cover" loading="lazy" />
            <figcaption className="border-t border-border/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/80">
              Sacred 3D View
            </figcaption>
          </figure>
        </div>
      </PageSection>

      <PageSection className="mx-auto max-w-6xl px-4 md:px-8" title="Built for professional proof" description="Not just a drawing toy — a governed architectural workstation.">
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Product proof</p>
          <p className="mt-4 text-lg vish-text-heading">
            &ldquo;A premium drafting studio built for architects who draw on iPad.&rdquo;
          </p>
          <p className="mt-2 text-sm vish-text-body">— Vishvakarma.OS design team · 13-gate release pipeline</p>
          <Link to={startTo} className="vish-gold-cta mt-8">
            Create Your First Floor Plan →
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
