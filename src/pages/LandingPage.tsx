import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import { useAuth } from '@/contexts/AuthContext';

const STATS = [
  { value: '2D+3D', label: 'Sacred 3D View' },
  { value: '4', label: 'Export Formats' },
  { value: '50', label: 'Undo Steps' },
  { value: 'iPad', label: 'Touch-First Studio' },
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
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 md:px-8 md:pt-20">
        <p className="vish-marketing-section-label vish-devanagari-accent mb-4">ॐ श्री विश्वकर्मणे नमः</p>
        <h1 className="vish-marketing-hero-title max-w-4xl text-stone-50">
          iPad-native architecture studio.
          <br />
          <span className="vish-hero-gold">Sacred 3D View.</span>
          <br />
          Export Package ready.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-400 md:text-lg">
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
            <div key={stat.label} className="vish-stat-pill text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-stone-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t border-primary/15 px-4 py-16 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-primary" aria-hidden="true">
            ★★★★★
          </p>
          <p className="mt-4 text-lg italic text-stone-300">
            &ldquo;A premium drafting studio built for architects who draw on iPad.&rdquo;
          </p>
          <Link to={startTo} className="vish-gold-cta mt-8">
            Create Your First Floor Plan →
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
