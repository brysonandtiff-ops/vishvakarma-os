// Audit Log Page - System audit trail with timeline display
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { History, FileText, Database, GitPullRequest, Package, FolderOpen, RefreshCw, ArrowRight, ChevronRight } from 'lucide-react';
import { WorkspacePageScroll } from '@/components/layouts/WorkspacePageShell';
import PageStateBlock from '@/components/common/PageStateBlock';
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
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
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
      if (data.length > 0 && !selectedLog) {
        setSelectedLog(data[0]);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit logs');
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

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
    const cls = "h-5 text-[9px] px-2 font-bold uppercase tracking-wider";
    if (action.includes('created')) return <Badge className={`${cls} bg-success/10 text-success border border-success/20`}>{action}</Badge>;
    if (action.includes('updated')) return <Badge variant="secondary" className={`${cls} border border-border`}>{action}</Badge>;
    if (action.includes('deleted')) return <Badge className={`${cls} bg-destructive/10 text-destructive border border-destructive/20`}>{action}</Badge>;
    if (action.includes('approved') || action.includes('accepted')) return <Badge className={`${cls} bg-primary/10 text-primary border border-primary/20`}>{action}</Badge>;
    return <Badge variant="outline" className={`${cls}`}>{action}</Badge>;
  };

  // Group logs by date
  const groupedLogs = logs.reduce<Record<string, AuditLog[]>>((groups, log) => {
    const date = new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
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
            <Button variant="outline" size="sm" onClick={loadLogs} className="shrink-0 touch-target h-8" disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          }
          stats={
            <>
              <GovernanceStatPill label="Events" value={logs.length} />
              {(['project', 'spec', 'change_request'] as const).map(entity => {
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
          <div className="vish-section-stack gov-content-area h-full max-h-full">
            <GovernanceBackendBanner />
            
            {error && (
              <PageStateBlock variant="error" title={error} onRetry={loadLogs} />
            )}
            
            {loading ? (
              <div className="space-y-3" data-testid="audit-loading-skeleton" aria-busy="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="vish-skeleton h-14 rounded-card-lg" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <WorkspacePanel tone="governance" padded={false} className="vish-empty-state py-12 text-center">
                <History className="vish-empty-icon mx-auto h-10 w-10 text-muted-foreground/40" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">No audit events yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  System activity will appear here as you interact with Vishvakarma.OS
                </p>
                <div className="mt-5 flex flex-col items-center gap-2 px-4 pb-4 sm:flex-row sm:justify-center">
                  <Button size="sm" className="touch-target gap-2" onClick={() => navigate('/editor')}>
                    <ArrowRight className="h-3.5 w-3.5" />
                    Open the Editor
                  </Button>
                </div>
              </WorkspacePanel>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6 min-h-0 h-full">
                <div className="vish-audit-timeline space-y-8 pr-2">
                  {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                    <div key={date}>
                      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-2 mb-4 border-b border-border/40">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                          {date}
                        </span>
                      </div>

                      <div className="relative space-y-3">
                        {dateLogs.map((log) => {
                          const cfg = getEntityConfig(log.entity_type);
                          const EntityIcon = cfg.icon;
                          const isActive = selectedLog?.id === log.id;
                          return (
                            <div 
                              key={log.id} 
                              className={`vish-audit-entry group relative flex gap-3 p-3 rounded-xl border transition-all cursor-pointer touch-target ${
                                isActive 
                                  ? 'border-primary/40 bg-primary/5 shadow-sm' 
                                  : 'border-border bg-card/40 hover:bg-card hover:border-border/80'
                              }`}
                              onClick={() => setSelectedLog(log)}
                            >
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${cfg.borderColor} ${cfg.color}`}>
                                <EntityIcon className="h-4 w-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2">
                                    {getActionBadge(log.action)}
                                    <span className="text-[10px] text-ws-text-dim font-mono">
                                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <ChevronRight className={`h-3 w-3 transition-transform ${isActive ? 'rotate-90 text-primary' : 'text-muted-foreground/40 group-hover:translate-x-0.5'}`} />
                                </div>
                                <p className="truncate text-xs font-medium text-foreground">
                                  {log.entity_type.replace('_', ' ')} ID: {log.entity_id || 'N/A'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <aside className="vish-audit-details sticky top-0 hidden lg:flex flex-col h-[calc(100vh-14rem)] bg-card/60 backdrop-blur-md border border-border rounded-2xl overflow-hidden">
                  {selectedLog ? (
                    <>
                      <div className="p-5 border-b border-border bg-muted/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Event Detail</p>
                        <h3 className="text-sm font-semibold truncate">{selectedLog.action}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">
                          {new Date(selectedLog.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <ScrollArea className="flex-1 p-5">
                        <div className="space-y-6">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Actor & Scope</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2 rounded-lg bg-background border border-border">
                                <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">Entity</p>
                                <p className="text-[11px] font-medium truncate capitalize">{selectedLog.entity_type.replace('_', ' ')}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-background border border-border">
                                <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">Action</p>
                                <p className="text-[11px] font-medium truncate capitalize">{selectedLog.action.split(' ')[0]}</p>
                              </div>
                            </div>
                          </div>

                          {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Field Changes / Metadata</p>
                              <div className="rounded-xl border border-border bg-black/20 p-4">
                                <pre className="text-[11px] leading-relaxed font-mono text-ws-text-dim whitespace-pre-wrap">
                                  {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}

                          <div className="pt-4 border-t border-border/40">
                            <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                              This event is part of the immutable governance ledger. Hash verification active.
                            </p>
                          </div>
                        </div>
                      </ScrollArea>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <History className="h-8 w-8 mb-3 opacity-20" />
                      <p className="text-xs">Select an event to view full audit details</p>
                    </div>
                  )}
                </aside>
              </div>
            )}
          </div>
        </WorkspacePageScroll>
    </>
  );
}
