import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Trophy } from 'lucide-react';
import { WORLD_RECORD_METRIC_GATE_COUNT } from '@/governance/gates/releaseGateManifest';
import { WORLD_RECORD_HONESTY_DISCLAIMER } from '@/governance/records/worldRecordRegistry';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthCapabilities } from '@/hooks/useAuthCapabilities';
import { toast } from 'sonner';
import {
  getAuthPageUrl,
  getEmbeddedAuthBrowserLabel,
  isEmbeddedAuthBrowser,
} from '@/backend/authUiHelpers';
import {
  POST_AUTH_DESTINATION,
  storeAuthReturnPath,
} from '@/backend/supabase/supabaseOAuthGateway';
import AuthLoginHero from '@/components/auth/AuthLoginHero';
import AuthLoginCard, { AuthLoginStatus } from '@/components/auth/AuthLoginCard';
import AuthTrustPillar from '@/components/auth/AuthTrustPillar';
import { FoundersAcknowledgment } from '@/components/brand/FoundersAcknowledgment';
import PageMeta from '@/components/common/PageMeta';

export default function AuthPage() {
  const {
    user,
    isConfigured,
    requestAccessLink,
    signInWithGoogle,
  } = useAuth();
  const { loading: capabilitiesLoading, winner } = useAuthCapabilities();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isProduction = import.meta.env.PROD;
  const showConfigRequired = isProduction && !isConfigured;
  const authDisabled = submitting || showConfigRequired;

  const embeddedAuthBrowser = useMemo(
    () => typeof navigator !== 'undefined' && isEmbeddedAuthBrowser(),
    [],
  );
  const embeddedBrowserLabel = useMemo(
    () => (typeof navigator !== 'undefined' ? getEmbeddedAuthBrowserLabel() : 'embedded browser'),
    [],
  );
  const externalAuthUrl = useMemo(() => getAuthPageUrl(), []);
  const adminApprovalMessage =
    'Use an approved account. Google SSO and secure email magic links are handled by Supabase.';

  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message !== 'password-reset-unavailable') return;

    setMessage('Password reset is not required. Request a secure email sign-in link instead.');
    navigate('/auth', { replace: true, state: null });
  }, [location.state, navigate]);

  const status = useMemo<AuthLoginStatus | null>(() => {
    if (error) return { message: error, variant: 'error' };
    if (message) return { message, variant: 'success' };
    return null;
  }, [error, message]);

  if (user) {
    return <Navigate to={POST_AUTH_DESTINATION} replace />;
  }

  const handleCopyAuthUrl = async () => {
    try {
      await navigator.clipboard.writeText(externalAuthUrl);
      toast.success('Sign-in link copied', {
        description: 'Paste into Chrome or Safari to complete sign-in.',
      });
    } catch {
      toast.message('Copy this URL', { description: externalAuthUrl });
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    storeAuthReturnPath(POST_AUTH_DESTINATION);
    setSubmitting(true);
    const result = await signInWithGoogle();
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (result.redirecting) {
      setMessage('Redirecting to Google…');
      return;
    }
    navigate(POST_AUTH_DESTINATION, { replace: true });
  };

  const handleEmailLinkSignIn = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setMessage(null);
      setError('Enter the approved email address for your Vishvakarma.OS account.');
      return;
    }

    setError(null);
    setMessage(null);
    storeAuthReturnPath(POST_AUTH_DESTINATION);
    setSubmitting(true);
    const result = await requestAccessLink(normalizedEmail);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setMessage(`Secure sign-in link sent to ${normalizedEmail}. Open it in this browser to continue.`);
  };

  const handleRequestAccess = () => {
    toast.message('Approved account required', {
      description: adminApprovalMessage,
    });
  };

  return (
    <>
      <PageMeta
        title="Sign In — Vishvakarma.OS"
        description="Enter the architecture workspace with Google SSO or a secure Supabase email magic link."
      />

      <main className="vish-login-page vish-login-page--reference-replica" aria-labelledby="auth-page-title" data-testid="auth-page">
        <AuthLoginHero />
        <AuthLoginCard
          submitting={submitting}
          disabled={authDisabled}
          status={status}
          email={email}
          embeddedAuthBrowser={embeddedAuthBrowser}
          embeddedBrowserLabel={embeddedBrowserLabel}
          externalAuthUrl={externalAuthUrl}
          showConfigRequired={showConfigRequired}
          onEmailChange={setEmail}
          onEmailLink={handleEmailLinkSignIn}
          onSso={handleGoogleSignIn}
          onRequestAccess={handleRequestAccess}
          onCopyAuthUrl={handleCopyAuthUrl}
        />
      </main>

      <div className="vish-login-page__footer-stack">
        <div
          className="vish-login-page__trust sacred-auth-trust"
          data-testid="auth-trust-pillars"
          aria-labelledby="auth-trust-heading"
          aria-busy={capabilitiesLoading ? 'true' : undefined}
        >
          <h2 id="auth-trust-heading" className="sr-only">
            Trust &amp; evidence
          </h2>

          <AuthTrustPillar
            icon={Shield}
            badge={winner ? 'Winner evidence' : 'Release evidence'}
            title={`${WORLD_RECORD_METRIC_GATE_COUNT} Release Gates`}
            description="Automated pre-release verification with audit trail."
            metric={String(WORLD_RECORD_METRIC_GATE_COUNT)}
            metricLabel="gates"
            destination="/releases"
            variant="gates"
            testId="auth-trust-pillar-gates"
            onLearnMore={() =>
              toast.message('Release evidence', {
                description: 'Sign in to inspect release gate snapshots.',
              })
            }
          />

          <AuthTrustPillar
            icon={Trophy}
            badge="World records"
            title="World Records Registry"
            description={`${WORLD_RECORD_HONESTY_DISCLAIMER.split(' until ')[0]}.`}
            destination="/world-records"
            variant="records"
            testId="auth-trust-pillar-records"
            onLearnMore={() =>
              toast.message('World Records', {
                description: 'Sign in to view the Self-Verified Candidate registry.',
              })
            }
          />
        </div>
        <FoundersAcknowledgment variant="auth" className="vish-auth-founders-line" />
      </div>
    </>
  );
}
