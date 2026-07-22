import { cn } from '@/lib/utils';

interface GovernanceStatPillProps {
  label: string;
  value: string | number;
  valueClassName?: string;
  className?: string;
}

export function GovernanceStatPill({
  label,
  value,
  valueClassName = 'text-foreground',
  className,
}: GovernanceStatPillProps) {
  return (
    <div
      className={cn(
        'flex items-baseline gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 shadow-sm',
        className
      )}
    >
      <span className={cn('text-base font-bold tabular-nums', valueClassName)}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
