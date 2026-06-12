import type { ReactNode } from 'react';

interface MarketingPageHeaderProps {
  label?: string;
  devanagari?: string;
  title: ReactNode;
  description?: string;
  className?: string;
  hero?: boolean;
}

export function MarketingPageHeader({
  label,
  devanagari,
  title,
  description,
  className = '',
  hero = false,
}: MarketingPageHeaderProps) {
  return (
    <header className={`vish-fade-rise ${className}`.trim()}>
      {devanagari && (
        <p className="vish-devanagari-hero mb-4">{devanagari}</p>
      )}
      {label && !devanagari && (
        <p className="vish-marketing-section-label mb-4">{label}</p>
      )}
      {hero ? (
        <h1 className="vish-marketing-hero-title max-w-4xl vish-text-heading">{title}</h1>
      ) : (
        <h1 className="text-3xl font-bold vish-text-heading md:text-4xl">{title}</h1>
      )}
      {description && (
        <p className={`vish-text-body ${hero ? 'mt-6 max-w-2xl text-base leading-relaxed md:text-lg' : 'mt-3'}`}>
          {description}
        </p>
      )}
    </header>
  );
}
