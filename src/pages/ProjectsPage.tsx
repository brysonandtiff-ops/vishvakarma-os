import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, FolderOpen, MoreHorizontal, PenTool, Plus, FolderDown, Bot } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
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
import { openManifestInEditor, type EditorManifestView } from '@/editor/openManifestInEditor';
import { projectThumbnailDataUrl } from '@/utils/projectThumbnail';
import { toast } from 'sonner';
import { VishCard, VishStatusBadge } from '@/components/common/vish-primitives';
import { DreamHomeJourney } from '@/components/projects/DreamHomeJourney';

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
  const [showAllProjects, setShowAllProjects] = useState(false);

  const demoSamples = useMemo(
    () =>
      getSamplesForSurface('projects-demo').map((sample) => ({
        sample,
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

  const openDemoSample = (sampleId: string, view?: EditorManifestView) => {
    try {
      const manifest = resolveSampleManifestSync(sampleId);
      openManifestInEditor(navigate, manifest, { source: 'sample', view });
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

  const hasProjectFilters = Boolean(searchQuery.trim()) || showArchived;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-24 tablet:gap-8" data-testid="projects-page">
      <PageMeta title="Projects — Vishvakarma.OS" description="Open, create, or import architectural projects in Studio." />

      <WorkspacePageHeader
        title="Projects"
        variant="fullBleed"
        animate={false}
        actions={<div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap" role="group" aria-label="Project actions">
          <Button className="min-h-[44px] px-3" asChild>
            <Link to="/editor" state={{ openIntent: 'newProject' }}>
              <Plus aria-hidden="true" /> New project
            </Link>
          </Button>
          <Button type="button" variant="outline" className="min-h-[44px] px-3" data-testid="dashboard-open-project" onClick={() => navigate('/editor', { state: { openIntent: 'openProject' } })}>
            <FolderOpen aria-hidden="true" /> Open project
          </Button>
          <Button type="button" variant="outline" className="min-h-[44px] px-3" data-testid="dashboard-import-files" onClick={() => navigate('/editor', { state: { openIntent: 'import' } })}>
            <FolderDown aria-hidden="true" /> Import files
          </Button>
          <Button type="button" variant="outline" className="min-h-[44px] px-3" data-testid="dashboard-ai-copilot" onClick={() => navigate('/editor', { state: { openIntent: 'aiDesigner' } })}>
            <Bot aria-hidden="true" /> AI Copilot
          </Button>
        </div>}
      />

      <section id="recent-projects" aria-labelledby="recent-projects-title" tabIndex={-1} className="flex flex-col gap-4 scroll-mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
           <h2 id="recent-projects-title" className="text-xl font-semibold text-foreground">Saved projects</h2>
           {filteredProjects.length > 8 && (
              <button type="button" className="min-h-11 px-3 text-xs text-primary hover:underline uppercase tracking-widest font-semibold" onClick={() => setShowAllProjects((value) => !value)}>
                {showAllProjects ? 'Show fewer' : 'Show all projects'}
              </button>
            )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="vish-project-search" className="sr-only">Search projects</label>
          <input id="vish-project-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search projects" className="min-h-11 min-w-0 flex-1 rounded-xl border border-primary/30 bg-card px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
          <label className="inline-flex min-h-11 items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="h-4 w-4 accent-[#d8a644]" /> Include archived
          </label>
        </div>
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-700/50 px-3 py-2 text-sm text-amber-200">
            <p role="status">Projects could not load. {error}</p>
            <Button type="button" className="min-h-[44px]" variant="outline" onClick={() => void loadProjects()}>Retry</Button>
          </div>
        )}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="projects-loading-skeleton" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-[14px] bg-vish-navy-800/50 animate-pulse border border-vish-navy-700" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.slice(0, showAllProjects ? filteredProjects.length : 8).map((project) => {
                const isDraft = project.id.startsWith('local-draft-');
                const thumb = projectThumbnailDataUrl(project.manifest);
                return (
                  <VishCard key={project.id} className="flex flex-col transition-colors hover:border-primary/40">
                    <div className="relative aspect-[16/10] bg-vish-navy-900 border-b border-vish-navy-700/50 flex items-center justify-center overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-contain p-4" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-vish-text-400">
                          <PenTool className="w-8 h-8 opacity-40" />
                          <span className="text-xs uppercase tracking-widest">Empty Plan</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                         <VishStatusBadge status={isDraft ? "neutral" : "info"}>
                           {isDraft ? "Draft" : "Saved"}
                         </VishStatusBadge>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate">{project.name}</h3>
                          <p className="text-xs text-vish-text-400 mt-1 uppercase tracking-widest">{project.manifest.walls.length} Walls • {project.manifest.openings.length} Openings</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label={`Actions for ${project.name}`} className="relative z-10 h-11 w-11 shrink-0 text-vish-text-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-vish-navy-800 border-vish-navy-600 text-white">
                            <DropdownMenuItem onClick={() => duplicateProject(project)}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void toggleArchive(project)}>
                              {isProjectArchived(project) ? 'Restore' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
                              disabled={deletingId === project.id}
                              onClick={() => setPendingDelete(project)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 pt-2">
                         <span className="text-xs text-vish-text-400">{formatRelativeTime(project.updated_at)}</span>
                         <button type="button" aria-label={`Open ${project.name}`} onClick={() => openProject(project)} className="min-h-11 text-sm font-semibold text-primary after:absolute after:inset-0 hover:underline focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary">
                           Open project <span aria-hidden="true">&rarr;</span>
                         </button>
                      </div>
                    </div>
                  </VishCard>
                );
              })}
           </div>
        ) : !error && (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border bg-card/40 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <FolderOpen aria-hidden="true" className="size-7 shrink-0 text-primary" />
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">No projects found</h3>
              <p className="text-sm text-muted-foreground">
                {hasProjectFilters ? 'Try a different search or clear the filters.' : 'Create a new project to start designing, or import an existing floor plan.'}
              </p>
            </div>
            {hasProjectFilters ? (
              <Button type="button" className="col-start-2 min-h-[44px] justify-self-start sm:col-start-3" variant="outline" onClick={() => { setSearchQuery(''); setShowArchived(false); }}>Clear filters</Button>
            ) : (
              <Button className="col-start-2 min-h-[44px] justify-self-start sm:col-start-3" variant="outline" asChild>
                <Link to="/editor" state={{ openIntent: 'newProject' }}>Create new project</Link>
              </Button>
            )}
          </div>
        )}
      </section>

      <DreamHomeJourney onOpenSample={(view) => openDemoSample('six-three-atrium-wing', view)} />

      {/* Verified local demo fixtures. Demo fixtures are generated in-browser from the versioned sample catalog. */}
      <section aria-labelledby="demo-fixtures-heading">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 id="demo-fixtures-heading" className="text-xl font-semibold text-foreground">Sample projects</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {demoSamples.map(({ sample, stats, badges }) => (
            <VishCard key={sample.id} className="group overflow-hidden" data-testid={`projects-demo-${sample.id}`}>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">{sample.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-vish-text-300">{sample.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-vish-text-400">
                  <span>{stats.walls} walls</span>
                  <span>{stats.openings} openings</span>
                  {badges.map((badge) => <span key={badge} className="text-vish-gold-400">{badge}</span>)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" className="min-h-[44px] grow" onClick={() => openDemoSample(sample.id)}>Open in editor</Button>
                  <Button type="button" variant="outline" className="min-h-[44px]" aria-label={`View ${sample.name} in 3D`} onClick={() => openDemoSample(sample.id, 'orbit')}>
                    <Box aria-hidden="true" /> 3D
                  </Button>
                </div>
              </div>
            </VishCard>
          ))}
        </div>
      </section>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="bg-vish-navy-900 border border-vish-navy-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription className="text-vish-text-300">
              {pendingDelete
                ? `"${pendingDelete.name}" will be permanently removed. This cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-vish-navy-800 border-vish-navy-600 text-white hover:bg-vish-navy-700 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-500"
              onClick={(e) => { e.stopPropagation(); void handleDeleteConfirmed(); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
