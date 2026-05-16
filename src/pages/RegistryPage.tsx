// Registry Center Page - Component and feature registry
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Database, Wrench, Box, Layers } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { getRegistryEntries, createRegistryEntry } from '@/db/api';
import type { RegistryEntry } from '@/types';

export default function RegistryPage() {
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await getRegistryEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load registry:', error);
      toast.error('Failed to load registry entries');
    }
  };

  const types = ['all', 'component', 'feature', 'tool'];

  const filteredEntries =
    selectedType === 'all' ? entries : entries.filter((entry) => entry.type === selectedType);

  const typeCounts = {
    component: entries.filter(e => e.type === 'component').length,
    feature: entries.filter(e => e.type === 'feature').length,
    tool: entries.filter(e => e.type === 'tool').length,
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'component': return { icon: Box, label: 'Component', className: 'bg-primary/10 text-primary border-primary/20' };
      case 'feature': return { icon: Database, label: 'Feature', className: 'bg-success/10 text-success border-success/20' };
      case 'tool': return { icon: Wrench, label: 'Tool', className: 'bg-warning/10 text-warning border-warning/20' };
      default: return { icon: Layers, label: type, className: 'bg-muted text-muted-foreground border-border' };
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-border bg-card px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground text-balance">Registry Center</h1>
              <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                Component and feature registry — track every system element
              </p>
            </div>
            <NewRegistryDialog onEntryCreated={loadEntries} />
          </div>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-3">
            {([
              { label: 'Total', count: entries.length, color: 'text-foreground' },
              { label: 'Components', count: typeCounts.component, color: 'text-primary' },
              { label: 'Features', count: typeCounts.feature, color: 'text-success' },
              { label: 'Tools', count: typeCounts.tool, color: 'text-warning' },
            ] as const).map(stat => (
              <div key={stat.label} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <span className={`text-base font-bold ${stat.color}`}>{stat.count}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList className="mb-6">
                {types.map((type) => (
                  <TabsTrigger key={type} value={type} className="capitalize">
                    {type}
                    {type !== 'all' && typeCounts[type as keyof typeof typeCounts] > 0 && (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {typeCounts[type as keyof typeof typeCounts]}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedType}>
                {filteredEntries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
                    <Database className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <h3 className="mt-3 text-sm font-semibold text-foreground">No registry entries</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedType === 'all'
                        ? 'Register your first component or feature to begin tracking'
                        : `No ${selectedType}s registered yet`}
                    </p>
                    {selectedType === 'all' && (
                      <div className="mt-4">
                        <NewRegistryDialog onEntryCreated={loadEntries} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEntries.map((entry) => {
                      const cfg = getTypeConfig(entry.type);
                      const Icon = cfg.icon;
                      return (
                        <Card key={entry.id} className="h-full flex flex-col border-border shadow-sm transition-shadow hover:shadow-md">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <CardTitle className="truncate text-sm text-balance">{entry.name}</CardTitle>
                                  <CardDescription className="mt-0.5 text-xs capitalize">{entry.type}</CardDescription>
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${cfg.className}`}>
                                  {cfg.label}
                                </span>
                                <Badge
                                  variant={entry.status === 'active' ? 'default' : 'secondary'}
                                  className="text-[10px]"
                                >
                                  {entry.status}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1 pt-0">
                            <p className="mb-3 text-sm text-pretty text-muted-foreground">
                              {entry.description || 'No description provided'}
                            </p>
                            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                              <div className="mb-3 rounded-md bg-muted/50 p-2">
                                <pre className="text-xs text-muted-foreground">
                                  {JSON.stringify(entry.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            <p className="font-mono text-[10px] text-muted-foreground/60">
                              Registered {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}

function NewRegistryDialog({ onEntryCreated }: { onEntryCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'component' | 'feature' | 'tool'>('component');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'deprecated'>('active');

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      await createRegistryEntry({ name, type, description: description || undefined, metadata: {}, status });
      toast.success('Registry entry created successfully');
      setOpen(false);
      setName('');
      setType('component');
      setDescription('');
      setStatus('active');
      onEntryCreated();
    } catch (error) {
      console.error('Failed to create registry entry:', error);
      toast.error('Failed to create registry entry');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shrink-0 touch-target">
          <Plus className="mr-2 h-4 w-4" />
          Register Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register New Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Name</Label>
            <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Entry name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reg-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger id="reg-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="component">Component</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger id="reg-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="reg-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this entry" rows={3} />
          </div>
          <Button onClick={handleCreate} className="w-full">Register Entry</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
