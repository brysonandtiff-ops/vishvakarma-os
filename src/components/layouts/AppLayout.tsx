import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { Menu, Search, Cloud, CloudOff } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCallback, useEffect, useState, createContext, useContext } from 'react';
import { WorkspaceCommandPalette, OPEN_COMMAND_PALETTE_EVENT } from '@/components/workspace/WorkspaceCommandPalette';
import { WorkspaceNotifications } from '@/components/workspace/WorkspaceNotifications';
import { loadWorkspacePrefs, saveWorkspacePrefs } from '@/components/workspace/workspaceMemory';
import { PrototypeDisclaimerBadge } from '@/components/common/PrototypeDisclaimer';
import { WORKSPACE_NAV, type RouteNavItem } from '@/config/RouteNavConfig';
import { useBilling } from '@/hooks/useBilling';
import { EditorSidebarProvider, useEditorSidebarConfig, type EditorSidebarConfig } from '@/components/editor/EditorSidebarContext';
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

function TopNavItem({ item, isActive, onClick }: { item: RouteNavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      aria-label={item.name}
      className={`vish-shell-nav-item relative group flex items-center gap-2 h-full px-4 transition-colors ${
        isActive ? 'vish-shell-nav-active' : ''
      }`}
    >
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-white' : 'text-vish-text-300 group-hover:text-vish-text-100'}`}>
        <Icon className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
        <span>{item.name}</span>
      </div>
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-vish-blue-400 shadow-[0_-2px_10px_rgba(42,167,255,0.6)]" />}
    </Link>
  );
}

function EditorSidebar({ config }: { config: EditorSidebarConfig }) {
  return (
    <div className="hidden tablet:block">
      <aside className="vish-workspace-sidebar flex w-[18rem] shrink-0 flex-col border-r border-vish-navy-600/50" aria-label="Editor workspace controls">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
          <EditorSidebarSections config={config} />
        </div>
        <div className="shrink-0 border-t border-vish-navy-600/50 px-3 py-3">
          <FoundersAcknowledgment variant="sidebar" />
        </div>
      </aside>
    </div>
  );
}

