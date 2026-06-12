import type { ReactNode } from 'react';

interface PageSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function PageSection({ title, description, children, className = '' }: PageSectionProps) {
  return (
    <section className={`vish-page-section py-16 md:py-20 ${className}`}>
      {(title || description) && (
        <div className="vish-page-section-intro mb-10 max-w-3xl">
          {title && (
            <h2 className="vish-page-section-title text-2xl font-semibold tracking-tight md:text-3xl vish-text-heading">
              {title}
            </h2>
          )}
          {description && (
            <p className="vish-page-section-description mt-3 text-sm leading-relaxed md:text-base vish-text-body">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
