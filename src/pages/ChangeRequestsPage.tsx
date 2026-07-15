// Change Requests Page - Structured change management workflow
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, GitPullRequest, Check, X, Clock, AlertTriangle, ArrowUp, Minus, AlertCircle } from 'lucide-react';
import { WorkspacePageScroll } from '@/components/layouts/WorkspacePageShell';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import { GovernanceStatPill } from '@/components/governance/GovernanceStatPill';
import { GovernanceBackendBanner } from '@/components/governance/GovernanceBackendBanner';
import { backendStatus } from '@/backend/backendConfig';
import { getChangeRequests, createChangeRequest, updateChangeRequest } from '@/db/api';
import type { ChangeRequest } from '@/types';

export default function ChangeRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getChangeRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load change requests:', err);
      setError('Failed to load change requests');
      toast.error('Failed to load change requests');
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['all', 'pending', 'approved', 'rejected', 'implemented'];

  const filteredRequests =
    selectedStatus === 'all'
      ? requests
      : requests.filter((req) => req.status === selectedStatus);

  const statusCounts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    implemented: requests.filter(r => r.status === 'implemented').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      approved: { variant: 'default', label: 'Approved' },
      pending: { variant: 'secondary', label: 'Pending' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      implemented: { variant: 'outline', label: 'Implemented' },
    };
    const cfg = map[status] ?? { variant: 'secondary', label: status };
    return <Badge variant={cfg.variant} className="shrink-0 text-xs">{cfg.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
      critical: { className: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertTriangle className="h-3 w-3" />, label: 'Critical' },
      high: { className: 'bg-warning/10 text-warning border-warning/30', icon: <ArrowUp className="h-3 w-3" />, label: 'High' },
      medium: { className: 'bg-muted text-muted-foreground border-border', icon: <Minus className="h-3 w-3" />, label: 'Medium' },
      low: { className: 'bg-muted text-muted-foreground/60 border-border', icon: null, label: 'Low' },
    };
    const cfg = map[priority] ?? map.medium;
    return (
      <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

  const handleApprove = async (id: string) => {
    try {
      await updateChangeRequest(id, { status: 'approved' });
      toast.success('Change request approved');
      loadRequests();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve change request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateChangeRequest(id, { status: 'rejected' });
      toast.success('Change request rejected');
      loadRequests();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject change request');
    }
  };

  const handleImplement = async (id: string) => {
    try {
      await updateChangeRequest(id, { status: 'implemented' });
      toast.success('Change request marked as implemented');
      loadRequests();
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Failed to update change request');
    }
  };

  return (
    <>
        <WorkspacePageHeader
          zone="governance"
          variant="fullBleed"
          eyebrow="Governance"
          title="Change Requests"
          description="Structured change management — no ad-hoc modifications"
          actions={<NewChangeRequestDialog onRequestCreated={loadRequests} />}
          stats={
            <>
              {([
                { label: 'Pending', count: statusCounts.pending, color: 'text-warning' },
                { label: 'Approved', count: statusCounts.approved, color: 'text-success' },
                { label: 'Implemented', count: statusCounts.implemented, color: 'text-primary' },
                { label: 'Rejected', count: statusCounts.rejected, color: 'text-destructive' },
              ] as const).map(stat => (
                <GovernanceStatPill key={stat.label} label={stat.label} value={stat.count} valueClassName={stat.color} />
              ))}
            </>
          }
        />

        <WorkspacePageScroll>
          <div className="vish-section-stack gov-content-area">
            <GovernanceBackendBanner />
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {loading ? (
              <div className="space-y-3" data-testid="change-requests-loading-skeleton" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="vish-skeleton h-20 rounded-xl" />
                ))}
                <p className="sr-only">Loading change requests…</p>
              </div>
            ) : (
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
              <TabsList className="mb-6 flex-wrap">
                {statuses.map((status) => (
                  <TabsTrigger key={status} value={status} className="touch-target min-h-[44px] capitalize">
                    {status}
                    {status !== 'all' && statusCounts[status as keyof typeof statusCounts] > 0 && (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {statusCounts[status as keyof typeof statusCounts]}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedStatus}>
                {filteredRequests.length === 0 ? (
                  <div className="vish-empty-state rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
                    <GitPullRequest className="vish-empty-icon mx-auto h-10 w-10 text-muted-foreground/40" />
                    <h3 className="mt-3 text-sm font-semibold text-foreground">No change requests</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedStatus === 'all'
                        ? 'Submit a change request to propose any modification'
                        : `No ${selectedStatus} requests at this time`}
                    </p>
                    <div className="mt-5 flex flex-col items-center gap-2">
                      {selectedStatus === 'all' ? (
                        <NewChangeRequestDialog onRequestCreated={loadRequests} />
                      ) : (
                        <>
                          <NewChangeRequestDialog onRequestCreated={loadRequests} />
                          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setSelectedStatus('all')}>
                            View all requests
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((request) => (
                      <Card key={request.id} className="border-border shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                <GitPullRequest className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <CardTitle className="text-sm text-balance">{request.title}</CardTitle>
                              </div>
                              <CardDescription className="text-xs">
                                <span className="capitalize">{request.type}</span>
                                {request.requester && <> · {request.requester}</>}
                              </CardDescription>
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                              {getPriorityBadge(request.priority)}
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="mb-3 text-sm text-pretty text-muted-foreground">{request.description}</p>

                          <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="space-y-0.5 font-mono text-[11px] text-muted-foreground/70">
                              <div>Created: {new Date(request.created_at).toLocaleString()}</div>
                              {request.reviewed_at && (
                                <div>Reviewed: {new Date(request.reviewed_at).toLocaleString()}</div>
                              )}
                              {request.implemented_at && (
                                <div>Implemented: {new Date(request.implemented_at).toLocaleString()}</div>
                              )}
                            </div>

                            <div className="flex shrink-0 gap-2">
                              {request.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="default" onClick={() => handleApprove(request.id)} className="touch-target">
                                    <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)} className="touch-target">
                                    <X className="mr-1.5 h-3.5 w-3.5" /> Reject
                                  </Button>
                                </>
                              )}
                              {request.status === 'approved' && (
                                <Button size="sm" variant="outline" onClick={() => handleImplement(request.id)} className="touch-target">
                                  <Clock className="mr-1.5 h-3.5 w-3.5" /> Mark Implemented
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            )}
          </div>
        </WorkspacePageScroll>
    </>
  );
}

function NewChangeRequestDialog({ onRequestCreated }: { onRequestCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'feature' | 'bugfix' | 'enhancement'>('feature');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [requester, setRequester] = useState('');
  const cloudReady = backendStatus.isConfigured;

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    try {
      await createChangeRequest({
        title,
        description,
        type,
        priority,
        status: 'pending',
        requester: requester || undefined,
      });
      toast.success('Change request created successfully');
      setOpen(false);
      setTitle('');
      setDescription('');
      setType('feature');
      setPriority('medium');
      setRequester('');
      onRequestCreated();
    } catch (error) {
      console.error('Failed to create change request:', error);
      toast.error('Failed to create change request');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="shrink-0 touch-target h-11 min-h-[44px]" disabled={!cloudReady} title={cloudReady ? undefined : 'Sign in with Supabase to create change requests — go to Account Access'}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Change Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cr-title">Title</Label>
            <Input id="cr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Change request title" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cr-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger id="cr-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="bugfix">Bug Fix</SelectItem>
                  <SelectItem value="enhancement">Enhancement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger id="cr-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cr-requester">Requester <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="cr-requester" value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cr-description">Description</Label>
            <Textarea id="cr-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of the proposed change" rows={5} />
          </div>
          <Button onClick={handleCreate} className="w-full">Create Change Request</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
