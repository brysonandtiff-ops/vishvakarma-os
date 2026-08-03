import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Trophy } from 'lucide-react';
import { WORLD_RECORD_METRIC_GATE_COUNT } from '@/governance/gates/releaseGateManifest';
import { WORLD_RECORD_HONESTY_DISCLAIMER } from '@/governance/records/worldRecordRegistry';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthCapabilities } from '@/hooks/useAuthCapabilities';
import { toast } from 'sonner';
import { POST_AUTH_DESTINATION } from '@/backend/supabase/supabaseOAuthGateway';
import AuthLoginHero from '@/components/auth/AuthLoginHero';
import AuthLoginCard, { AuthLoginStatus } from '@/components/auth/AuthLoginCard';
import AuthTrustPillar from '@/components/auth/AuthTrustPillar';
import { FoundersAcknowledgment } from '@/components/brand/FoundersAcknowledgment';
import PageMeta from '@/components/common/PageMeta';

export default function AuthPage() {
  const { user, isConfigured, signInWithPassword } = useAuth();
  const { loading: capabilitiesLoading, winner } = useAuthCapabilities();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isProduction = import.meta.env.PROD;
  const showConfigRequired = isProduction && !isConfigured;
  const authDisabled = submitting || showConfigRequired;
  const adminApprovalMessage =
    'Use the approved Supabase email account created by the Vishvakarma.OS administrator.';

  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message !== 'password-reset-unavailable') return;

    setMessage('Use your approved Supabase email and password to sign in.');
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

  const handleSupabaseSignIn = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setMessage(null);
      setError('Enter the approved email address for your Vishvakarma.OS account.');
      return;
    }
    if (!password) {
      setMessage(null);
      setError('Enter your Supabase account password.');
      return;
    }

    setError(null);
    setMessage(null);
    setSubmitting(true);
    const result = await signInWithPassword(normalizedEmail, password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setMessage('Supabase verified. Opening your workspace…');
    navigate(POST_AUTH_DESTINATION, { replace: true });
  };

  const handleRequestAccess = () => {
    toast.message('Approved Supabase account required', {
      description: adminApprovalMessage,
    });
  };

  return (
    <>
      <PageMeta
        title="Sign In — Vishvakarma.OS"
        description="Enter the architecture workspace using the approved Supabase email and password login."
      />

      <main
        className="vish-login-page vish-login-page--reference-replica"
        aria-labelledby="auth-page-title"
        data-testid="auth-page"
      >
        <AuthLoginHero />
        <AuthLoginCard
          submitting={submitting}
          disabled={authDisabled}
          status={status}
          email={email}
          password={password}
          showConfigRequired={showConfigRequired}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSupabaseSignIn}
          onRequestAccess={handleRequestAccess}
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
