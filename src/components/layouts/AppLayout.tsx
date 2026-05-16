// Main application layout with sidebar navigation
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  PenTool,
  FileText,
  Database,
  GitPullRequest,
  Package,
  History,
  Menu,
  Cpu,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const editorNav = [
  { name: 'Blueprint Editor', path: '/', icon: PenTool },
];

const governanceNav = [
  { name: 'Spec Center', path: '/spec-center', icon: FileText },
  { name: 'Registry', path: '/registry', icon: Database },
  { name: 'Change Requests', path: '/change-requests', icon: GitPullRequest },
  { name: 'Release Center', path: '/releases', icon: Package },
];

const systemNav = [
  { name: 'Audit Log', path: '/audit', icon: History },
];

function NavSection({
  label,
  items,
  currentPath,
  onNavigate,
}: {
  label: string;
  items: { name: string; path: string; icon: React.ElementType }[];
  currentPath: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mb-2">
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
        {label}
      </p>
      {items.map((item) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;
        return (
          <Link key={item.path} to={item.path} onClick={onNavigate}>
            <div
              className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                }`}
              />
              <span className="min-w-0 truncate">{item.name}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-sidebar-primary-foreground/60" />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary shadow-sm">
          <Cpu className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
            Vishvakarma.OS
          </h1>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="h-4 border-sidebar-primary/40 px-1.5 text-[9px] text-sidebar-primary"
            >
              v1.0.0
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-3">
          <NavSection
            label="Editor"
            items={editorNav}
            currentPath={location.pathname}
            onNavigate={onNavigate}
          />
          <NavSection
            label="Governance"
            items={governanceNav}
            currentPath={location.pathname}
            onNavigate={onNavigate}
          />
          <NavSection
            label="System"
            items={systemNav}
            currentPath={location.pathname}
            onNavigate={onNavigate}
          />
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="status-dot bg-success" />
          <p className="text-[11px] text-sidebar-foreground/50">Governance active</p>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-40 h-10 w-10 rounded-lg border border-border bg-card shadow-sm lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 bg-sidebar">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
