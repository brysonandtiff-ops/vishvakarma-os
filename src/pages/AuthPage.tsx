import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Trophy } from 'lucide-react';
import { WORLD_RECORD_METRIC_GATE_COUNT } from '@/governance/gates/releaseGateManifest';
import { WORLD_RECORD_HONESTY_DISCLAIMER } from '@/governance/records/worldRecordRegistry';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthCapabilities } from '@/hooks/useAuthCapabilities';
import { POST_AUTH_DESTINATION } from '@/backend/supabase/supabaseOAuthGateway';
import {
  createSupabaseAccount,
  validateAccountPassword,
} from '@/backend/supabase/supabaseAccountLifecycle';
import AuthLoginHero from '@/components/auth/AuthLoginHero';
import AuthLoginCard, {
  type AuthFormMode,
  type AuthLoginStatus,
} from '@/components/auth/AuthLoginCard';
import AuthTrustPillar from '@/components/auth/AuthTrustPillar';
import { FoundersAcknowledgment } from '@/components/brand/FoundersAcknowledgment';
import PageMeta from '@/components/common/PageMeta';

export default function AuthPage() {
  const {
    user,
    isConfigured,
    signInWithPassword,
    requestPasswordReset,
  } = useAuth();
  const { loading: capabilitiesLoading, winner } = useAuthCapabilities();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthFormMode>('sign-in');
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isProduction = import.meta.env.PROD;
  const showConfigRequired = isProduction && !isConfigured;
  const authDisabled = submitting || showConfigRequired;

  useEffect(() => {
    const state = location.state as { message?: string } | null;
    const params = new URLSearchParams(location.search);

    if (state?.message === 'password-reset-complete') {
      setMessage('Password updated. Sign in with your new password.');
      setMode('sign-in');
      navigate('/auth', { replace: true, state: null });
      return;
    }

    if (params.get('confirmed') === '1') {
      setMessage('Email confirmed. Your Supabase account is ready.');
      setMode('sign-in');
      navigate('/auth', { replace: true });
    }
  }, [location.search, location.state, navigate]);

  const status = useMemo<AuthLoginStatus | null>(() => {
    if (error) return { message: error, variant: 'error' };
    if (message) return { message, variant: 'success' };
    return null;
  }, [error, message]);

  if (user) {
    return <Navigate to={POST_AUTH_DESTINATION} replace />;
  }

  const validateEmail = () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      throw new Error('Enter a valid email address.');
    }
    return normalized;
  };

  const handleSupabaseSignIn = async () => {
    try {
      const normalizedEmail = validateEmail();
      if (!password) throw new Error('Enter your Supabase account password.');

      setError(null);
      setMessage(null);
      setSubmitting(true);
      const result = await signInWithPassword(normalizedEmail, password);
      if (result.error) throw result.error;

      setMessage('Supabase verified. Opening your workspace…');
      navigate(POST_AUTH_DESTINATION, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const normalizedEmail = validateEmail();
      const passwordError = validateAccountPassword(password);
      if (passwordError) throw new Error(passwordError);
      if (password !== confirmPassword) {
        throw new Error('The two passwords do not match.');
      }

      setError(null);
      setMessage(null);
      setSubmitting(true);
      const result = await createSupabaseAccount(
        normalizedEmail,
        password,
        `${window.location.origin}/auth?confirmed=1`,
      );

      setPassword('');
      setConfirmPassword('');

      if (result.session) {
        setMessage('Account created. Opening your workspace…');
        navigate(POST_AUTH_DESTINATION, { replace: true });
        return;
      }

      setMode('sign-in');
      setMessage(
        'Account created. Check your email and confirm the address before signing in.',
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Account creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const normalizedEmail = validateEmail();
      setError(null);
      setMessage(null);
      setSubmitting(true);
      const result = await requestPasswordReset(normalizedEmail);
      if (result.error) throw result.error;
      setMessage(
        'Password recovery email sent. Open the newest link to choose a new password.',
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Password recovery failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModeChange = (nextMode: AuthFormMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage(null);
  };

  return (
    <>
      <PageMeta
        title="Supabase Account — Vishvakarma.OS"
        description="Sign in, create an account, or recover a Vishvakarma.OS password through Supabase Auth."
      />

      <main
        className="vish-login-page vish-login-page--reference-replica"
        aria-labelledby="auth-page-title"
        data-testid="auth-page"
      >
        <AuthLoginHero />
        <AuthLoginCard
          mode={mode}
          submitting={submitting}
          disabled={authDisabled}
          status={status}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          showConfigRequired={showConfigRequired}
          onModeChange={handleModeChange}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={mode === 'create-account' ? handleCreateAccount : handleSupabaseSignIn}
          onForgotPassword={handleForgotPassword}
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
            onLearnMore={() => undefined}
          />

          <AuthTrustPillar
            icon={Trophy}
            badge="World records"
            title="World Records Registry"
            description={`${WORLD_RECORD_HONESTY_DISCLAIMER.split(' until ')[0]}.`}
            destination="/world-records"
            variant="records"
            testId="auth-trust-pillar-records"
            onLearnMore={() => undefined}
          />
        </div>
        <FoundersAcknowledgment variant="auth" className="vish-auth-founders-line" />
      </div>
    </>
  );
}
