import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, LockKeyhole, Mail, MailCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/vish-auth-gate.css';

const SANSKRIT_MATRIX_COLUMNS = [
  'ॐ श्री विश्वकर्मणे नमः',
  'धर्म अर्थ शिल्प विज्ञान',
  'मन्त्र यन्त्र वास्तु रचना',
  'ॐ ह्रीं क्लीं सौः',
  'विद्या कर्म ज्योति रूपम्',
  'स्थिरं सौन्दर्यम् शुभम्',
  'रचना प्रमाणं सुरक्षा',
  'सत्यं शिल्पं प्रकाशः',
] as const;

const TRUST_PILLARS = [
  'Secure session gate',
  'Governance audit ready',
  'iPad-first workspace',
  'Release evidence locked',
] as const;

const ACCESS_STEPS = [
  'Enter your email',
  'Open the secure link',
  'Return to the workspace',
] as const;

function getReturnPath(state: unknown) {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    const from = String((state as { from: unknown }).from);
    return from.startsWith('/') ? from : '/';
  }

  return '/';
}

export default function AuthPage() {
  const { user, loading, isConfigured, mode, requestAccessLink } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const returnPath = getReturnPath(location.state);
  const emailPreview = useMemo(() => email.trim().toLowerCase() || 'you@example.com', [email]);

  if (!loading && user) {
    return <Navigate to={returnPath} replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError('Enter your email address to request a secure access link.');
      return;
    }

    setSubmitting(true);
    const result = await requestAccessLink(email);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setMessage(`Secure access link sent to ${emailPreview}. Check your inbox, then return to Vishvakarma.OS.`);
  };

  return (
    <main className="vish-auth-gate vish-dark-stage relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="vish-sanskrit-matrix pointer-events-none absolute inset-0" aria-hidden="true">
        {SANSKRIT_MATRIX_COLUMNS.map((glyphs, index) => (
          <span
            key={glyphs}
            className="vish-sanskrit-column"
            style={{
              left: `${5 + index * 12.5}%`,
              animationDelay: `${index * -3.2}s`,
              animationDuration: `${18 + index * 2.4}s`,
            }}
          >
            {Array.from({ length: 9 }, (_, lineIndex) => (
              <span key={`${glyphs}-${lineIndex}`}>{glyphs}</span>
            ))}
          </span>
        ))}
      </div>

      <div className="vish-yantra-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="vish-mandala-aura pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="vish-mandala-ring vish-mandala-ring-outer" />
        <div className="vish-mandala-ring vish-mandala-ring-mid" />
        <div className="vish-mandala-ring vish-mandala-ring-inner" />
      </div>

      <div className="vish-auth-orb pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true" />

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-7 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="vish-auth-hero rounded-[2rem] border border-primary/25 bg-black/35 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="vish-logo-tile vish-logo-tile-animated flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl p-2">
              <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official user-supplied swan V logo" className="h-full w-full rounded-xl object-cover" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-primary/80">Secure Access</p>
              <h1 className="vish-wordmark mt-2 text-2xl font-bold tracking-[0.34em]">Vishvakarma.OS</h1>
              <p className="mt-2 text-xs uppercase tracking-[0.28em] text-primary/55">विश्वकर्मा · Divine Architecture</p>
            </div>
          </div>

          <div className="vish-auth-mantra-chip mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/85">
            <Sparkles className="h-3.5 w-3.5" />
            ॐ विश्वकर्मणे नमः · secure architecture gate
          </div>

          <h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-stone-100 md:text-5xl">
            Enter the protected design mandala.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-300">
            A calm, passwordless access gate for the blueprint editor, 3D studio, registry,
            change requests, release gates, and audit trail. Built to feel premium, spiritual,
            and precise without weakening the product trust layer.
          </p>

          <div className="vish-auth-trust-strip mt-7 grid gap-2 rounded-2xl border border-primary/20 bg-black/20 p-3 sm:grid-cols-2">
            {TRUST_PILLARS.map((pillar) => (
              <div key={pillar} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-300">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{pillar}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="vish-auth-feature-card rounded-2xl border border-primary/20 bg-white/5 p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-stone-100">Passwordless</p>
              <p className="mt-1 text-xs text-stone-400">Email-link access with no password UI.</p>
            </div>
            <div className="vish-auth-feature-card rounded-2xl border border-primary/20 bg-white/5 p-4">
              <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-stone-100">Session guarded</p>
              <p className="mt-1 text-xs text-stone-400">Private routes redirect to this gate.</p>
            </div>
            <div className="vish-auth-feature-card rounded-2xl border border-primary/20 bg-white/5 p-4">
              <MailCheck className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-stone-100">Inbox verified</p>
              <p className="mt-1 text-xs text-stone-400">Magic links keep access simple and auditable.</p>
            </div>
          </div>
        </section>

        <Card className="vish-auth-access-card vish-panel self-center rounded-[1.75rem] text-foreground">
          <CardHeader className="pb-4">
            <div className="mb-4 flex justify-center">
              <div className="vish-access-logo-shell flex h-24 w-24 items-center justify-center rounded-[1.7rem] p-2">
                <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official user-supplied logo" className="vish-access-logo h-full w-full rounded-2xl object-cover shadow-lg" />
              </div>
            </div>
            <div className="vish-card-mantra mx-auto mb-3 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]">
              मन्त्र प्रवेश
            </div>
            <CardTitle className="text-center text-2xl">Request your access link</CardTitle>
            <CardDescription className="text-center">
              Enter your email and Vishvakarma.OS will send a secure sign-in link. No password required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="vish-access-steps mb-5 grid gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-3 sm:grid-cols-3">
              {ACCESS_STEPS.map((step, index) => (
                <div key={step} className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">{index + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            {!isConfigured && (
              <div className="mb-4 flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="font-semibold">Local-only mode active</p>
                  <p className="text-muted-foreground">
                    Auth is disabled until real{' '}
                    {backendStatus.provider === 'firebase' ? 'Firebase' : 'Supabase'} environment variables are
                    configured. Current mode: {mode}.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                <span>Email address</span>
                <span className="vish-email-field relative block">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={!isConfigured || submitting}
                    className="h-12 rounded-xl bg-white/75 pl-10 pr-3 text-base shadow-inner"
                  />
                </span>
              </label>

              {error && (
                <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {message && (
                <p role="status" className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                  {message}
                </p>
              )}

              <Button type="submit" className="vish-auth-submit h-12 w-full rounded-xl bg-primary text-primary-foreground shadow-lg" disabled={!isConfigured || submitting}>
                {submitting ? 'Sending access link…' : 'Send secure access link'}
                {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-5 rounded-2xl border border-border/70 bg-white/50 p-3 text-[11px] leading-5 text-muted-foreground">
              <strong className="text-foreground">Access note:</strong> links open back into the same protected workspace.
              If the email does not arrive, check Supabase email provider and redirect URL settings.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}