// Main application layout with top command bar — professional workstation style.
// The Vishvakarma.OS shell owns navigation; WorkspacePageHeader remains the shared page-level header for routed workspace pages.
// VISHVAKARMA.OS is the canonical product wordmark.
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { LogOut, Menu, Search, UserRound } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCallback, useEffect, useState, createContext, useContext } from 'react';
import { WorkspaceCommandPalette, OPEN_COMMAND_PALETTE_EVENT } from '@/components/workspace/WorkspaceCommandPalette';
import { WorkspaceNotifications } from '@/components/workspace/WorkspaceNotifications';
import { loadWorkspacePrefs, saveWorkspacePrefs } from '@/components/workspace/workspaceMemory';
import { PrototypeDisclaimerBadge } from '@/components/common/PrototypeDisclaimer';
import { NAV_GROUP_LABELS, NAV_GROUPS, WORKSPACE_NAV, type RouteNavItem } from '@/config/RouteNavConfig';
import { useBilling } from '@/hooks/useBilling';
import { EditorSidebarProvider, useEditorSidebarConfig } from '@/components/editor/EditorSidebarContext';
import EditorSidebarSections from '@/components/editor/EditorSidebarSections';
import { FoundersAcknowledgment } from '@/components/brand/FoundersAcknowledgment';
import '@/styles/vish-workspace-shell.css';
import { VishToolbar } from '@/components/common/vish-primitives';

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

function accountInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  return (label.slice(0, 2) || 'VK').toUpperCase();
}

const topNav = WORKSPACE_NAV.filter((item) => item.showInTopNav);

function WorkspaceNavLink({ item, isActive, onClick }: { item: RouteNavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link to={item.path} onClick={onClick} aria-current={isActive ? 'page' : undefined} className={`vish-workspace-nav-link${isActive ? ' vish-shell-nav-active' : ''}`}>
      <Icon aria-hidden="true" size={17} className="shrink-0" />
      <span>{item.name}</span>
    </Link>
  );
}

