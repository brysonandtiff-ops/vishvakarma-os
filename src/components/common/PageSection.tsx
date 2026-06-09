import type { ReactNode } from 'react';

interface PageSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function PageSection({ title, description, children, className = '' }: PageSectionProps) {
  return (
    <section className={`py-12 md:py-16 ${className}`}>
      {(title || description) && (
        <div className="mb-8 max-w-3xl">
          {title && <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h2>}
          {description && <p className="mt-2 text-sm leading-relaxed text-foreground/75 md:text-base">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
