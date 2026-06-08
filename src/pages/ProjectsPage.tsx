import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderOpen, Loader2, PenTool, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import PageMeta from '@/components/common/PageMeta';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteProject, getProjects } from '@/db/api';
import { backendStatus } from '@/backend/backendConfig';
import { deleteLocalProject, getLocalWorkspaceProjects } from '@/editor/localProjects';
import { clearLocalDraft } from '@/editor/localDraft';
import { isLocalProjectId } from '@/editor/localProject';
import type { Project } from '@/types';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cloudProjects = backendStatus.isConfigured ? await getProjects() : [];
      const localProjects = backendStatus.isConfigured ? [] : getLocalWorkspaceProjects();
      setProjects([...cloudProjects, ...localProjects]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
      setProjects(backendStatus.isConfigured ? [] : getLocalWorkspaceProjects());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const openProject = (project: Project) => {
    navigate('/editor', { state: { loadProject: project } });
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;

    const project = pendingDelete;
    setPendingDelete(null);
    setDeletingId(project.id);

    try {
      if (isLocalProjectId(project.id) || project.id.startsWith('local-draft-')) {
        if (project.id.startsWith('local-draft-')) {
          clearLocalDraft();
        } else {
          deleteLocalProject(project.id);
        }
        setProjects((prev) => prev.filter((entry) => entry.id !== project.id));
        toast.success('Local project removed');
      } else {
        await deleteProject(project.id);
        setProjects((prev) => prev.filter((entry) => entry.id !== project.id));
        toast.success('Project deleted');
      }
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const cloudLabel = backendStatus.isConfigured ? 'Firebase Cloud Save' : 'Local Draft';

  return (
    <AppLayout>
      <PageMeta title="Projects" description="Open and manage your Vishvakarma.OS floor plans." />
      <div className="mx-auto max-w-4xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="vish-marketing-section-label text-[10px] uppercase tracking-[0.24em] text-primary">
              Project Proof
            </p>
            <h1 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">Your projects</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {backendStatus.isConfigured
                ? `Cloud projects sync via ${cloudLabel}.`
                : 'Local Draft mode — projects and auto-saved drafts are stored in this browser.'}
            </p>
          </div>
          <Button asChild className="touch-target">
            <Link to="/editor">
              <Plus className="mr-2 h-4 w-4" />
              New in editor
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="mt-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm">Loading projects…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="font-semibold text-destructive">Cloud unavailable</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4 touch-target" onClick={() => void loadProjects()}>
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-primary/25 bg-card/40 p-10 text-center">
            <FolderOpen className="mx-auto h-10 w-10 text-primary/60" aria-hidden="true" />
            <p className="mt-4 font-semibold text-foreground">No projects yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Open the editor to create a floor plan, load the sample project, or save a local draft.
            </p>
            <Button asChild className="mt-6 touch-target">
              <Link to="/editor">Open editor</Link>
            </Button>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <ul className="mt-8 space-y-3">
            {projects.map((project) => {
              const isDraft = project.id.startsWith('local-draft-');
              return (
                <li
                  key={project.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/50 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {project.name}
                      {isDraft && (
                        <span className="ml-2 rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Draft
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.manifest.walls.length} walls · {project.manifest.openings.length} openings ·{' '}
                      {new Date(project.updated_at).toLocaleDateString()}
                      {!backendStatus.isConfigured && ' · Local browser'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="touch-target" onClick={() => openProject(project)}>
                      <PenTool className="mr-1.5 h-3.5 w-3.5" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="touch-target text-destructive hover:text-destructive"
                      disabled={deletingId === project.id}
                      onClick={() => setPendingDelete(project)}
                      aria-label={`Delete ${project.name}`}
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.name}" will be permanently removed. This cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDeleteConfirmed()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
