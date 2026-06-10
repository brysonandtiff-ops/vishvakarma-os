import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { PRICING_TIERS, STUDIO_TRIAL_LABEL } from '@/config/billingPlans';
import { STRIPE_BILLING_ENABLED } from '@/config/billingFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { useBilling } from '@/hooks/useBilling';
import type { CheckoutPlan } from '@/services/billing/stripeCheckout';
import { openBillingPortal, startCheckout } from '@/services/billing/stripeCheckout';

type TierAction = 'link' | 'checkout' | 'portal';

export default function PricingPage() {
  const { user } = useAuth();
  const { isEnterprise, isStudio, idToken, enabled: billingEnabled } = useBilling();
  const [checkoutLoading, setCheckoutLoading] = useState<CheckoutPlan | null>(null);
  const workspaceTo = user ? '/editor' : '/auth';
  const stripeEnabled = STRIPE_BILLING_ENABLED && billingEnabled;

  const handleCheckout = async (plan: CheckoutPlan) => {
    if (!idToken) return;
    setCheckoutLoading(plan);
    try {
      await startCheckout(idToken, plan);
    } catch (error) {
      console.error(`[Vishvakarma.OS] ${plan} checkout failed:`, error);
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!idToken) return;
    setCheckoutLoading('studio');
    try {
      await openBillingPortal(idToken);
    } catch (error) {
      console.error('[Vishvakarma.OS] Billing portal failed:', error);
      setCheckoutLoading(null);
    }
  };

  const paidTierCta = useMemo(
    () =>
      (plan: CheckoutPlan, checkoutLabel: string, authPlan: CheckoutPlan) => {
        if (!stripeEnabled) {
          return {
            label: user ? 'Open Editor →' : checkoutLabel,
            action: 'link' as TierAction,
            to: user ? '/editor' : `/auth?plan=${authPlan}`,
            checkoutPlan: null as CheckoutPlan | null,
          };
        }
        if (!user) {
          return {
            label: checkoutLabel,
            action: 'link' as TierAction,
            to: `/auth?plan=${authPlan}`,
            checkoutPlan: null as CheckoutPlan | null,
          };
        }
        if (plan === 'studio' && isStudio) {
          return {
            label: 'Manage subscription →',
            action: 'portal' as TierAction,
            to: workspaceTo,
            checkoutPlan: null as CheckoutPlan | null,
          };
        }
        return {
          label: checkoutLoading === plan ? 'Redirecting…' : checkoutLabel,
          action: 'checkout' as TierAction,
          to: workspaceTo,
          checkoutPlan: plan,
        };
      },
    [checkoutLoading, isStudio, stripeEnabled, user, workspaceTo]
  );

  const studioCta = paidTierCta('studio', `Start ${STUDIO_TRIAL_LABEL} →`, 'studio');
  const enterpriseCta = paidTierCta('enterprise', 'Subscribe to Enterprise →', 'enterprise');

  const tiers = useMemo(
    () =>
      PRICING_TIERS.map((plan) => {
        if (plan.tier === 'starter') {
          return {
            ...plan,
            cta: user ? 'Open Editor →' : 'Start Free →',
            to: workspaceTo,
            action: 'link' as TierAction,
            checkoutPlan: null as CheckoutPlan | null,
            external: false,
          };
        }
        if (plan.tier === 'studio') {
          return {
            ...plan,
            cta: studioCta.label,
            to: studioCta.to,
            action: studioCta.action,
            checkoutPlan: studioCta.checkoutPlan,
            external: false,
          };
        }
        return {
          ...plan,
          cta: isEnterprise ? 'Manage subscription →' : enterpriseCta.label,
          to: isEnterprise ? workspaceTo : enterpriseCta.to,
          action: isEnterprise ? ('portal' as TierAction) : enterpriseCta.action,
          checkoutPlan: isEnterprise ? null : enterpriseCta.checkoutPlan,
          external: false,
        };
      }),
    [enterpriseCta, isEnterprise, studioCta, user, workspaceTo]
  );

  const FAQ = [
    { q: 'Can I use Vishvakarma.OS without Firebase?', a: 'Yes. Local Draft mode stores projects in your browser with full editor access.' },
    { q: 'Which export formats are included?', a: 'JSON, PNG, PDF, DXF, SVG — all generated from the same floor plan manifest.' },
    { q: 'Is there an iPad app?', a: 'The web app is iPad-first. Capacitor native wrapper is planned for v2.' },
  ] as const;

  return (
    <MarketingLayout>
      <PageMeta title="Pricing" description="Professional-grade tools. Fair, predictable pricing." />
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <MarketingPageHeader
          label="Pricing"
          title={
            <>
              Professional-grade tools.
              <br />
              Fair, predictable pricing.
            </>
          }
          description="Start free. Upgrade when your practice demands it. Cancel anytime."
        />

        <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span className="rounded-full border border-primary/25 px-3 py-1">Firebase Cloud Save</span>
          <span className="rounded-full border border-primary/25 px-3 py-1">13 release gates</span>
          <span className="rounded-full border border-primary/25 px-3 py-1">Governance OS</span>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.tier}
              className={`vish-pricing-card relative ${tier.popular ? 'vish-pricing-popular' : ''}`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold vish-text-heading">{tier.name}</h2>
              <p className="mt-2 text-2xl font-bold text-primary">{tier.priceLabel}</p>
              <p className="mt-3 text-sm vish-text-body">{tier.desc}</p>
              {tier.action === 'checkout' && tier.checkoutPlan ? (
                <button
                  type="button"
                  className="vish-gold-cta mt-6 w-full"
                  disabled={checkoutLoading !== null}
                  onClick={() => void handleCheckout(tier.checkoutPlan!)}
                >
                  {tier.cta}
                </button>
              ) : tier.action === 'portal' ? (
                <button
                  type="button"
                  className="vish-gold-cta mt-6 w-full"
                  disabled={checkoutLoading !== null}
                  onClick={() => void handleManageSubscription()}
                >
                  {tier.cta}
                </button>
              ) : (
                <Link to={tier.to} className="vish-gold-cta mt-6 w-full">
                  {tier.cta}
                </Link>
              )}
              <ul className="mt-6 space-y-2 text-sm vish-text-body">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-primary">✓</span>
                    {feature}
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
