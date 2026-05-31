import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderOpen, Loader2, PenTool, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { deleteProject, getProjects } from '@/db/api';
import { backendStatus } from '@/backend/backendConfig';
import { isLocalProjectId } from '@/editor/localProject';
import type { Project } from '@/types';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
      setProjects([]);
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

  const handleDelete = async (project: Project) => {
    if (isLocalProjectId(project.id)) {
      toast.message('Local projects', { description: 'Remove local projects from the editor save dialog.' });
      return;
    }

    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;

    setDeletingId(project.id);
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      toast.success('Project deleted');
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
                : 'Local Draft mode — configure backend env vars for Cloud Save.'}
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
              Open the editor to create a floor plan or load the sample project.
            </p>
            <Button asChild className="mt-6 touch-target">
              <Link to="/editor">Open editor</Link>
            </Button>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <ul className="mt-8 space-y-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/50 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{project.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {project.manifest.walls.length} walls · {project.manifest.openings.length} openings ·{' '}
                    {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="touch-target"
                    onClick={() => openProject(project)}
                  >
                    <PenTool className="mr-1.5 h-3.5 w-3.5" />
                    Open
                  </Button>
                  {!isLocalProjectId(project.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="touch-target text-destructive hover:text-destructive"
                      disabled={deletingId === project.id}
                      onClick={() => void handleDelete(project)}
                      aria-label={`Delete ${project.name}`}
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
