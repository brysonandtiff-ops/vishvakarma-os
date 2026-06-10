import { useCallback, useEffect, useState } from 'react';
import { getFirestoreBilling } from '@/backend/firebase/firestoreBillingGateway';
import { backendStatus } from '@/backend/backendConfig';
import { STRIPE_BILLING_ENABLED } from '@/config/billingFeatures';
import { useAuth } from '@/contexts/AuthContext';
import type { BillingSubscription } from '@/types/billing';
import {
  isEnterpriseSubscription,
  isPaidSubscription,
  isStudioSubscription,
} from '@/types/billing';

export function useBilling() {
  const { user, session } = useAuth();
  const [billing, setBilling] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBilling = useCallback(async () => {
    if (!user || !backendStatus.isConfigured) {
      setBilling(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const record = await getFirestoreBilling(user.id);
      setBilling(record);
    } catch (err) {
      setBilling(null);
      setError(err instanceof Error ? err.message : 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshBilling();
  }, [refreshBilling]);

  return {
    billing,
    loading,
    error,
    enabled: STRIPE_BILLING_ENABLED,
    plan: billing?.plan ?? 'starter',
    status: billing?.status ?? 'none',
    isStudio: isStudioSubscription(billing),
    isEnterprise: isEnterpriseSubscription(billing),
    isPaid: isPaidSubscription(billing),
    idToken: session?.idToken ?? null,
    refreshBilling,
  };
}
