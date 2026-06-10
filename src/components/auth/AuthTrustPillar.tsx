import { ChevronRight, type LucideIcon } from 'lucide-react';

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
}: AuthTrustPillarProps) {
  const ariaLabel = destination
    ? `${title}. ${actionLabel} at ${destination}.`
    : `${title}. ${actionLabel}.`;

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onLearnMore}
      aria-label={ariaLabel}
      className="vish-auth-feature-card flex h-full w-full flex-col text-left"
    >
      <div className="vish-auth-feature-card__header">
        <span className="vish-auth-feature-card__icon" aria-hidden="true">
          <Icon className="h-5 w-5" />
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
      <p className="vish-auth-feature-card__title">{title}</p>
      <p className="vish-auth-feature-card__description line-clamp-2">{description}</p>
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
