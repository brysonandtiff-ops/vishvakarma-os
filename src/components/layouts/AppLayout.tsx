// Main application layout with top command bar — professional workstation style.
// The Vishvakarma.OS shell owns navigation; WorkspacePageHeader remains the shared page-level header for routed workspace pages.
// VISHVAKARMA.OS is the canonical product wordmark.
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { Menu, Search, Cloud, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useCallback, useEffect, useState, createContext, useContext } from 'react';
import { WorkspaceCommandPalette, OPEN_COMMAND_PALETTE_EVENT } from '@/components/workspace/WorkspaceCommandPalette';
import { WorkspaceNotifications } from '@/components/workspace/WorkspaceNotifications';
import { loadWorkspacePrefs, saveWorkspacePrefs } from '@/components/workspace/workspaceMemory';
import { getCommandPaletteShortcutLabel } from '@/utils/commandPaletteShortcut';
import { PrototypeDisclaimerBadge } from '@/components/common/PrototypeDisclaimer';
import { Badge } from '@/components/ui/badge';
import { WORKSPACE_NAV, type RouteNavItem } from '@/config/RouteNavConfig';
import { useBilling } from '@/hooks/useBilling';
import { EditorSidebarProvider, useEditorSidebarConfig } from '@/components/editor/EditorSidebarContext';
import EditorSidebarSections from '@/components/editor/EditorSidebarSections';
import { FoundersAcknowledgment } from '@/components/brand/FoundersAcknowledgment';
import '@/styles/vish-workspace-shell.css';
import { VishToolbar } from '@/components/common/vish-primitives';

function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
}

// Keep daily design routes visible; secondary workspace rooms remain one click away.
const PRIMARY_WORKSPACE_PATHS = new Set(['/editor', '/projects', '/optimization']);
const PRIMARY_WORKSPACE_NAV = WORKSPACE_NAV.filter((item) => PRIMARY_WORKSPACE_PATHS.has(item.path));
const SECONDARY_WORKSPACE_NAV = WORKSPACE_NAV.filter((item) => !PRIMARY_WORKSPACE_PATHS.has(item.path));

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

function TopNavItem({ item, isActive, onClick }: { item: RouteNavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link to={item.path} onClick={onClick} aria-label={item.name} className={`relative group flex items-center gap-2 h-full px-4 transition-colors ${isActive ? 'vish-shell-nav-active' : ''}`}>
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-white' : 'text-vish-text-300 group-hover:text-vish-text-100'}`}>
        <Icon className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
        <span>{item.name}</span>
      </div>
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-vish-blue-400 shadow-[0_-2px_10px_rgba(42,167,255,0.6)]" />
      )}
    </Link>
  );
}

function TopCommandBar({ onNavigate, mobileOpen, onMobileOpenChange }: { onNavigate?: () => void; mobileOpen: boolean; onMobileOpenChange: (open: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, mode, signOut } = useAuth();
  const { plan } = useBilling();
  const accountLabel = profile?.full_name || user?.email || 'Local User';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
    onNavigate?.();
  };

  return (
    <VishToolbar variant="workstation" className="vish-editor-topbar-chrome h-14 w-full rounded-none border-x-0 border-t-0 px-4 shrink-0 flex items-center justify-between z-50 rounded-b-none">
      <div className="flex items-center gap-6 h-full">
        {/* Brand */}
        <div className="vish-shell-brand flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-vish-gold-500/30 shadow-[0_0_10px_rgba(201,138,46,0.2)]">
            {/* official user-supplied logo */}
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-[10px] font-bold tracking-[0.25em] text-vish-gold-500 uppercase leading-tight">Vishvakarma.OS</span>
            <span className="text-[9px] text-vish-text-400 uppercase tracking-widest leading-tight">Command Centre</span>
          </div>
        </div>

        {/* A focused primary navigation replaces ten competing top-level items. */}
        <nav aria-label="Primary workspace navigation" className="vish-workspace-main-nav hidden lg:flex items-center h-full">
          {PRIMARY_WORKSPACE_NAV.map((item) => (
            <TopNavItem key={item.path} item={item} isActive={location.pathname === item.path} onClick={onNavigate} />
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="More workspaces" className="vish-workspace-more touch-target inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-vish-text-200 hover:bg-vish-navy-700 hover:text-white focus-visible:outline-2 focus-visible:outline-vish-blue-400">
                Workspaces <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[70] max-h-[70dvh] w-60 overflow-y-auto border-vish-navy-600 bg-vish-navy-900">
              {SECONDARY_WORKSPACE_NAV.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link to={item.path} onClick={onNavigate} aria-current={location.pathname === item.path ? 'page' : undefined} className="flex min-h-[44px] items-center gap-2 text-xs">
                    <item.icon className="h-4 w-4" aria-hidden />
                    <span>{item.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Cloud Sync Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-vish-text-300" aria-label="Project sync information">
                <Cloud className="w-4 h-4 text-vish-text-400" />
                <span className="text-[10px] uppercase tracking-wider hidden sm:inline-block">Project status</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Check the editor save badge for local or cloud save status</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Search */}
        <button type="button" aria-label="Search workspaces" onClick={openCommandPalette} className="touch-target flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md hover:bg-vish-navy-700/50 text-vish-text-300 transition-colors">
          <Search className="w-4 h-4" />
        </button>

        {/* Account Menu */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-8 h-8 rounded-md bg-vish-navy-800 border border-vish-navy-600 text-xs font-bold text-vish-text-100 hover:border-vish-blue-500 hover:shadow-[0_0_10px_rgba(42,167,255,0.2)] transition-all"
              >
                {accountInitials(accountLabel)}
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {accountLabel} • {plan} • Click to sign out
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Mobile menu trigger */}
        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="tablet:hidden lg:hidden text-vish-text-100">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-vish-navy-800 border-r border-vish-navy-600 p-0">
             <div className="flex flex-col h-full pt-4">
                {WORKSPACE_NAV.map((item) => (
                  <Link key={item.path} to={item.path} onClick={onNavigate} className={`px-6 py-3 border-b border-vish-navy-700 flex items-center gap-3 ${location.pathname === item.path ? 'text-vish-blue-400' : 'text-vish-text-200'}`}>
                    <item.icon className="w-5 h-5" />
                    <span className="font-semibold uppercase tracking-wider text-sm">{item.name}</span>
                  </Link>
                ))}
             </div>
          </SheetContent>
        </Sheet>
      </div>
    </VishToolbar>
  );
}

function WorkspaceSidebar({ onAfterAction }: { onAfterAction: () => void }) {
  const config = useEditorSidebarConfig();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1600,
  );
  if (!config) return null;

  return (
    <aside
      className={`vish-workspace-sidebar vish-project-sidebar tablet:flex hidden ${collapsed ? 'w-[76px]' : 'w-64'} shrink-0 flex-col overflow-y-auto border-r border-ws-border bg-ws-toolbar px-2 py-3`}
      aria-label="Editor actions"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <button
        type="button"
        data-testid="editor-sidebar-toggle"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand project tools' : 'Collapse project tools'}
        onClick={() => setCollapsed((value) => !value)}
        className="vish-project-sidebar-toggle touch-target mb-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-ws-border bg-ws-toolbar text-xs font-semibold text-ws-text hover:bg-ws-hover focus-visible:outline-2 focus-visible:outline-vish-blue-400"
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
        {!collapsed && <span>Project tools</span>}
      </button>
      <EditorSidebarSections config={config} collapsed={collapsed} onAfterAction={onAfterAction} />
      {!collapsed && <FoundersAcknowledgment variant="sidebar" className="mt-4" />}
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
