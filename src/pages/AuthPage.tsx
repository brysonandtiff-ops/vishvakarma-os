import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, LockKeyhole, Mail } from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

const SANSKRIT_MATRIX_COLUMNS = [
  'ॐ श्री विश्वकर्मणे नमः',
  'धर्म अर्थ शिल्प विज्ञान',
  'मन्त्र यन्त्र वास्तु रचना',
  'ॐ ह्रीं क्लीं सौः',
  'विद्या कर्म ज्योति रूपम्',
  'स्थिरं सौन्दर्यम् शुभम्',
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

    setMessage('Secure access link sent. Check your email, then return to Vishvakarma.OS.');
  };

  return (
    <main className="vish-auth-gate vish-dark-stage relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="vish-sanskrit-matrix pointer-events-none absolute inset-0" aria-hidden="true">
        {SANSKRIT_MATRIX_COLUMNS.map((glyphs, index) => (
          <span
            key={glyphs}
            className="vish-sanskrit-column"
            style={{
              left: `${8 + index * 16}%`,
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

      <div className="vish-mandala-aura pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="vish-mandala-ring vish-mandala-ring-outer" />
        <div className="vish-mandala-ring vish-mandala-ring-mid" />
        <div className="vish-mandala-ring vish-mandala-ring-inner" />
      </div>

      <div className="vish-auth-orb pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true" />

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-7 lg:grid-cols-[1.12fr_0.88fr]">
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

          <div className="mb-5 inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/85">
            मन्त्र matrix · secure architecture gate
          </div>

          <h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-stone-100 md:text-5xl">
            Protected iPad&#8209;first architectural workspace.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-300">
            Sign in or create an account with a secure email link. The blueprint editor, 3D studio,
            registry, change requests, release gates, and audit trail stay behind a verified session.
          </p>

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
              <Mail className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-stone-100">Account creation</p>
              <p className="mt-1 text-xs text-stone-400">New users are created through Supabase Auth.</p>
            </div>
          </div>
        </section>

        <Card className="vish-auth-access-card vish-panel self-center rounded-[1.75rem] text-foreground">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official user-supplied logo" className="vish-access-logo h-20 w-20 rounded-2xl object-cover shadow-lg" />
            </div>
            <CardTitle className="text-center text-2xl">Request secure access</CardTitle>
            <CardDescription className="text-center">
              Enter your email and Supabase will send a sign-in link. If the account does not exist, it will be created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConfigured && (
              <div className="mb-4 flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="font-semibold">Local-only mode active</p>
                  <p className="text-muted-foreground">
                    Auth is disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.
                    Current mode: {mode}.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                <span>Email address</span>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!isConfigured || submitting}
                  className="h-11 rounded-xl bg-white/70"
                />
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

              <Button type="submit" className="h-11 w-full rounded-xl bg-primary text-primary-foreground shadow-lg" disabled={!isConfigured || submitting}>
                {submitting ? 'Sending access link…' : 'Send secure access link'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
