import { backendStatus } from '@/backend/backendConfig';
import { resolveExportTier, type PlanTier } from '@/config/billingPlans';
import { useAuth } from '@/contexts/AuthContext';
import { useBilling } from '@/hooks/useBilling';

export function usePlanTier(): PlanTier {
  const { user } = useAuth();
  const { billing } = useBilling();

  return resolveExportTier({
    isConfigured: backendStatus.isConfigured,
    isSignedIn: Boolean(user),
    email: user?.email,
    billingPlan: billing?.plan,
    billingStatus: billing?.status,
  });
}
