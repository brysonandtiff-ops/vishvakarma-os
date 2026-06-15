import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { BillingPlan } from '@/config/billingPlans';
import { cn } from '@/lib/utils';

export type BillingActionType = 'link' | 'checkout' | 'portal';

export interface BillingPlanCardProps {
  plan: BillingPlan;
  cta: string;
  action: BillingActionType;
  to?: string;
  checkoutPlan?: 'studio' | 'enterprise' | null;
  loading?: boolean;
  disabled?: boolean;
  onCheckout?: (plan: 'studio' | 'enterprise') => void;
  onPortal?: () => void;
  staggerClass?: string;
  variant?: 'marketing' | 'profile';
}

export function BillingPlanCard({
  plan,
  cta,
  action,
  to = '/auth',
  checkoutPlan,
  loading = false,
  disabled = false,
  onCheckout,
  onPortal,
  staggerClass,
  variant = 'marketing',
}: BillingPlanCardProps) {
  const isMarketing = variant === 'marketing';

  return (
    <article
      className={cn(
        isMarketing && 'vish-pricing-card vish-fade-rise relative flex flex-col',
        isMarketing && plan.popular && 'vish-pricing-popular',
        staggerClass,
        !isMarketing && 'flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm',
        !isMarketing && plan.popular && 'border-primary/40 ring-1 ring-primary/20'
      )}
    >
      {plan.popular && isMarketing && (
        <span className="vish-pricing-badge absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </span>
      )}
      {plan.popular && !isMarketing && (
        <span className="vish-eyebrow mb-2 text-primary">Most popular</span>
      )}

      <div className={isMarketing ? 'vish-pricing-card__header' : undefined}>
        {isMarketing && <p className="vish-marketing-section-label">{plan.tier}</p>}
        <h2 className={cn('font-bold', isMarketing ? 'mt-2 text-2xl vish-text-heading' : 'text-lg text-foreground')}>
          {plan.name}
        </h2>
        <p className={cn('mt-3', isMarketing ? 'vish-pricing-card__price' : 'text-xl font-semibold text-foreground')}>
          {plan.priceLabel}
          {plan.amountCents > 0 && (
            <span className={isMarketing ? 'vish-pricing-card__period' : 'text-sm font-normal text-muted-foreground'}>
              {' '}/ month
            </span>
          )}
        </p>
        <p className={cn('mt-3 text-sm leading-relaxed', isMarketing ? 'vish-text-body' : 'text-muted-foreground')}>
          {plan.desc}
        </p>
      </div>

      <BillingActions
        className="touch-target mt-6 min-h-[44px]"
        cta={cta}
        action={action}
        to={to}
        checkoutPlan={checkoutPlan}
        loading={loading}
        disabled={disabled}
        onCheckout={onCheckout}
        onPortal={onPortal}
        variant={variant}
      />

      <ul className={cn(
        'mt-6 flex-1 space-y-3 text-sm',
        isMarketing ? 'vish-pricing-card__features vish-text-body' : 'text-muted-foreground'
      )}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
              isMarketing ? 'vish-pricing-check' : 'bg-primary/10 text-primary'
            )}>
              <Check className="h-3 w-3" aria-hidden />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

interface BillingActionsProps {
  cta: string;
  action: BillingActionType;
  to?: string;
  checkoutPlan?: 'studio' | 'enterprise' | null;
  loading?: boolean;
  disabled?: boolean;
  onCheckout?: (plan: 'studio' | 'enterprise') => void;
  onPortal?: () => void;
  variant?: 'marketing' | 'profile';
  className?: string;
}

export function BillingActions({
  cta,
  action,
  to = '/auth',
  checkoutPlan,
  loading = false,
  disabled = false,
  onCheckout,
  onPortal,
  variant = 'marketing',
  className,
}: BillingActionsProps) {
  const useGold = variant === 'marketing';

  if (action === 'checkout' && checkoutPlan) {
    return (
      <Button
        type="button"
        variant={useGold ? 'gold' : 'default'}
        size="full"
        className={className}
        disabled={disabled || loading}
        onClick={() => onCheckout?.(checkoutPlan)}
      >
        {cta}
      </Button>
    );
  }

  if (action === 'portal') {
    return (
      <Button
        type="button"
        variant={useGold ? 'gold' : 'outline'}
        size="full"
        className={className}
        disabled={disabled || loading}
        onClick={() => onPortal?.()}
      >
        {cta}
      </Button>
    );
  }

  if (useGold) {
    return (
      <Button variant="gold" size="full" className={className} asChild>
        <Link to={to}>{cta}</Link>
      </Button>
    );
  }

  return (
    <Button variant="default" size="full" className={className} asChild>
      <Link to={to}>{cta}</Link>
    </Button>
  );
}
