import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';

const TIERS = [
  {
    name: 'Starter',
    price: 'Free forever',
    desc: 'For homeowners and students exploring their first floor plan',
    cta: 'Start Free →',
    to: '/auth',
    popular: false,
    features: [
      '1 active project',
      '2D drafting tools',
      'Sacred 3D View (Standard mode)',
      'PNG export',
      'Local Draft recovery',
    ],
  },
  {
    name: 'Studio',
    price: '$99/month',
    desc: 'For professional practices shipping client-ready deliverables',
    cta: 'Start 14-Day Free Trial →',
    to: '/auth',
    popular: true,
    features: [
      'Unlimited projects',
      'Full 2D + Sacred 3D View',
      'Export Package (JSON, PNG, PDF, DXF, SVG)',
      'Cloud Save (Firebase)',
      'Project Proof governance',
      'Vastu Harmony (preview)',
    ],
  },
  {
    name: 'Enterprise',
    price: '$249/month',
    desc: 'For firms needing SSO, API access, and unlimited seats',
    cta: 'Contact Sales →',
    to: 'mailto:sales@vishvakarma.os?subject=Enterprise%20inquiry',
    popular: false,
    external: true,
    features: [
      'Everything in Studio',
      'SSO / SAML authentication',
      'API access',
      'Dedicated onboarding',
      'Custom template library',
      'Collaboration (planned)',
    ],
  },
] as const;

const FAQ = [
  { q: 'Can I use Vishvakarma.OS without Firebase?', a: 'Yes. Local Draft mode stores projects in your browser with full editor access.' },
  { q: 'Which export formats are included?', a: 'JSON, PNG, PDF, DXF, and SVG — all generated from the same floor plan manifest.' },
  { q: 'Is there an iPad app?', a: 'The web app is iPad-first. Capacitor native wrapper is planned for v2.' },
] as const;

export default function PricingPage() {
  return (
    <MarketingLayout>
      <PageMeta title="Pricing" description="Professional-grade tools. Fair, predictable pricing." />
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold vish-text-heading md:text-4xl">
          Professional-grade tools.
          <br />
          Fair, predictable pricing.
        </h1>
        <p className="mt-4 vish-text-body">
          Start free. Upgrade when your practice demands it. Cancel anytime.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span className="rounded-full border border-primary/25 px-3 py-1">Firebase Cloud Save</span>
          <span className="rounded-full border border-primary/25 px-3 py-1">13 release gates</span>
          <span className="rounded-full border border-primary/25 px-3 py-1">Governance OS</span>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <article
              key={tier.name}
              className={`vish-pricing-card relative ${tier.popular ? 'vish-pricing-popular' : ''}`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold vish-text-heading">{tier.name}</h2>
              <p className="mt-2 text-2xl font-bold text-primary">{tier.price}</p>
              <p className="mt-3 text-sm vish-text-body">{tier.desc}</p>
              {'external' in tier && tier.external ? (
                <a href={tier.to} className="vish-gold-cta mt-6 w-full">
                  {tier.cta}
                </a>
              ) : (
                <Link to={tier.to} className="vish-gold-cta mt-6 w-full">
                  {tier.cta}
                </Link>
              )}
              <ul className="mt-6 space-y-2 text-sm vish-text-body">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border/60 bg-card/50 p-6 md:p-8">
          <h2 className="text-lg font-semibold vish-text-heading">Frequently asked</h2>
          <dl className="mt-6 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-semibold text-foreground">{item.q}</dt>
                <dd className="mt-1 text-sm vish-text-body">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </MarketingLayout>
  );
}
