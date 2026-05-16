// Main application layout with sidebar navigation — professional workstation style
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  PenTool,
  FileText,
  Database,
  GitPullRequest,
  Package,
  History,
  Menu,
  Layers,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const allNav = [
  { name: 'Blueprint Editor', path: '/', icon: PenTool, group: 'EDITOR' },
  { name: 'Spec Center',      path: '/spec-center',      icon: FileText,       group: 'GOVERNANCE' },
  { name: 'Registry',         path: '/registry',         icon: Database,       group: 'GOVERNANCE' },
  { name: 'Change Requests',  path: '/change-requests',  icon: GitPullRequest, group: 'GOVERNANCE' },
  { name: 'Release Center',   path: '/releases',         icon: Package,        group: 'GOVERNANCE' },
  { name: 'Audit Log',        path: '/audit',            icon: History,        group: 'SYSTEM' },
];

function NavItem({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: typeof allNav[0];
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const content = (
    <Link to={item.path} onClick={onClick}>
      <div
        className={`
          group flex h-9 items-center rounded-md transition-all duration-100
          ${collapsed ? 'w-9 justify-center mx-auto' : 'gap-2.5 px-2.5'}
          ${isActive
            ? 'bg-ws-active-bg text-ws-active border border-ws-active/30'
            : 'text-ws-text-dim hover:bg-ws-hover hover:text-ws-text border border-transparent'}
        `}
      >
        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
        {!collapsed && (
          <span className="min-w-0 truncate text-xs font-medium">{item.name}</span>
        )}
        {!collapsed && isActive && (
          <span className="ml-auto h-1 w-1 shrink-0 rounded-full bg-ws-active" />
        )}
      </div>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={6} className="text-xs">
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function SidebarContent({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const groups = ['EDITOR', 'GOVERNANCE', 'SYSTEM'] as const;
  const groupLabels: Record<string, string> = {
    EDITOR: 'Editor',
    GOVERNANCE: 'Governance',
    SYSTEM: 'System',
  };

  return (
    <TooltipProvider delayDuration={500}>
      <div className="flex h-full flex-col bg-ws-sidebar">
        {/* Brand */}
        <div
          className={`flex shrink-0 items-center border-b border-ws-border ${
            collapsed ? 'h-12 justify-center' : 'h-12 gap-2.5 px-3'
          }`}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-ws-active-bg">
            <Layers className="h-4 w-4 text-ws-active" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold tracking-tight text-ws-text">
                Vishvakarma.OS
              </p>
              <p className="font-technical text-[9px] text-ws-text-faint">v1.0.0</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1">
          <nav className={`py-2 ${collapsed ? 'px-1.5 space-y-0.5' : 'px-2 space-y-3'}`}>
            {groups.map((group) => {
              const items = allNav.filter((n) => n.group === group);
              return (
                <div key={group} className={collapsed ? 'space-y-0.5' : 'space-y-0.5'}>
                  {!collapsed && (
                    <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-ws-text-faint">
                      {groupLabels[group]}
                    </p>
                  )}
                  {collapsed && group !== 'EDITOR' && (
                    <div className="my-1 h-px bg-ws-border" />
                  )}
                  {items.map((item) => (
                    <NavItem
                      key={item.path}
                      item={item}
                      isActive={location.pathname === item.path}
                      collapsed={collapsed}
                      onClick={onNavigate}
                    />
                  ))}
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className={`shrink-0 border-t border-ws-border ${collapsed ? 'p-1.5' : 'px-3 py-2'}`}>
          {collapsed ? (
            <div className="flex h-7 w-7 mx-auto items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-success" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-success" />
              <p className="text-[10px] text-ws-text-faint">Governance active</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar — collapsed icon rail (48px) */}
      <aside className="hidden w-12 shrink-0 border-r border-ws-border lg:block">
        <SidebarContent collapsed />
      </aside>

      {/* Mobile Menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-2 top-2 z-40 h-8 w-8 rounded border border-ws-border bg-ws-toolbar text-ws-text hover:bg-ws-hover lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-52 p-0 border-r-0">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
