import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageStateBlockProps {
  variant: 'loading' | 'error' | 'empty';
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function PageStateBlock({
  variant,
  title,
  description,
  onRetry,
  retryLabel = 'Retry',
  icon,
  action,
  className,
}: PageStateBlockProps) {
  if (variant === 'loading') {
    return (
      <div
        className={cn('vish-skeleton-stack flex flex-col gap-3 py-8', className)}
        role="status"
        aria-live="polite"
        data-testid="page-state-loading"
      >
        <div className="vish-skeleton mx-auto h-8 w-8 rounded-full" aria-hidden="true" />
        <div className="vish-skeleton mx-auto h-3 w-32 rounded-md" aria-hidden="true" />
        <div className="vish-skeleton mx-auto h-3 w-48 rounded-md" aria-hidden="true" />
        <p className="sr-only">{title ?? 'Loading…'}</p>
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div
        className={cn(
          'rounded-card-lg border border-destructive/30 bg-destructive/10 p-card-md text-center',
          className,
        )}
        role="alert"
      >
        <p className="font-semibold text-destructive">{title ?? 'Something went wrong'}</p>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        {onRetry && (
          <Button variant="outline" className="mt-4 touch-target" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'vish-empty-state rounded-card-lg border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center',
        className,
      )}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      {title && <p className="font-semibold text-foreground">{title}</p>}
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
