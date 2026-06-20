import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, LogOut, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';
import PageMeta from '@/components/common/PageMeta';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import StatPill from '@/components/common/StatPill';
import WorkspacePanel from '@/components/common/WorkspacePanel';
import { Button } from '@/components/ui/button';
import { backendStatus } from '@/backend/backendConfig';
import { STRIPE_BILLING_ENABLED } from '@/config/billingFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { useBilling } from '@/hooks/useBilling';
import { billingPlanLabel } from '@/types/billing';
import type { CheckoutPlan } from '@/services/billing/stripeCheckout';
import BillingBanner from '@/components/billing/BillingBanner';
import StudioAudioSettings from '@/components/profile/StudioAudioSettings';
import { openBillingPortal, startCheckout } from '@/services/billing/stripeCheckout';

export default function ProfilePage() {
  const { user, profile, mode, signOut, isConfigured } = useAuth();
  const {
    billing,
    isPaid,
    isEnterprise,
    isStudio,
    idToken,
    enabled: billingEnabled,
    refreshBilling,
    loading: billingLoading,
    error: billingError,
  } = useBilling();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [billingActionLoading, setBillingActionLoading] = useState<CheckoutPlan | 'portal' | null>(null);
  const stripeEnabled = STRIPE_BILLING_ENABLED && billingEnabled;

  const providerLabel = 'Supabase';
  const saveLabel = backendStatus.isConfigured ? 'Supabase Cloud Save' : 'Local Draft';
  const planLabel = billingPlanLabel(billing);

  useEffect(() => {
    if (searchParams.get('checkout') !== 'success') return;
    toast.success('Subscription updated', {
      description: 'Your billing status will refresh in a moment.',
    });
    void refreshBilling();
    setSearchParams({}, { replace: true });
  }, [refreshBilling, searchParams, setSearchParams]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleCheckout = async (plan: CheckoutPlan) => {
    if (!idToken) return;
    setBillingActionLoading(plan);
    try {
      await startCheckout(idToken, plan);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed');
      setBillingActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!idToken) return;
    setBillingActionLoading('portal');
    try {
      await openBillingPortal(idToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Billing portal failed');
      setBillingActionLoading(null);
    }
  };

  return (
    <>
      <PageMeta title="Profile" description="Your Vishvakarma.OS account and workspace mode." />
      <div className="vish-profile-layout vish-section-stack">
        <WorkspacePageHeader
          zone="document"
          eyebrow="Account"
          title="Profile"
          description="Workspace session, backend mode, and sign-out controls."
          stats={
            <StatPill>
              {saveLabel} · session {mode}
              {stripeEnabled && !billingLoading ? ` · ${planLabel}` : ''}
            </StatPill>
          }
        />

        {stripeEnabled && user && (
          <WorkspacePanel title="Billing" tone="light">
            <BillingBanner billing={billing} loading={billingLoading} error={billingError} />
          </WorkspacePanel>
        )}

        <WorkspacePanel title="Studio audio" description="Workspace sound feedback and ambience.">
          <StudioAudioSettings />
        </WorkspacePanel>

        <WorkspacePanel title="Account details" tone="light" padded>
          <div className="vish-profile-sidebar mb-6 flex items-center gap-4 border-b border-border/60 pb-6">
            <div className="vish-profile-avatar-ring shrink-0">
              <span className="vish-profile-avatar-ring__inner flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
                {(profile?.full_name ?? user?.email ?? 'V').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="vish-profile-name truncate text-base font-semibold text-foreground">
                {profile?.full_name ?? user?.email ?? 'Local workspace'}
              </p>
              {user?.email && (
                <p className="vish-profile-email truncate text-sm text-muted-foreground">{user.email}</p>
              )}
              <span className="vish-profile-tier-badge mt-2 inline-flex">{planLabel}</span>
            </div>
          </div>
          <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="mt-1 text-sm text-foreground">{user?.email ?? 'Local workspace (no sign-in)'}</p>
            </div>
          </div>

          {profile?.full_name && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</p>
              <p className="mt-1 text-sm text-foreground">{profile.full_name}</p>
            </div>
          )}

          {stripeEnabled && user && (
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</p>
                <p className="mt-1 text-sm text-foreground">
                  {billingLoading ? 'Loading billing…' : planLabel}
                </p>
                {billing?.trialEnd && billing.status === 'trialing' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Trial ends {new Date(billing.trialEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Backend</p>
              <p className="mt-1 text-sm text-foreground">
                {providerLabel} · {saveLabel} · session {mode}
              </p>
              {!isConfigured && backendStatus.missingKeys.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Missing: {backendStatus.missingKeys.join(', ')}
                </p>
              )}
            </div>
          </div>
          </div>
        </WorkspacePanel>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild className="touch-target">
            <Link to="/projects">View projects</Link>
          </Button>
          {stripeEnabled && user && !isPaid && (
            <>
              <Button
                variant="gold"
                className="touch-target"
                disabled={billingActionLoading !== null || billingLoading}
                onClick={() => void handleCheckout('studio')}
              >
                {billingActionLoading === 'studio' ? 'Redirecting…' : 'Upgrade to Studio'}
              </Button>
              <Button
                variant="goldOutline"
                className="touch-target"
                disabled={billingActionLoading !== null || billingLoading}
                onClick={() => void handleCheckout('enterprise')}
              >
                {billingActionLoading === 'enterprise' ? 'Redirecting…' : 'Upgrade to Enterprise'}
              </Button>
            </>
          )}
          {stripeEnabled && user && isStudio && !isEnterprise && (
            <Button
              variant="outline"
              className="touch-target"
              disabled={billingActionLoading !== null || billingLoading}
              onClick={() => void handleCheckout('enterprise')}
            >
              {billingActionLoading === 'enterprise' ? 'Redirecting…' : 'Upgrade to Enterprise'}
            </Button>
          )}
          {stripeEnabled && user && isPaid && (
            <Button
              variant="outline"
              className="touch-target"
              disabled={billingActionLoading !== null || billingLoading}
              onClick={() => void handleManageBilling()}
            >
              {billingActionLoading === 'portal' ? 'Redirecting…' : 'Manage billing'}
            </Button>
          )}
          <Button variant="destructive" onClick={() => void handleSignOut()} className="touch-target gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </>
  );
}
