// Main application layout with sidebar navigation — professional workstation style
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import {
  PenTool,
  FileText,
  Database,
  GitPullRequest,
  Package,
  History,
  Menu,
  LogOut,
  ShieldCheck,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen,
  User,
  UserCircle,
  Trophy,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCallback, useEffect, useState, createContext, useContext } from 'react';
import { WorkspaceCommandPalette, OPEN_COMMAND_PALETTE_EVENT } from '@/components/workspace/WorkspaceCommandPalette';
import { WorkspaceNotifications } from '@/components/workspace/WorkspaceNotifications';
import { loadWorkspacePrefs, saveWorkspacePrefs } from '@/components/workspace/workspaceMemory';
import { getCommandPaletteShortcutLabel } from '@/utils/commandPaletteShortcut';
import '@/styles/vish-workspace-shell.css';

function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
}

interface AppLayoutProps {
  children: React.ReactNode;
  immersive?: boolean;
}

const GovernanceNavContext = createContext<{ openNav: () => void }>({ openNav: () => {} });

export function useGovernanceNav() {
  return useContext(GovernanceNavContext);
}

const allNav = [
  { name: 'Blueprint Editor', path: '/editor', icon: PenTool, group: 'EDITOR' },
  { name: 'Projects', path: '/projects', icon: FolderOpen, group: 'EDITOR' },
  { name: 'Profile', path: '/profile', icon: User, group: 'EDITOR' },
  { name: 'Spec Center',      path: '/spec-center',      icon: FileText,       group: 'GOVERNANCE' },
  { name: 'Registry',         path: '/registry',         icon: Database,       group: 'GOVERNANCE' },
  { name: 'Change Requests',  path: '/change-requests',  icon: GitPullRequest, group: 'GOVERNANCE' },
  { name: 'Release Center',   path: '/releases',         icon: Package,        group: 'GOVERNANCE' },
  { name: 'World Records',    path: '/world-records',    icon: Trophy,         group: 'GOVERNANCE' },
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
          group flex h-10 items-center rounded-xl transition-all duration-150 tap-highlight-none
          ${collapsed ? 'w-10 justify-center mx-auto' : 'gap-2.5 px-2.5'}
          ${isActive
            ? 'vish-shell-nav-active text-ws-active border border-ws-active/35'
            : 'text-ws-text-dim hover:bg-ws-hover hover:text-ws-text border border-transparent'}
        `}
      >
        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
        {!collapsed && (
          <span className="min-w-0 truncate text-xs font-medium">{item.name}</span>
        )}
        {!collapsed && isActive && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-ws-active shadow-[0_0_14px_hsl(39_90%_62%/0.75)]" />
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
  const navigate = useNavigate();
  const { user, profile, mode, signOut } = useAuth();
  const groups = ['EDITOR', 'GOVERNANCE', 'SYSTEM'] as const;
  const groupLabels: Record<string, string> = {
    EDITOR: 'Editor',
    GOVERNANCE: 'Governance',
    SYSTEM: 'System',
  };
  const accountLabel = profile?.full_name || user?.email || 'Local User';
  const paletteShortcut = getCommandPaletteShortcutLabel();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
    onNavigate?.();
  };

  return (
    <TooltipProvider delayDuration={500}>
      <div className="vish-workspace-sidebar flex h-full flex-col bg-ws-sidebar">
        <div
          className={`vish-shell-brand flex shrink-0 items-center border-b border-ws-border ${
            collapsed ? 'h-16 justify-center' : 'h-20 gap-3 px-3'
          }`}
        >
          <div className="vish-logo-tile vish-shell-logo flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl p-1">
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS official user-supplied logo" className="h-full w-full rounded-xl object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="vish-wordmark truncate text-[11px] font-bold tracking-[0.28em]">
                VISHVAKARMA.OS
              </p>
              <p className="font-technical text-[9px] uppercase tracking-[0.22em] text-ws-text-faint">विश्वकर्मा · Divine Architecture</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[8px] uppercase tracking-[0.18em] text-primary/85">
                <ShieldCheck className="h-3 w-3" />
                Governance locked
              </div>
            </div>
          )}
        </div>

        <div className={`shrink-0 ${collapsed ? 'px-1.5 pt-2' : 'px-2 pt-3'}`}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={openCommandPalette}
                  className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl border border-ws-border text-ws-text-dim hover:bg-ws-hover hover:text-ws-text"
                  aria-label="Open command palette"
                >
                  <Search className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6} className="text-xs">
                Command palette · {paletteShortcut}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={openCommandPalette}
              className="vish-shell-command flex h-10 w-full items-center gap-2.5 rounded-xl border border-ws-border bg-ws-toolbar/60 px-2.5 text-ws-text-dim transition-colors hover:bg-ws-hover hover:text-ws-text"
              aria-label="Open command palette"
            >
              <Search className="h-4 w-4 shrink-0 opacity-70" />
              <span className="min-w-0 truncate text-xs">Search workspace…</span>
              <kbd className="ml-auto rounded border border-ws-border bg-ws-sidebar px-1.5 py-0.5 text-[9px] font-medium tracking-widest text-ws-text-faint">
                {paletteShortcut}
              </kbd>
            </button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <nav className={`py-3 ${collapsed ? 'px-1.5 space-y-1' : 'px-2 space-y-4'}`}>
            {groups.map((group) => {
              const items = allNav.filter((n) => n.group === group);
              return (
                <div key={group} className={collapsed ? 'space-y-1' : 'space-y-1'}>
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

        <div className={`shrink-0 border-t border-ws-border ${collapsed ? 'p-1.5' : 'px-3 py-3'}`}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex h-8 w-8 mx-auto items-center justify-center rounded-xl text-ws-text-faint hover:bg-ws-hover hover:text-ws-text"
                  aria-label="Sign out"
                >
                  <UserCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6} className="text-xs">
                {accountLabel}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_10px_hsl(142_60%_45%/0.75)]" />
                <p className="text-[10px] text-ws-text-dim">Governance active · {mode}</p>
              </div>
              <div className="vish-shell-account flex items-center justify-between gap-2 rounded-xl border border-ws-border bg-ws-toolbar/60 px-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium text-ws-text">{accountLabel}</p>
                  <p className="text-[9px] text-ws-text-faint">Protected workspace</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-7 w-7 shrink-0 text-ws-text-faint hover:text-ws-text"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function AppLayout({ children, immersive = false }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => loadWorkspacePrefs());

  useEffect(() => {
    saveWorkspacePrefs(prefs);
  }, [prefs]);

  const toggleCollapsed = useCallback(() => setPrefs(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed })), []);
  const collapsed = prefs.sidebarCollapsed;
  const openNav = useCallback(() => {
    setMobileOpen(true);
  }, []);

  return (
    <GovernanceNavContext.Provider value={{ openNav }}>
    <div className="vish-workspace-shell flex min-h-screen w-full bg-background" data-density={prefs.density} data-immersive={immersive ? 'true' : undefined}>
      <WorkspaceCommandPalette />
      {!immersive && (
      <aside
        className={`relative hidden shrink-0 border-r border-ws-border lg:block ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-4 top-20 z-10 hidden h-8 w-8 items-center justify-center rounded-full border border-ws-border bg-ws-toolbar text-ws-text-dim shadow-lg hover:bg-ws-hover hover:text-ws-text lg:flex tap-highlight-none transition-all duration-200"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </aside>
      )}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        {!immersive && (
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="vish-mobile-nav-fab fixed left-4 bottom-4 z-40 h-12 w-12 min-h-[44px] min-w-[44px] rounded-full border border-ws-border bg-ws-sidebar text-ws-text shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-ws-hover lg:hidden touch-target"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        )}
        <SheetContent side="left" className="w-72 p-0 border-r-0 bg-ws-sidebar">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <WorkspaceNotifications />
        <div
          className={
            immersive
              ? 'vish-immersive-page flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'vish-governance-page min-h-0 flex-1 overflow-x-hidden overflow-y-auto'
          }
        >
          {children}
        </div>
      </main>
    </div>
    </GovernanceNavContext.Provider>
  );
}
