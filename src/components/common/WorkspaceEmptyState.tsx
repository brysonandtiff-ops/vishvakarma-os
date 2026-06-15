import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface WorkspaceEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function WorkspaceEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: WorkspaceEmptyStateProps) {
  return (
    <div
      className={cn(
        'vish-crafted-card flex flex-col items-center rounded-2xl border border-dashed border-primary/25 bg-card/40 px-6 py-10 text-center',
        className,
      )}
    >
      {icon && <div className="text-primary/60">{icon}</div>}
      <p className={cn('font-semibold text-foreground', icon && 'mt-4')}>{title}</p>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function WorkspaceEmptyStateAction({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button className="touch-target" {...props}>
      {children}
    </Button>
  );
}
