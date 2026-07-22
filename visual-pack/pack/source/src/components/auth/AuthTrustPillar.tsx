import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useId } from 'react';

interface AuthTrustPillarProps {
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  testId: string;
  onLearnMore: () => void;
  metric?: string;
  metricLabel?: string;
  destination?: string;
  actionLabel?: string;
  variant?: 'gates' | 'records';
  staggerClass?: string;
}

export default function AuthTrustPillar({
  icon: Icon,
  badge,
  title,
  description,
  testId,
  onLearnMore,
  metric,
  metricLabel,
  destination,
  actionLabel = 'Opens after sign-in',
  variant,
  staggerClass = '',
}: AuthTrustPillarProps) {
  const titleId = useId();
  const descriptionId = useId();
  const ariaLabel = destination
    ? `${title}. ${description} ${actionLabel} at ${destination}.`
    : `${title}. ${description} ${actionLabel}.`;

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onLearnMore}
      aria-label={ariaLabel}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={`vish-auth-feature-card vish-fade-rise flex h-full w-full flex-col text-left ${variant ? `vish-auth-feature-card--${variant}` : ''} ${staggerClass}`.trim()}
    >
      <span className="vish-auth-feature-card__ambient" aria-hidden="true" />
      <span className="vish-auth-feature-card__corner vish-auth-feature-card__corner--tl" aria-hidden="true" />
      <span className="vish-auth-feature-card__corner vish-auth-feature-card__corner--br" aria-hidden="true" />
      <div className="vish-auth-feature-card__header">
        <span className="vish-auth-feature-card__icon" aria-hidden="true">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="vish-auth-feature-card__header-meta">
          {metric && (
            <span className="vish-auth-feature-card__metric" aria-hidden="true">
              <span className="vish-auth-feature-card__metric-value">{metric}</span>
              {metricLabel && (
                <span className="vish-auth-feature-card__metric-label">{metricLabel}</span>
              )}
            </span>
          )}
          <span className="vish-gold-pill">{badge}</span>
        </div>
      </div>
      <p id={titleId} className="vish-auth-feature-card__title">
        {title}
      </p>
      <p id={descriptionId} className="vish-auth-feature-card__description">
        {description}
      </p>
      {destination && (
        <div className="vish-auth-feature-card__footer">
          <span className="vish-auth-feature-card__footer-label">{actionLabel}</span>
          <span className="vish-auth-feature-card__footer-destination">{destination}</span>
          <ChevronRight className="vish-auth-feature-card__footer-chevron" aria-hidden="true" />
        </div>
      )}
    </button>
  );
}
