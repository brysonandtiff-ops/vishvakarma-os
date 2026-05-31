import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Mail, Shield } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, profile, mode, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();

  const providerLabel = backendStatus.provider === 'firebase' ? 'Firebase' : 'Supabase';
  const saveLabel = backendStatus.isConfigured
    ? backendStatus.provider === 'firebase'
      ? 'Firebase Cloud Save'
      : 'Supabase Cloud Save'
    : 'Local Draft';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <AppLayout>
      <PageMeta title="Profile" description="Your Vishvakarma.OS account and workspace mode." />
      <div className="mx-auto max-w-lg p-6 md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Protected Workspace</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Account</h1>

        <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card/50 p-6">
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

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" asChild className="touch-target">
            <Link to="/projects">View projects</Link>
          </Button>
          <Button variant="destructive" className="touch-target" onClick={() => void handleSignOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
