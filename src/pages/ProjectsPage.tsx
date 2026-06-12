import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderOpen, Loader2, MoreHorizontal, PenTool, Plus } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import PageMeta from '@/components/common/PageMeta';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import WorkspacePageShell from '@/components/layouts/WorkspacePageShell';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { deleteProject, getProjects } from '@/db/api';
import { backendStatus } from '@/backend/backendConfig';
import { deleteLocalProject, getLocalWorkspaceProjects } from '@/editor/localProjects';
import { clearLocalDraft } from '@/editor/localDraft';
import { isLocalProjectId } from '@/editor/localProject';
import type { Project } from '@/types';
import { projectThumbnailDataUrl } from '@/utils/projectThumbnail';
import { toast } from 'sonner';

function isProjectArchived(project: Project): boolean {
  if (project.manifest.metadata.archived) return true;
  return project.description?.includes('[archived]') ?? false;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

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

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return projects
      .filter((project) => {
        if (!showArchived && isProjectArchived(project)) return false;
        if (!query) return true;
        return (
          project.name.toLowerCase().includes(query) ||
          (project.description ?? '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  }, [projects, searchQuery, showArchived]);

  const duplicateProject = (project: Project) => {
    const copy: Project = {
      ...project,
      id: `local-${crypto.randomUUID()}`,
      name: `${project.name} (copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      manifest: {
        ...project.manifest,
        name: `${project.name} (copy)`,
        metadata: {
          ...project.manifest.metadata,
          modified: new Date().toISOString(),
        },
      },
    };
    if (backendStatus.isConfigured) {
      toast.info('Duplicate saved locally — sign in to cloud-save copies.');
    }
    navigate('/editor', { state: { loadProject: copy } });
  };

  const toggleArchive = async (project: Project) => {
    const archived = isProjectArchived(project);
    const nextManifest = {
      ...project.manifest,
      metadata: {
        ...project.manifest.metadata,
        archived: !archived,
        modified: new Date().toISOString(),
      },
    };
    const nextDescription = archived
      ? (project.description ?? '').replace('[archived]', '').trim()
      : project.description;

    if (isLocalProjectId(project.id)) {
      setProjects((prev) =>
        prev.map((entry) =>
          entry.id === project.id
            ? { ...entry, manifest: nextManifest, description: nextDescription || undefined }
            : entry,
        ),
      );
      toast.success(archived ? 'Project restored' : 'Project archived');
      return;
    }
    toast.info('Archive updated locally — cloud sync requires save in editor.');
  };

  const cloudLabel = backendStatus.isConfigured ? 'Supabase Cloud Save' : 'Local Draft';

  return (
    <AppLayout>
      <PageMeta title="Projects" description="Open and manage your Vishvakarma.OS floor plans." />
      <WorkspacePageShell>
        <WorkspacePageHeader
          eyebrow="Workspace"
          title="Your projects"
          description={
            backendStatus.isConfigured
              ? `Cloud projects sync via ${cloudLabel}.`
              : 'Local Draft mode — projects and auto-saved drafts are stored in this browser.'
          }
          stats={
            <>
              <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold tabular-nums text-foreground">
                {projects.length} project{projects.length === 1 ? '' : 's'}
              </span>
              <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                {cloudLabel}
              </span>
            </>
          }
          actions={
            <Button asChild className="touch-target">
              <Link to="/editor">
                <Plus className="mr-2 h-4 w-4" />
                New in editor
              </Link>
            </Button>
          }
        />

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
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Search projects…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
                aria-label="Search projects"
              />
              <Button
                variant={showArchived ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived ? 'Hide archived' : 'Show archived'}
              </Button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => {
                const isDraft = project.id.startsWith('local-draft-');
                const thumb = projectThumbnailDataUrl(project.manifest);
                return (
                  <article
                    key={project.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card/70 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] border-b border-border/60 bg-muted/30">
                      {thumb ? (
                        <img src={thumb} alt="" className="h-full w-full object-contain p-3" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                          <PenTool className="h-8 w-8 opacity-40" />
                          <span className="text-xs">Empty plan</span>
                        </div>
                      )}
                      {isDraft && (
                        <span className="absolute left-3 top-3 rounded-full border border-primary/30 bg-background/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h2 className="truncate font-semibold text-foreground">{project.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {project.manifest.walls.length} walls · {project.manifest.openings.length} openings
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatRelativeTime(project.updated_at)}
                        {!backendStatus.isConfigured && ' · Local'}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <Button size="sm" className="touch-target flex-1" onClick={() => openProject(project)}>
                          Open
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="touch-target px-2" aria-label={`More actions for ${project.name}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => duplicateProject(project)}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void toggleArchive(project)}>
                              {isProjectArchived(project) ? 'Restore' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={deletingId === project.id}
                              onClick={() => setPendingDelete(project)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </WorkspacePageShell>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="vish-dialog-chrome">
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
