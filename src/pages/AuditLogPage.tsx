// Audit Log Page - System audit trail with timeline display
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { History, FileText, Database, GitPullRequest, Package, FolderOpen, RefreshCw, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { WorkspacePageScroll } from '@/components/layouts/WorkspacePageShell';
import PageStateBlock from '@/components/common/PageStateBlock';
import PageToolbar from '@/components/common/PageToolbar';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import WorkspacePanel from '@/components/common/WorkspacePanel';
import { GovernanceStatPill } from '@/components/governance/GovernanceStatPill';
import { GovernanceBackendBanner } from '@/components/governance/GovernanceBackendBanner';
import { getAuditLogs } from '@/db/api';
import type { AuditLog } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPayloads, setExpandedPayloads] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs(200);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit logs');
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  function togglePayload(id: string) {
    setExpandedPayloads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const getEntityConfig = (entityType: string) => {
    switch (entityType) {
      case 'project':
        return { icon: FolderOpen, color: 'bg-primary/10 text-primary', borderColor: 'border-primary/20' };
      case 'spec':
        return { icon: FileText, color: 'bg-success/10 text-success', borderColor: 'border-success/20' };
      case 'registry':
        return { icon: Database, color: 'bg-warning/10 text-warning', borderColor: 'border-warning/20' };
      case 'change_request':
        return { icon: GitPullRequest, color: 'bg-info/10 text-info', borderColor: 'border-info/20' };
      case 'release':
        return { icon: Package, color: 'bg-chart-5/10 text-chart-5', borderColor: 'border-chart-5/20' };
      default:
        return { icon: History, color: 'bg-muted text-muted-foreground', borderColor: 'border-border' };
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('created')) return <Badge className="h-5 bg-success/10 text-success border border-success/20 text-[10px] px-2">{action}</Badge>;
    if (action.includes('updated')) return <Badge variant="secondary" className="h-5 text-[10px] px-2">{action}</Badge>;
    if (action.includes('deleted')) return <Badge className="h-5 bg-destructive/10 text-destructive border border-destructive/20 text-[10px] px-2">{action}</Badge>;
    if (action.includes('approved') || action.includes('accepted')) return <Badge className="h-5 bg-primary/10 text-primary border border-primary/20 text-[10px] px-2">{action}</Badge>;
    return <Badge variant="outline" className="h-5 text-[10px] px-2">{action}</Badge>;
  };

  // Group logs by date
  const groupedLogs = logs.reduce<Record<string, AuditLog[]>>((groups, log) => {
    const date = new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
    return groups;
  }, {});

  return (
    <>
        <WorkspacePageHeader
          zone="governance"
          variant="fullBleed"
          eyebrow="Governance"
          title="Audit Log"
          description="Immutable chronological record of all system events"
          actions={
            <Button variant="outline" size="sm" onClick={loadLogs} className="shrink-0 touch-target" disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          }
          stats={
            <>
              <GovernanceStatPill label="Total Events" value={logs.length} />
              {(['project', 'spec', 'registry', 'change_request', 'release'] as const).map(entity => {
                const count = logs.filter(l => l.entity_type === entity).length;
                if (count === 0) return null;
                const cfg = getEntityConfig(entity);
                return (
                  <GovernanceStatPill
                    key={entity}
                    label={entity.replace('_', ' ')}
                    value={count}
                    valueClassName={cfg.color.split(' ')[1]}
                    className={cfg.borderColor}
                  />
                );
              })}
            </>
          }
        />

        <WorkspacePageScroll>
          <div className="vish-section-stack gov-content-area">
            <GovernanceBackendBanner />
            <PageToolbar>
              <Button variant="outline" size="sm" onClick={loadLogs} className="touch-target" disabled={loading}>
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh timeline
              </Button>
            </PageToolbar>
            {error && (
              <PageStateBlock variant="error" title={error} onRetry={loadLogs} />
            )}
            {loading ? (
              <PageStateBlock variant="loading" title="Loading audit timeline…" />
            ) : logs.length === 0 ? (
              <WorkspacePanel tone="governance" padded={false} className="py-12 text-center">
                <History className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">No audit events yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  System activity will appear here as you interact with Vishvakarma.OS
                </p>
                <div className="mt-5 flex flex-col items-center gap-2 px-4 pb-4">
                  <Button size="sm" className="touch-target gap-2" onClick={() => navigate('/editor')}>
                    <ArrowRight className="h-3.5 w-3.5" />
                    Open the Editor
                  </Button>
                  <p className="text-[11px] text-muted-foreground/60">
                    Create a project, add walls, or submit a change request to seed the log
                  </p>
                </div>
              </WorkspacePanel>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                  <div key={date}>
                    {/* Date separator */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                        {date}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Timeline entries */}
                    <div className="relative space-y-0">
                      {/* Vertical line */}
                      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                      {dateLogs.map((log) => {
                        const cfg = getEntityConfig(log.entity_type);
                        const EntityIcon = cfg.icon;
                        return (
                          <div key={log.id} className="relative flex gap-4 pb-4">
                            {/* Icon dot */}
                            <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${cfg.borderColor} ${cfg.color}`}>
                              <EntityIcon className="h-4 w-4" />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1 rounded-card-lg border border-border bg-card px-4 py-3 shadow-sm">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {getActionBadge(log.action)}
                                <Badge variant="outline" className="h-5 text-[10px] px-2 capitalize">
                                  {log.entity_type.replace('_', ' ')}
                                </Badge>
                                <span className="ml-auto font-mono text-[10px] text-muted-foreground/60 shrink-0">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                              </div>

                              {log.entity_id && (
                                <p className="font-mono text-xs text-muted-foreground/70 mb-1">
                                  ID: {log.entity_id}
                                </p>
                              )}

                              {log.details && Object.keys(log.details).length > 0 && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => togglePayload(log.id)}
                                    className="flex items-center gap-1 text-[10px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                                    aria-expanded={expandedPayloads.has(log.id)}
                                  >
                                    {expandedPayloads.has(log.id)
                                      ? <ChevronDown className="h-3 w-3" />
                                      : <ChevronRight className="h-3 w-3" />}
                                    View payload ({Object.keys(log.details).length} field{Object.keys(log.details).length !== 1 ? 's' : ''})
                                  </button>
                                  {expandedPayloads.has(log.id) && (
                                    <div className="mt-1.5 rounded-lg border border-border bg-muted/40 p-2">
                                      <pre className="max-h-48 overflow-y-auto text-xs text-muted-foreground">
                                        {JSON.stringify(log.details, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </WorkspacePageScroll>
    </>
  );
}
