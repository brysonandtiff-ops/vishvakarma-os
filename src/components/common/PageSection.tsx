import type { ReactNode } from 'react';

interface PageSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function PageSection({ title, description, children, className = '' }: PageSectionProps) {
  return (
    <section className={`py-16 md:py-20 ${className}`}>
      {(title || description) && (
        <div className="mb-10 max-w-3xl">
          {title && <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h2>}
          {description && <p className="mt-3 text-sm leading-relaxed text-foreground/85 md:text-base">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
