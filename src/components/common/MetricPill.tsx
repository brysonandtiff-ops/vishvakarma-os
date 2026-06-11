interface MetricPillProps {
  value: string;
  label: string;
  className?: string;
}

export default function MetricPill({ value, label, className = '' }: MetricPillProps) {
  return (
    <div className={`vish-stat-pill min-w-[7rem] flex-1 text-center ${className}`}>
      <p className="text-xl font-bold text-primary md:text-2xl">{value}</p>
      <p className="mt-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground/88">
        {label}
      </p>
    </div>
  );
}
