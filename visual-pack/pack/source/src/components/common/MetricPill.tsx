import { cn } from '@/lib/utils';

const STAGGER_CLASSES = ['vish-stagger-1', 'vish-stagger-2', 'vish-stagger-3', 'vish-stagger-4'] as const;

interface MetricPillProps {
  value: string;
  label: string;
  className?: string;
  /** Staggered fade-rise entrance (marketing pages) */
  animate?: boolean;
  staggerIndex?: number;
}

export default function MetricPill({
  value,
  label,
  className = '',
  animate = false,
  staggerIndex = 0,
}: MetricPillProps) {
  const staggerClass =
    animate && staggerIndex >= 0 ? STAGGER_CLASSES[Math.min(staggerIndex, STAGGER_CLASSES.length - 1)] : '';

  return (
    <div
      className={cn(
        'vish-stat-pill min-w-[7rem] flex-1 text-center vish-metric-pill-hover',
        animate && 'vish-fade-rise vish-stat-pill--interactive',
        staggerClass,
        className
      )}
    >
      <p className="text-xl font-bold text-primary md:text-2xl">{value}</p>
      <p className="mt-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground/88">
        {label}
      </p>
    </div>
  );
}
