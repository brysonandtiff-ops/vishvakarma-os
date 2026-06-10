import { AlertTriangle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthStatusVariant = 'error' | 'warning' | 'success' | 'info';

interface AuthStatusBannerProps {
  variant: AuthStatusVariant;
  title?: string;
  children: ReactNode;
  role?: 'alert' | 'status';
  icon?: LucideIcon;
  className?: string;
  'data-testid'?: string;
}

const DEFAULT_ICONS: Record<AuthStatusVariant, LucideIcon> = {
  error: AlertTriangle,
  warning: AlertTriangle,
  success: AlertTriangle,
  info: AlertTriangle,
};

export default function AuthStatusBanner({
  variant,
  title,
  children,
  role = 'status',
  icon,
  className = '',
  'data-testid': testId,
}: AuthStatusBannerProps) {
  const Icon = icon ?? DEFAULT_ICONS[variant];

  return (
    <div
      role={role}
      data-testid={testId}
      className={`vish-auth-status vish-auth-status--${variant} mb-4 flex gap-3 p-3 text-sm ${className}`.trim()}
    >
      <Icon className="vish-auth-status__icon mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        {title && <p className="vish-auth-status__title font-semibold">{title}</p>}
        <div className={title ? 'vish-auth-status__body text-muted-foreground' : 'vish-auth-status__body'}>
          {children}
        </div>
      </div>
    </div>
  );
}
