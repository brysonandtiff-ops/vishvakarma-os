import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import MetricPill from '@/components/common/MetricPill';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { PRICING_TIERS, STUDIO_TRIAL_LABEL } from '@/config/billingPlans';
import { EXPORT_FORMATS_LABEL } from '@/config/marketingFeatures';
import { STRIPE_BILLING_ENABLED } from '@/config/billingFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { useBilling } from '@/hooks/useBilling';
import type { CheckoutPlan } from '@/services/billing/stripeCheckout';
import { openBillingPortal, startCheckout } from '@/services/billing/stripeCheckout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type TierAction = 'link' | 'checkout' | 'portal';

const TRUST_STATS = [
  { value: 'Cloud', label: 'Firebase save' },
  { value: '13', label: 'Release gates' },
  { value: 'OS', label: 'Governance layer' },
] as const;

const STAGGER_CLASSES = ['vish-stagger-1', 'vish-stagger-2', 'vish-stagger-3'] as const;

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
    {
      q: 'Do I need to sign in?',
      a: 'Yes. Sign in with Google to open your protected workspace. Local Draft recovery keeps unsaved work in your browser between sessions.',
    },
    {
      q: 'Which export formats are included?',
      a: `Starter includes PNG export. Studio unlocks the full Export Package (${EXPORT_FORMATS_LABEL}) — all generated from one floor plan manifest.`,
    },
    {
      q: 'Is there an iPad app?',
      a: 'The web app is iPad-first with Apple Pencil support. A native Capacitor wrapper is planned for v2.',
    },
  ] as const;

  return (
    <MarketingLayout>
      <PageMeta title="Pricing" description="Professional-grade tools. Fair, predictable pricing." />
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:px-8 md:pb-20 md:pt-20">
        <MarketingPageHeader
          devanagari="मूल्य नियोजन"
          hero
          title={
            <>
              Professional-grade tools.
              <br />
              <span className="vish-hero-gold">Fair, predictable pricing.</span>
            </>
          }
          description="Start free. Upgrade when your practice demands it. Cancel anytime."
        />

        <div className="vish-pricing-trust-row mt-10 grid gap-4 sm:grid-cols-3">
          {TRUST_STATS.map((stat, index) => (
            <MetricPill key={stat.label} value={stat.value} label={stat.label} animate staggerIndex={index} />
          ))}
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3 lg:gap-5">
          {tiers.map((tier, index) => (
            <article
              key={tier.tier}
              className={`vish-pricing-card vish-fade-rise relative flex flex-col ${STAGGER_CLASSES[index]} ${tier.popular ? 'vish-pricing-popular' : ''}`}
            >
              {tier.popular && (
                <span className="vish-pricing-badge absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </span>
              )}
              <div className="vish-pricing-card__header">
                <p className="vish-marketing-section-label">{tier.tier}</p>
                <h2 className="mt-2 text-2xl font-bold vish-text-heading">{tier.name}</h2>
                <p className="vish-pricing-card__price mt-3">
                  {tier.priceLabel}
                  {tier.amountCents > 0 && (
                    <span className="vish-pricing-card__period"> / month</span>
                  )}
                </p>
                <p className="mt-3 text-sm leading-relaxed vish-text-body">{tier.desc}</p>
              </div>
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
              <ul className="vish-pricing-card__features mt-6 flex-1 space-y-3 text-sm vish-text-body">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="vish-pricing-check mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-20 border-t border-primary/15 pt-16">
          <div className="vish-pricing-faq vish-pricing-card">
            <p className="vish-marketing-section-label">Frequently asked</p>
            <Accordion type="single" collapsible className="mt-6">
              {FAQ.map((item, index) => (
                <AccordionItem
                  key={item.q}
                  value={`faq-${index}`}
                  className="border-primary/20 last:border-b-0"
                >
                  <AccordionTrigger className="py-4 text-sm font-semibold vish-text-heading hover:no-underline hover:text-primary [&[data-state=open]]:text-primary">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed vish-text-body">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
