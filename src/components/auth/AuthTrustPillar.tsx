import type { LucideIcon } from 'lucide-react';

interface AuthTrustPillarProps {
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  testId: string;
  onLearnMore: () => void;
}

export default function AuthTrustPillar({
  icon: Icon,
  badge,
  title,
  description,
  testId,
  onLearnMore,
}: AuthTrustPillarProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onLearnMore}
      className="vish-auth-feature-card w-full text-left"
    >
      <div className="vish-auth-feature-card__header">
        <span className="vish-auth-feature-card__icon" aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
        <span className="vish-gold-pill">{badge}</span>
      </div>
      <p className="vish-auth-feature-card__title">{title}</p>
      <p className="vish-auth-feature-card__description">{description}</p>
    </button>
  );
}
