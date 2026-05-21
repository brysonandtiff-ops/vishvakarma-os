import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, LockKeyhole, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border bg-card/80 p-8 shadow-lg backdrop-blur">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Secure Access</p>
              <h1 className="text-3xl font-bold tracking-tight">Vishvakarma.OS</h1>
            </div>
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-balance">Production workspace access is protected.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Sign in or create an account with a secure email link. This keeps the architectural editor,
            registry, change requests, release gates, and audit trail behind an authenticated session.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-background/60 p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">Passwordless</p>
              <p className="mt-1 text-xs text-muted-foreground">No password storage in the client UI.</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">Session guarded</p>
              <p className="mt-1 text-xs text-muted-foreground">Every app route is protected when Supabase is configured.</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <Mail className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">Account creation</p>
              <p className="mt-1 text-xs text-muted-foreground">New users are created through Supabase email link flow.</p>
            </div>
          </div>
        </section>

        <Card className="self-center">
          <CardHeader>
            <CardTitle>Request secure access</CardTitle>
            <CardDescription>
              Enter your email and Supabase will send a sign-in link. If the account does not exist, it will be created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConfigured && (
              <div className="mb-4 flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
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
                />
              </label>

              {error && (
                <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {message && (
                <p role="status" className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                  {message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={!isConfigured || submitting}>
                {submitting ? 'Sending access link…' : 'Send secure access link'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
