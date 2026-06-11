import AuthStatusBanner from '@/components/auth/AuthStatusBanner';
import { resolveBillingBanner } from '@/components/billing/billingBannerMessage';
import type { BillingSubscription } from '@/types/billing';

interface BillingBannerProps {
  billing: BillingSubscription | null;
  loading: boolean;
  error: string | null;
}

export default function BillingBanner({ billing, loading, error }: BillingBannerProps) {
  const message = resolveBillingBanner({ billing, loading, error });
  if (!message) return null;

  return (
    <AuthStatusBanner
      variant={message.variant}
      title={message.title}
      loading={loading}
      data-testid="profile-billing-banner"
      role={message.variant === 'error' || message.variant === 'warning' ? 'alert' : 'status'}
    >
      {message.body}
    </AuthStatusBanner>
  );
}
