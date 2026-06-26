import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderOpen, MoreHorizontal, PenTool, Plus, Sparkles } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import PageStateBlock from '@/components/common/PageStateBlock';
import PageToolbar from '@/components/common/PageToolbar';
import StatPill from '@/components/common/StatPill';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import WorkspaceEmptyState, { WorkspaceEmptyStateAction } from '@/components/common/WorkspaceEmptyState';
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
import {
  getSamplesForSurface,
  getSampleFeatureBadges,
  getSampleStats,
  resolveSampleManifestSync,
} from '@/core/sampleCatalog';
import { openManifestInEditor } from '@/editor/openManifestInEditor';
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

  const demoSamples = useMemo(
    () =>
      getSamplesForSurface('projects-demo').map((sample) => ({
        sample,
        eyebrow: sample.demoEyebrow ?? sample.name,
        stats: getSampleStats(sample),
        badges: getSampleFeatureBadges(sample),
      })),
    [],
  );

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

  const openDemoSample = (sampleId: string) => {
    try {
      const manifest = resolveSampleManifestSync(sampleId);
      openManifestInEditor(navigate, manifest, { source: 'sample', name: manifest.name });
    } catch (err) {
      console.error('Failed to open demo sample:', err);
      toast.error('Failed to open demo sample');
    }
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
    <>
      <PageMeta title="Projects" description="Open and manage your Vishvakarma.OS floor plans." />
      <WorkspacePageHeader
          zone="document"
          eyebrow="Workspace"
          title="Your projects"
          description={
            backendStatus.isConfigured
              ? `Cloud projects sync via ${cloudLabel}.`
              : 'Local Draft mode — projects and auto-saved drafts are stored in this browser.'
          }
          stats={
            <>
              <StatPill>{projects.length} project{projects.length === 1 ? '' : 's'}</StatPill>
              <StatPill>{cloudLabel}</StatPill>
            </>
          }
          actions={
            <Button asChild className="touch-target" data-tutorial="projects-new">
              <Link to="/editor">
                <Plus className="mr-2 h-4 w-4" />
                New in editor
              </Link>
            </Button>
          }
        />

        {loading && (
          <div className="mt-8 space-y-3" data-testid="projects-loading-skeleton" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="vish-skeleton h-24 rounded-card-lg" />
            ))}
          </div>
        )}

        {!loading && error && (
          <PageStateBlock
            variant="error"
            title="Cloud unavailable"
            description={error}
            onRetry={() => void loadProjects()}
          />
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="mt-8 space-y-6" data-testid="projects-empty-demo-samples">
            <WorkspaceEmptyState
              icon={<FolderOpen className="mx-auto h-10 w-10" aria-hidden="true" />}
              title="No saved projects yet"
              description="Open the editor to create a floor plan, or launch one of the local demo walkthroughs below. Demo projects do not write to Supabase until you save them."
              action={
                <WorkspaceEmptyStateAction asChild>
                  <Link to="/editor">Open editor</Link>
                </WorkspaceEmptyStateAction>
              }
            />

            <section
              className="vish-crafted-card rounded-card-lg border border-border bg-card/95 p-4 shadow-sm tablet:p-5"
              aria-labelledby="demo-projects-title"
            >
              <div className="flex flex-col gap-2 border-b border-border/70 pb-4 tablet:flex-row tablet:items-end tablet:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">Demo-safe walkthroughs</p>
                  <h2 id="demo-projects-title" className="mt-1 text-lg font-semibold text-foreground">
                    Start with a ready blueprint
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    These local fixtures give reviewers something real to open, inspect in 2D/3D, and export without needing cloud data first.
                  </p>
                </div>
                <Button asChild variant="outline" className="touch-target self-start tablet:self-auto">
                  <Link to="/features">View guided tours</Link>
                </Button>
              </div>

              <div className="mt-4 grid gap-3 tablet:grid-cols-3">
                {demoSamples.map(({ sample, eyebrow, stats, badges }) => (
                  <article
                    key={sample.id}
                    className="rounded-xl border border-border bg-background/85 p-4 shadow-sm"
                    data-testid={`projects-demo-${sample.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
                        <h3 className="mt-1 truncate text-sm font-semibold text-foreground">{sample.name}</h3>
                      </div>
                    </div>
                    <p className="mt-3 min-h-[3rem] text-xs leading-5 text-muted-foreground">{sample.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                        {stats.walls} walls
                      </span>
                      <span className="rounded-full border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                        {stats.openings} openings
                      </span>
                      {badges.slice(0, 2).map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                    <Button
                      type="button"
                      className="mt-4 w-full touch-target"
                      onClick={() => openDemoSample(sample.id)}
                      data-testid={`projects-open-demo-${sample.id}`}
                    >
                      Open demo in editor
                    </Button>
                  </article>
                ))}
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Demo fixtures are generated in-browser from existing sample builders. They are for walkthroughs, screenshots, and pilot demos — not user cloud records until saved.
              </p>
            </section>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            <PageToolbar className="mt-2">
              <Input
                placeholder="Search projects…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs touch-target"
                aria-label="Search projects"
                data-tutorial="projects-search"
              />
              <Button
                variant={showArchived ? 'default' : 'outline'}
                size="sm"
                className="touch-target"
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived ? 'Hide archived' : 'Show archived'}
              </Button>
            </PageToolbar>
            <div className="vish-projects-grid mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-tutorial="projects-grid">
              {filteredProjects.map((project) => {
                const isDraft = project.id.startsWith('local-draft-');
                const thumb = projectThumbnailDataUrl(project.manifest);
                return (
                  <article
                    key={project.id}
                    className="vish-project-card vish-project-card-v2 vish-crafted-card flex flex-col overflow-hidden rounded-card-lg border border-border bg-card/70 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="vish-frame-bezel relative aspect-[16/10] border-b border-border/60 bg-muted/30">
                      {thumb ? (
                        <img src={thumb} alt="" className="h-full w-full object-contain p-4" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                          <PenTool className="h-8 w-8 opacity-40" />
                          <span className="text-xs">Empty plan</span>
                        </div>
                      )}
                      {isDraft && (
                        <span className="absolute left-3 top-3 rounded-full border border-primary/30 bg-background/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="truncate font-semibold text-foreground">{project.name}</h2>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 shrink-0 touch-target" aria-label={`More actions for ${project.name}`}>
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
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {project.manifest.walls.length} walls · {project.manifest.openings.length} openings
                      </p>
                      <div className="mt-auto pt-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(project.updated_at)}
                            {!backendStatus.isConfigured && ' · Local'}
                          </span>
                          <Button size="sm" className="h-8 px-4" onClick={() => openProject(project)}>
                            Open
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

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
    </>
  );
}
