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
      'Export Package (JSON, PNG, PDF, DXF)',
      'Cloud Save (Firebase or Supabase)',
      'Project Proof governance',
      'Vastu Harmony (preview)',
    ],
  },
  {
    name: 'Enterprise',
    price: '$249/month',
    desc: 'For firms needing SSO, API access, and unlimited seats',
    cta: 'Contact Sales →',
    to: '/auth',
    popular: false,
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

export default function PricingPage() {
  return (
    <MarketingLayout>
      <PageMeta title="Pricing" description="Professional-grade tools. Fair, predictable pricing." />
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold text-stone-50 md:text-4xl">
          Professional-grade tools.
          <br />
          Fair, predictable pricing.
        </h1>
        <p className="mt-4 text-stone-400">
          Start free. Upgrade when your practice demands it. Cancel anytime.
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <article
              key={tier.name}
              className={`vish-pricing-card relative ${tier.popular ? 'vish-pricing-popular' : ''}`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-stone-900">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold text-stone-100">{tier.name}</h2>
              <p className="mt-2 text-2xl font-bold text-primary">{tier.price}</p>
              <p className="mt-3 text-sm text-stone-400">{tier.desc}</p>
              <Link to={tier.to} className="vish-gold-cta mt-6 w-full">
                {tier.cta}
              </Link>
              <ul className="mt-6 space-y-2 text-sm text-stone-400">
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
      </section>
    </MarketingLayout>
  );
}