function TopCommandBar({
  onNavigate,
  mobileOpen,
  onMobileOpenChange,
  editorConfig,
  isEditorRoute,
}: {
  onNavigate?: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  editorConfig: EditorSidebarConfig | null;
  isEditorRoute: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, mode, signOut } = useAuth();
  const { plan } = useBilling();
  const accountLabel = profile?.full_name || user?.email || 'Local User';
  const isCloudConnected = mode === 'connected';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
    onNavigate?.();
  };

  const closeMobileNavigation = () => {
    onMobileOpenChange(false);
    onNavigate?.();
  };

  return (
    <VishToolbar className="h-14 w-full rounded-none border-x-0 border-t-0 px-4 shrink-0 flex items-center justify-between z-50 rounded-b-none">
      <div className="flex min-w-0 items-center gap-4 tablet:gap-6 h-full">
        <div className="vish-shell-brand flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-vish-gold-500/30 shadow-[0_0_10px_rgba(201,138,46,0.2)]">
            <img src={OFFICIAL_LOGO_SRC} alt="VISHVAKARMA.OS official user-supplied logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-[10px] font-bold tracking-[0.25em] text-vish-gold-500 uppercase leading-tight">VISHVAKARMA.OS</span>
            <span className="text-[9px] text-vish-text-400 uppercase tracking-widest leading-tight">Command Centre</span>
          </div>
        </div>

        <nav className="hidden tablet:flex items-center h-full min-w-0" aria-label="Workspace navigation">
          {WORKSPACE_NAV.map((item) => (
            <TopNavItem key={item.path} item={item} isActive={location.pathname === item.path} onClick={closeMobileNavigation} />
          ))}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2 tablet:gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-vish-text-300" aria-label={isCloudConnected ? 'Cloud sync available' : 'Local draft mode'}>
                {isCloudConnected ? <Cloud className="w-4 h-4 text-emerald-400" /> : <CloudOff className="w-4 h-4 text-amber-300" />}
                <span className="text-[10px] uppercase tracking-wider hidden sm:inline-block">{isCloudConnected ? 'Sync' : 'Local'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-xs">{isCloudConnected ? 'Cloud sync is available for this session' : 'Working in local draft mode'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <button type="button" onClick={openCommandPalette} className="touch-target flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md hover:bg-vish-navy-700/50 text-vish-text-300 transition-colors" aria-label="Search workspace">
          <Search className="w-4 h-4" />
        </button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleSignOut}
                className="vish-shell-account touch-target flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md bg-vish-navy-800 border border-vish-navy-600 text-xs font-bold text-vish-text-100 hover:border-vish-blue-500 hover:shadow-[0_0_10px_rgba(42,167,255,0.2)] transition-all"
                aria-label={`Sign out ${accountLabel}`}
              >
                {accountInitials(accountLabel)}
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">{accountLabel} • {plan} • Click to sign out</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="touch-target tablet:hidden text-vish-text-100" aria-label="Open workspace navigation">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-vish-navy-800 border-r border-vish-navy-600 p-0" aria-label="Workspace navigation">
            <div className="flex h-full min-h-0 flex-col pt-4">
              <nav className="shrink-0" aria-label="Workspace navigation">
                {WORKSPACE_NAV.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileNavigation}
                    className={`min-h-[44px] px-6 py-3 border-b border-vish-navy-700 flex items-center gap-3 ${location.pathname === item.path ? 'vish-shell-nav-active text-vish-blue-400' : 'text-vish-text-200'}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-semibold uppercase tracking-wider text-sm">{item.name}</span>
                  </Link>
                ))}
              </nav>
              {isEditorRoute && editorConfig && (
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <EditorSidebarSections config={editorConfig} onAfterAction={() => onMobileOpenChange(false)} />
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </VishToolbar>
  );
}

function AppLayoutContent({ children, immersive = false }: AppLayoutProps) {
  const location = useLocation();
  const [prefs] = useState(() => loadWorkspacePrefs());
  const [mobileOpen, setMobileOpen] = useState(false);
  const editorConfig = useEditorSidebarConfig();
  const isEditorRoute = location.pathname === '/editor';
  const showDesktopSidebar = isEditorRoute && editorConfig !== null;

  useEffect(() => {
    saveWorkspacePrefs(prefs);
  }, [prefs]);

  const openNav = useCallback(() => {
    setMobileOpen(true);
  }, []);

  return (
    <GovernanceNavContext.Provider value={{ openNav }}>
      <div className="vish-workspace-shell flex flex-col h-[100dvh] w-full bg-background overflow-hidden" data-density={prefs.density} data-immersive={immersive ? 'true' : undefined} data-surface-variant="workstation">
        <WorkspaceCommandPalette />
        <TopCommandBar
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
          onNavigate={() => setMobileOpen(false)}
          editorConfig={editorConfig}
          isEditorRoute={isEditorRoute}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {showDesktopSidebar && <EditorSidebar config={editorConfig} />}
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden relative">
            <WorkspaceNotifications />
            <div className={immersive ? 'flex min-h-0 flex-1 flex-col overflow-hidden w-full h-full' : 'min-h-0 flex-1 overflow-x-hidden overflow-y-auto w-full h-full'}>
              {children}
            </div>
          </main>
        </div>
        <PrototypeDisclaimerBadge />
      </div>
    </GovernanceNavContext.Provider>
  );
}

export default function AppLayout({ children, immersive = false }: AppLayoutProps) {
  return (
    <EditorSidebarProvider>
      <AppLayoutContent immersive={immersive}>{children}</AppLayoutContent>
    </EditorSidebarProvider>
  );
}
