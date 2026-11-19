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
  peekAuthReturnPath,
  resolvePostAuthDestination,
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
  const requestedDestination = useMemo(() => {
    const next = new URLSearchParams(location.search).get('next');
    const from = (location.state as { from?: string } | null)?.from;
    return resolvePostAuthDestination(next ?? from ?? peekAuthReturnPath());
  }, [location.search, location.state]);

  useEffect(() => {
    if (!user) storeAuthReturnPath(requestedDestination);
  }, [requestedDestination, user]);

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
    return <Navigate to={requestedDestination} replace />;
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
    storeAuthReturnPath(requestedDestination);
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
    navigate(requestedDestination, { replace: true });
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
    storeAuthReturnPath(requestedDestination);
    setSubmitting(true);
    const result = await requestAccessLink(normalizedEmail);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setMessage(`If ${normalizedEmail} is already approved, check its inbox and spam for a one-time link. No new account was created.`);
  };

  const handleRequestAccess = async () => {
    setError(null);
    const normalized = email.trim().toLowerCase();
    const emailLine = normalized.includes('@') ? normalized : '[add your email address]';
    const text = 'Vishvakarma.OS iPad invitation request. Please approve this email for a private trial: ' + emailLine +
      '. Please send me an invitation when the sign-in setup is ready.';
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Vishvakarma.OS access request', text });
        setMessage('Request shared with your chosen contact. Account approval is still needed.');
        return;
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Access request copied. Send it to the person who invited you; no account was created.');
    } catch {
      setMessage('Please contact the person who gave you this link and ask them to invite your email.');
    }
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
          onRequestAccess={() => { void handleRequestAccess(); }}
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
