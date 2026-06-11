import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFirestoreBilling } from '@/backend/firebase/firestoreBillingGateway';
import { backendStatus } from '@/backend/backendConfig';
import { STRIPE_BILLING_ENABLED } from '@/config/billingFeatures';
import { isCoOwnerEmail } from '@/config/coOwners';
import { useAuth } from '@/contexts/AuthContext';
import type { BillingSubscription } from '@/types/billing';
import {
  isEnterpriseSubscription,
  isPaidSubscription,
  isStudioSubscription,
} from '@/types/billing';

function coOwnerBillingRecord(userId: string): BillingSubscription {
  return {
    id: userId,
    plan: 'enterprise',
    status: 'active',
  };
}

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

  const isCoOwner = isCoOwnerEmail(user?.email);
  const effectiveBilling = useMemo(() => {
    if (!user || !isCoOwner) return billing;
    return coOwnerBillingRecord(user.id);
  }, [billing, isCoOwner, user]);

  return {
    billing: effectiveBilling,
    loading,
    error,
    enabled: STRIPE_BILLING_ENABLED,
    plan: effectiveBilling?.plan ?? 'starter',
    status: effectiveBilling?.status ?? 'none',
    isStudio: isStudioSubscription(effectiveBilling),
    isEnterprise: isEnterpriseSubscription(effectiveBilling),
    isPaid: isPaidSubscription(effectiveBilling),
    idToken: session?.idToken ?? null,
    refreshBilling,
  };
}
