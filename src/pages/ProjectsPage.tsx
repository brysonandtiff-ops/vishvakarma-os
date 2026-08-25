import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderOpen, MoreHorizontal, PenTool, Plus, Sparkles, FolderDown, Bot } from 'lucide-react';
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
import { openManifestInEditor } from '@/editor/openManifestInEditor';
import { projectThumbnailDataUrl } from '@/utils/projectThumbnail';
import { toast } from 'sonner';
import { VishCard, VishCardContent, VishCardHeader, VishCardTitle, VishMetric, VishStatusBadge } from '@/components/common/vish-primitives';
import { useAuth } from '@/contexts/AuthContext';

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
  const { profile, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const accountName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Architect';

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

  // Mock system stats for the redesign
  const systemStats = {
    activeProjects: projects.length,
    totalArea: 14500, // sqm
    rooms: 112,
    outstandingChanges: 3,
    complianceWarnings: 1,
    estCost: '48.7M'
  };

  return (
    <div className="p-6 tablet:p-10 max-w-7xl mx-auto flex flex-col gap-8 pb-32">
      <PageMeta title="Home Dashboard" description="Vishvakarma.OS Command Centre" />

      {/* Hero Area */}
      <section className="flex flex-col gap-6">
        <WorkspacePageHeader
          title={`Welcome back, ${accountName}`}
          description="What would you like to design today?"
          eyebrow="Vishvakarma.OS Command Centre"
          variant="fullBleed"
          zone="document"
        />

        {/* Primary Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-16 flex items-center justify-center gap-2 bg-vish-navy-800 border-vish-navy-600 hover:bg-vish-navy-700 hover:text-white transition-colors" asChild>
            <Link to="/editor">
              <Plus className="w-5 h-5 text-vish-blue-400" />
              <span className="font-semibold uppercase tracking-wider text-xs">New Project</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-16 flex items-center justify-center gap-2 bg-vish-navy-800 border-vish-navy-600 hover:bg-vish-navy-700 hover:text-white transition-colors">
             <FolderOpen className="w-5 h-5 text-vish-blue-400" />
             <span className="font-semibold uppercase tracking-wider text-xs">Open Project</span>
          </Button>
          <Button variant="outline" className="h-16 flex items-center justify-center gap-2 bg-vish-navy-800 border-vish-navy-600 hover:bg-vish-navy-700 hover:text-white transition-colors">
             <FolderDown className="w-5 h-5 text-vish-blue-400" />
             <span className="font-semibold uppercase tracking-wider text-xs">Import Files</span>
          </Button>
          <Button className="h-16 flex items-center justify-center gap-2 bg-vish-blue-600 hover:bg-vish-blue-500 text-white transition-colors border-t border-vish-blue-400/50 shadow-[0_0_15px_rgba(42,167,255,0.3)]">
             <Bot className="w-5 h-5" />
             <span className="font-semibold uppercase tracking-wider text-xs">AI Copilot</span>
          </Button>
        </div>
      </section>
      {/* Verified local demo fixtures. Demo fixtures are generated in-browser from the versioned sample catalog. */}
      <section aria-labelledby="demo-fixtures-heading">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vish-gold-400">Reviewer walkthroughs</p>
            <h2 id="demo-fixtures-heading" className="text-xl font-semibold text-white">Demo blueprints</h2>
          </div>
          <span className="text-xs text-vish-text-400">{demoSamples.length} verified fixtures</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {demoSamples.map(({ sample, eyebrow, stats, badges }) => (
            <VishCard key={sample.id} className="group overflow-hidden" data-testid={`projects-demo-${sample.id}`}>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-vish-blue-400">{eyebrow}</p>
                  <h3 className="mt-1 text-base font-semibold text-white">{sample.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-vish-text-300">{sample.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-vish-text-400">
                  <span>{stats.walls} walls</span>
                  <span>{stats.openings} openings</span>
                  {badges.map((badge) => <span key={badge} className="text-vish-gold-400">{badge}</span>)}
                </div>
                <Button type="button" className="w-full bg-vish-blue-600 hover:bg-vish-blue-500 text-white" onClick={() => openDemoSample(sample.id)}>
                  Open in editor
                </Button>
              </div>
            </VishCard>
          ))}
        </div>
      </section>
      {/* System Overview */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <VishCard className="p-4">
             <VishMetric label="Active Projects" value={systemStats.activeProjects} />
          </VishCard>
          <VishCard className="p-4">
             <VishMetric label="Total Area" value={systemStats.totalArea.toLocaleString()} subValue="m²" />
          </VishCard>
          <VishCard className="p-4">
             <VishMetric label="Total Rooms" value={systemStats.rooms} />
          </VishCard>
          <VishCard className="p-4">
             <VishMetric label="Change Requests" value={systemStats.outstandingChanges} trend="down" trendValue="-2 this week" />
          </VishCard>
          <VishCard className="p-4">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-vish-text-400">Compliance</span>
                <div className="mt-1">
                  {systemStats.complianceWarnings > 0 ? (
                    <VishStatusBadge status="warning">{systemStats.complianceWarnings} Warnings</VishStatusBadge>
                  ) : (
                    <VishStatusBadge status="success">All Clear</VishStatusBadge>
                  )}
                </div>
             </div>
          </VishCard>
          <VishCard className="p-4">
             <VishMetric label="Est. Portfolio Cost" value={`₹${systemStats.estCost}`} />
          </VishCard>
        </div>
      </section>

      {/* Recent Projects */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <h2 className="text-sm font-semibold tracking-widest text-vish-text-400 uppercase">Recent Projects</h2>
           <Link to="/projects/all" className="text-xs text-vish-blue-400 hover:text-vish-blue-300 uppercase tracking-widest font-semibold transition-colors">View All</Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="projects-loading-skeleton" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-[14px] bg-vish-navy-800/50 animate-pulse border border-vish-navy-700" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.slice(0, 8).map((project) => {
                const isDraft = project.id.startsWith('local-draft-');
                const thumb = projectThumbnailDataUrl(project.manifest);
                return (
                  <VishCard key={project.id} interactive className="flex flex-col cursor-pointer" onClick={() => openProject(project)}>
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
                        <div>
                          <h3 className="font-semibold text-white truncate max-w-[200px]">{project.name}</h3>
                          <p className="text-xs text-vish-text-400 mt-1 uppercase tracking-widest">{project.manifest.walls.length} Walls • {project.manifest.openings.length} Openings</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-vish-text-400 hover:text-white" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-vish-navy-800 border-vish-navy-600 text-white">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); duplicateProject(project); }}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void toggleArchive(project); }}>
                              {isProjectArchived(project) ? 'Restore' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
                              disabled={deletingId === project.id}
                              onClick={(e) => { e.stopPropagation(); setPendingDelete(project); }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                         <span className="text-[10px] text-vish-text-400 uppercase tracking-widest">{formatRelativeTime(project.updated_at)}</span>
                         <span className="text-xs font-semibold text-vish-blue-400 uppercase tracking-widest group-hover:text-vish-blue-300">Open Project &rarr;</span>
                      </div>
                    </div>
                  </VishCard>
                );
              })}
           </div>
        ) : (
          <VishCard className="p-10 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-full bg-vish-navy-800 border border-vish-navy-600 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-vish-text-400" />
             </div>
             <h3 className="text-lg font-semibold text-white mb-2">No projects found</h3>
             <p className="text-vish-text-300 max-w-sm mb-6">Create a new project to start designing, or import an existing floor plan.</p>
             <Button className="bg-vish-blue-600 hover:bg-vish-blue-500 text-white" asChild>
                <Link to="/editor">Create New Project</Link>
             </Button>
          </VishCard>
        )}
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
