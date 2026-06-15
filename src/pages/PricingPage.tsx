import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import MetricPill from '@/components/common/MetricPill';
import { BillingPlanCard, type BillingActionType } from '@/components/billing/BillingPlanCard';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { PRICING_TIERS, STUDIO_TRIAL_LABEL } from '@/config/billingPlans';
import { EXPORT_FORMAT_COUNT, EXPORT_FORMATS_LABEL } from '@/config/marketingFeatures';
import { STRIPE_BILLING_ENABLED } from '@/config/billingFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { useBilling } from '@/hooks/useBilling';
import type { CheckoutPlan } from '@/services/billing/stripeCheckout';
import { openBillingPortal, startCheckout } from '@/services/billing/stripeCheckout';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type TierAction = BillingActionType;

const TRUST_STATS = [
  { value: 'PNG+', label: 'Starter export' },
  { value: String(EXPORT_FORMAT_COUNT), label: 'Studio formats' },
  { value: '14-day', label: 'Studio trial' },
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
      a: 'The web app is iPad-first with Apple Pencil support. A native Capacitor wrapper is planned for a future release.',
    },
  ] as const;

  return (
    <>
      <PageMeta
        title="Pricing — Vishvakarma.OS"
        description="Professional-grade architecture tools with fair, predictable pricing. Start free, upgrade when your practice demands it."
      />
      <section className="vish-marketing-hero vish-stagger-children pb-16 pt-14 md:pb-20 md:pt-20">
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
            <BillingPlanCard
              key={tier.tier}
              plan={tier}
              cta={tier.cta}
              action={tier.action}
              to={tier.to}
              checkoutPlan={tier.checkoutPlan}
              loading={checkoutLoading !== null}
              disabled={checkoutLoading !== null}
              onCheckout={(plan) => void handleCheckout(plan)}
              onPortal={() => void handleManageSubscription()}
              staggerClass={STAGGER_CLASSES[index]}
              variant="marketing"
            />
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
                  <AccordionTrigger className="touch-target min-h-[44px] py-4 text-sm font-semibold vish-text-heading hover:no-underline hover:text-primary [&[data-state=open]]:text-primary">
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

      <section className="border-t border-primary/15 px-4 py-16 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ready to start</p>
          <p className="mt-4 text-lg vish-text-heading">
            Begin on the free Starter tier, or start a Studio trial when you need the full Export Package.
          </p>
          <Button variant="gold" size="gold" className="mt-8 touch-target" asChild>
            <Link to={workspaceTo}>{user ? 'Open Editor →' : 'Start Free →'}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
