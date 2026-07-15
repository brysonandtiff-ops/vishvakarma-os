import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '@/contexts/authContextTypes';
import { Button } from '@/components/ui/button';
import { getMarketingCta, type MarketingCtaLink } from '@/lib/marketingCta';

interface MarketingCtaSectionProps {
  eyebrow?: string;
  title?: ReactNode;
  body: string;
  user: AuthUser | null;
  secondaryLink?: MarketingCtaLink | null;
}

export function MarketingCtaSection({
  eyebrow = 'Ready to start',
  title,
  body,
  user,
  secondaryLink,
}: MarketingCtaSectionProps) {
  const cta = getMarketingCta(user);
  const secondary = secondaryLink === undefined ? cta.secondary : secondaryLink;

  return (
    <section className="vish-marketing-cta-section vish-marketing-section vish-marketing-section--bordered vish-fade-rise py-16">
      <div className="relative z-[1] mx-auto max-w-prose-content text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        {title ? (
          <h2 className="mt-4 text-2xl font-semibold vish-text-heading md:text-3xl">{title}</h2>
        ) : null}
        <p className={`${title ? 'mt-3' : 'mt-4'} text-lg vish-text-heading`}>{body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button variant="gold" size="gold" className="touch-target" asChild>
            <Link to={cta.to}>{cta.primary}</Link>
          </Button>
          {secondary && (
            <Button variant="goldOutline" size="gold" className="touch-target" asChild>
              <Link to={secondary.to}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
