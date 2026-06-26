import { FormEvent, useMemo, useState } from 'react';
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
  isEmbeddedAuthErrorMessage,
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
    emailLinkState,
    emailLinkError,
    requestAccessLink,
    completeEmailLinkSignIn,
    signInWithGoogle,
  } = useAuth();
  const { loading: capabilitiesLoading, winner } = useAuthCapabilities();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const emailPreview = useMemo(() => email.trim().toLowerCase() || 'architect@firm.com', [email]);
  const isProduction = import.meta.env.PROD;
  const showConfigRequired = isProduction && !isConfigured;
  const allowLocalWorkspace = !isProduction && !isConfigured;

  const passwordResetNotice =
    typeof location.state === 'object' &&
    location.state !== null &&
    'message' in location.state &&
    (location.state as { message: unknown }).message === 'password-reset-unavailable';

  const sessionRestoreTimeoutNotice =
    typeof location.state === 'object' &&
    location.state !== null &&
    'message' in location.state &&
    (location.state as { message: unknown }).message === 'session-restore-timeout';

  const embeddedAuthBrowser = useMemo(
    () => typeof navigator !== 'undefined' && isEmbeddedAuthBrowser(),
    [],
  );
  const embeddedBrowserLabel = useMemo(
    () => (typeof navigator !== 'undefined' ? getEmbeddedAuthBrowserLabel() : 'embedded browser'),
    [],
  );
  const externalAuthUrl = useMemo(() => getAuthPageUrl(), []);

  const completingEmailLink = emailLinkState === 'completing';
  const needsEmailForLink = emailLinkState === 'needs_email';
  const authDisabled = submitting || completingEmailLink || showConfigRequired;

  const status = useMemo<AuthLoginStatus | null>(() => {
    const err = emailLinkError || error;
    if (err) return { message: err, variant: 'error' };
    if (message) return { message, variant: 'success' };
    return null;
  }, [emailLinkError, error, message]);

  if (user) {
    return <Navigate to={POST_AUTH_DESTINATION} replace />;
  }

  const sendAccessLink = async (source: 'sign-in' | 'magic-link' | 'request-access' | 'forgot-password') => {
    setMessage(null);
    setError(null);
    setForgotPasswordNotice(false);

    if (!email.trim()) {
      setError('Enter your email address to request a secure access link.');
      return;
    }

    if (source === 'sign-in' && password.trim()) {
      setMessage('This workspace uses secure email links instead of passwords. Sending your access link…');
    }

    setSubmitting(true);
    const result = await requestAccessLink(email);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (source === 'forgot-password') {
      setMessage(`Password reset is unavailable. Secure access link sent to ${emailPreview}.`);
      return;
    }

    setMessage(`Secure access link sent to ${emailPreview}. Check your inbox, then return to Vishvakarma.OS.`);
  };

  const onCompleteEmailLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setForgotPasswordNotice(false);
    if (!email.trim()) {
      setError('Enter the same email address that received the secure access link.');
      return;
    }
    setSubmitting(true);
    const result = await completeEmailLinkSignIn(email);
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    navigate(POST_AUTH_DESTINATION, { replace: true });
  };

  const onSignInSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendAccessLink('sign-in');
  };

  const handleForgotPassword = () => {
    setForgotPasswordNotice(true);
    setError(null);
    setMessage(null);
  };

  const handleCopyAuthUrl = async () => {
    try {
      await navigator.clipboard.writeText(externalAuthUrl);
      toast.success('Sign-in link copied', {
        description: 'Paste into Chrome or Safari to complete Google sign-in.',
      });
    } catch {
      toast.message('Copy this URL', { description: externalAuthUrl });
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    setForgotPasswordNotice(false);
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

  return (
    <>
      <PageMeta
        title="Sign In — Vishvakarma.OS"
        description="Enter the sacred architecture workspace. Sign in to access your governed blueprint projects."
      />

      <main className="vish-login-page vish-login-page--reference-replica" aria-labelledby="auth-page-title" data-testid="auth-page">
        <AuthLoginHero />
        <AuthLoginCard
          email={email}
          password={password}
          rememberDevice={rememberDevice}
          showPassword={showPassword}
          submitting={submitting}
          disabled={authDisabled}
          status={status}
          embeddedAuthBrowser={embeddedAuthBrowser}
          embeddedBrowserLabel={embeddedBrowserLabel}
          externalAuthUrl={externalAuthUrl}
          completingEmailLink={completingEmailLink}
          needsEmailForLink={needsEmailForLink}
          passwordResetNotice={passwordResetNotice || forgotPasswordNotice}
          sessionRestoreTimeoutNotice={sessionRestoreTimeoutNotice}
          showConfigRequired={showConfigRequired}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onRememberDeviceChange={setRememberDevice}
          onTogglePassword={() => setShowPassword((v) => !v)}
          onSignIn={onSignInSubmit}
          onCompleteEmailLink={onCompleteEmailLink}
          onMagicLink={() => void sendAccessLink('magic-link')}
          onForgotPassword={handleForgotPassword}
          onSso={handleGoogleSignIn}
          onRequestAccess={() => void sendAccessLink('request-access')}
          onCopyAuthUrl={handleCopyAuthUrl}
          allowLocalWorkspace={allowLocalWorkspace}
          onLocalWorkspace={() => navigate('/editor')}
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
                description: 'Sign in to open Releases and inspect gate snapshots.',
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

        <div className="vish-login-page__founders">
          <FoundersAcknowledgment variant="auth" />
        </div>
      </div>

      <div className="vish-login-page__bottom-bar">
        <span>Inspired by Divinity</span>
        <span className="vish-login-page__bottom-bar-ornament" aria-hidden="true">✦</span>
        <span>Built for Humanity</span>
        <span className="vish-login-page__bottom-bar-version">v1.0.0</span>
      </div>
    </>
  );
}