function TopCommandBar({ onNavigate, mobileOpen, onMobileOpenChange }: { onNavigate?: () => void; mobileOpen: boolean; onMobileOpenChange: (open: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { plan } = useBilling();
  const accountLabel = profile?.full_name || user?.email || 'Local User';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
    onNavigate?.();
  };

  return (
    <VishToolbar variant="workstation" className="vish-workspace-topbar vish-editor-topbar-chrome h-14 w-full rounded-none border-x-0 border-t-0 px-3 sm:px-4 shrink-0 flex items-center justify-between z-50">
      <div className="flex items-center gap-1 sm:gap-3 xl:gap-6 h-full min-w-0">
        <Link to="/projects" aria-label="Vishvakarma.OS projects" onClick={onNavigate} className="vish-shell-brand vish-workspace-brand">
          {/* Keep the official user-supplied logo on the workspace home link. */}
          <img src={OFFICIAL_LOGO_SRC} alt="" className="w-8 h-8 shrink-0 object-contain" />
          <span className="hidden sm:inline">Vishvakarma.OS</span>
        </Link>

        <nav aria-label="Design tools" className="vish-workspace-primary-nav flex items-center gap-1 h-full">
          {topNav.map((item) => (
            <WorkspaceNavLink key={item.path} item={item} isActive={location.pathname === item.path} onClick={onNavigate} />
          ))}
        </nav>
      </div>

      <div className="vish-workspace-controls flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Search */}
        <button onClick={openCommandPalette} aria-label="Open command palette" data-testid="workspace-command-search" className="touch-target flex h-11 min-h-11 w-11 min-w-11 items-center justify-center rounded-md hover:bg-vish-navy-700/50 text-vish-text-300 transition-colors">
          <Search className="w-4 h-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Account menu for ${accountLabel}`}
              data-testid="workspace-account-control"
              className="touch-target flex h-11 min-h-11 w-11 min-w-11 items-center justify-center rounded-md border border-vish-navy-600 bg-vish-navy-800 text-xs font-bold text-vish-text-100 transition-colors hover:border-primary"
            >
              {accountInitials(accountLabel)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-[min(80vw,18rem)] min-w-[11rem] motion-reduce:animate-none">
            <DropdownMenuLabel className="truncate font-normal">{accountLabel} · {plan}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-[44px]" asChild>
              <Link to="/profile"><UserRound aria-hidden="true" /> Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-[44px]" onSelect={() => void handleSignOut()}>
              <LogOut aria-hidden="true" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <SheetTrigger asChild>
            <Button variant="ghost" aria-label="Open workspace navigation" data-testid="workspace-mobile-menu" className="touch-target h-11 min-h-11 min-w-11 px-2.5 text-vish-text-100 sm:px-3">
              <Menu aria-hidden="true" className="w-5 h-5" />
              <span className="hidden lg:inline">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="vish-workspace-menu flex w-[min(86vw,320px)] flex-col gap-3 p-4 motion-reduce:animate-none">
            <SheetTitle className="pr-12">Workspace</SheetTitle>
            <SheetDescription className="sr-only">Open a design, account, or governance tool.</SheetDescription>
            <nav aria-label="All workspace destinations" className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              {NAV_GROUPS.map((group) => (
                <section key={group} aria-labelledby={`workspace-nav-${group}`} className="mb-5">
                  <h2 id={`workspace-nav-${group}`} className="vish-workspace-menu-label">{NAV_GROUP_LABELS[group]}</h2>
                  {WORKSPACE_NAV.filter((item) => item.group === group).map((item) => (
                    <WorkspaceNavLink key={item.path} item={item} isActive={location.pathname === item.path} onClick={onNavigate} />
                  ))}
                </section>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </VishToolbar>
  );
}

function WorkspaceSidebar({ onAfterAction }: { onAfterAction: () => void }) {
  const config = useEditorSidebarConfig();
  const showDesktopSidebar = Boolean(config);
  if (!showDesktopSidebar || !config) return null;
  return (
    <aside className="vish-workspace-sidebar tablet:block hidden w-64 shrink-0 overflow-y-auto border-r border-ws-border bg-ws-toolbar px-3 py-3" aria-label="Editor actions">
      <EditorSidebarSections config={config} onAfterAction={onAfterAction} />
      <FoundersAcknowledgment variant="sidebar" className="mt-4" />
    </aside>
  );
}

export default function AppLayout({ children, immersive = false }: AppLayoutProps) {
  const [prefs, setPrefs] = useState(() => loadWorkspacePrefs());
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    saveWorkspacePrefs(prefs);
  }, [prefs]);

  const openNav = useCallback(() => {
    setMobileOpen(true);
  }, []);

  return (
    <GovernanceNavContext.Provider value={{ openNav }}>
      <EditorSidebarProvider>
        <div className="vish-workspace-shell flex flex-col h-[100dvh] w-full bg-background overflow-hidden" data-density={prefs.density} data-immersive={immersive ? 'true' : undefined}>
          <WorkspaceCommandPalette />
          
          <TopCommandBar onNavigate={() => setMobileOpen(false)} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden relative">
            <WorkspaceNotifications />
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <WorkspaceSidebar onAfterAction={() => setMobileOpen(false)} />
              <div className="min-h-0 flex-1 overflow-hidden">
            <div
              className={
                immersive
                  ? 'flex min-h-0 flex-1 flex-col overflow-hidden w-full h-full'
                  : 'min-h-0 flex-1 overflow-x-hidden overflow-y-auto w-full h-full'
              }
            >
              {children}
            </div>
              </div>
            </div>
          </main>
          <PrototypeDisclaimerBadge />
        </div>
      </EditorSidebarProvider>
    </GovernanceNavContext.Provider>
  );
}
