// Audit Log Page - System audit trail with timeline display
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { History, FileText, Database, GitPullRequest, Package, FolderOpen, RefreshCw, ArrowRight } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { getAuditLogs } from '@/db/api';
import type { AuditLog } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(200);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
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
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="gov-page-header shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-foreground text-balance">Audit Log</h1>
              <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                Immutable chronological record of all system events
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadLogs} className="shrink-0" disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-baseline gap-1.5 rounded border border-border bg-card px-3 py-1.5 shadow-sm">
              <span className="text-base font-bold tabular-nums text-foreground">{logs.length}</span>
              <span className="text-xs text-muted-foreground">Total Events</span>
            </div>
            {(['project', 'spec', 'registry', 'change_request', 'release'] as const).map(entity => {
              const count = logs.filter(l => l.entity_type === entity).length;
              if (count === 0) return null;
              const cfg = getEntityConfig(entity);
              return (
                <div key={entity} className={`flex items-baseline gap-1.5 rounded border bg-card px-3 py-1.5 shadow-sm ${cfg.borderColor}`}>
                  <span className={`text-base font-bold tabular-nums ${cfg.color.split(' ')[1]}`}>{count}</span>
                  <span className="text-xs capitalize text-muted-foreground">{entity.replace('_', ' ')}</span>
                </div>
              );
            })}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-6 py-6">
            {logs.length === 0 && !loading ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
                <History className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">No audit events yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  System activity will appear here as you interact with Vishvakarma.OS
                </p>
                <div className="mt-5 flex flex-col items-center gap-2">
                  <Button size="sm" className="gap-2" onClick={() => navigate('/')}>
                    <ArrowRight className="h-3.5 w-3.5" />
                    Open the Editor
                  </Button>
                  <p className="text-[11px] text-muted-foreground/60">
                    Create a project, add walls, or submit a change request to seed the log
                  </p>
                </div>
              </div>
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
                            <div className="flex-1 min-w-0 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
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
                                <div className="mt-2 rounded-lg bg-muted/40 p-2">
                                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
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
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
