import { AlertTriangle, CheckCircle2, Info, Loader2, type LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';

type AuthStatusVariant = 'error' | 'warning' | 'success' | 'info';

interface AuthStatusBannerProps {
  variant: AuthStatusVariant;
  title?: string;
  children: ReactNode;
  role?: 'alert' | 'status';
  icon?: LucideIcon;
  className?: string;
  loading?: boolean;
  'data-testid'?: string;
}

const DEFAULT_ICONS: Record<AuthStatusVariant, LucideIcon> = {
  error: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

export default function AuthStatusBanner({
  variant,
  title,
  children,
  role = 'status',
  icon,
  className = '',
  loading = false,
  'data-testid': testId,
}: AuthStatusBannerProps) {
  const titleId = useId();
  const Icon = loading ? Loader2 : (icon ?? DEFAULT_ICONS[variant]);
  const ariaLive = role === 'alert' ? 'assertive' : 'polite';

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      aria-labelledby={title ? titleId : undefined}
      data-testid={testId}
      data-variant={variant}
      className={`vish-auth-status vish-auth-status--${variant} ${className}`.trim()}
    >
      <span className="vish-auth-status__accent" aria-hidden="true" />
      <Icon
        className={`vish-auth-status__icon ${loading ? 'vish-auth-status__icon--spin' : ''}`.trim()}
        aria-hidden="true"
      />
      <div className="vish-auth-status__content">
        {title && (
          <p id={titleId} className="vish-auth-status__title">
            {title}
          </p>
        )}
        <div className={`vish-auth-status__body ${title ? 'vish-auth-status__body--titled' : ''}`.trim()}>
          {children}
        </div>
      </div>
    </div>
  );
}
