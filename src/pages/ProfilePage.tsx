import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Mail, Shield } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import PageMeta from '@/components/common/PageMeta';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import WorkspacePageShell from '@/components/layouts/WorkspacePageShell';
import { Button } from '@/components/ui/button';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, profile, mode, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();

  const providerLabel = 'Firebase';
  const saveLabel = backendStatus.isConfigured ? 'Firebase Cloud Save' : 'Local Draft';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <AppLayout>
      <PageMeta title="Profile" description="Your Vishvakarma.OS account and workspace mode." />
      <WorkspacePageShell className="max-w-2xl">
        <WorkspacePageHeader
          eyebrow="Account"
          title="Profile"
          description="Workspace session, backend mode, and sign-out controls."
          stats={
            <span className="rounded-full border border-dashed border-border/70 bg-muted/30 px-3 py-1 text-xs font-semibold text-foreground">
              {saveLabel} · session {mode}
            </span>
          }
        />

        <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-card/80 p-6 shadow-sm">
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
          <Button variant="destructive" onClick={() => void handleSignOut()} className="touch-target gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </WorkspacePageShell>
    </AppLayout>
  );
}
