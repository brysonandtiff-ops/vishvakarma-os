import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CircleHelp,
  ClipboardCheck,
  LogOut,
  PenTool,
  Sparkles,
  Tablet,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { startGuidedDemoSession } from '@/demo-session/GuidedDemoSessionController';
import { useAuth } from '@/contexts/AuthContext';
import { TUTORIAL_TRACKS } from '@/tutorial/tutorialCatalog';
import { openTutorialHub } from '@/tutorial/TutorialProvider';
import { OPEN_VOICE_TOUR_EVENT } from '@/voice-tour/voiceTourContent';
import routes from '@/routes';
import { ROUTE_ICONS } from '@/config/RouteNavConfig';

export const OPEN_COMMAND_PALETTE_EVENT = 'vish:open-command-palette';

// Navigable targets are derived from the production route manifest, so the
// palette can only ever route to locked, private routes. No drift possible.
// Computed lazily to avoid a module-init circular dependency
// (routes -> EditorPage -> AppLayout -> this module -> routes).
export function getNavigableRoutes() {
  return routes
    .filter((route) => route.access === 'private' && route.visible !== false)
    .map((route) => ({
      name: route.name,
      path: route.path,
      icon: ROUTE_ICONS[route.path] ?? PenTool,
    }));
}

export function WorkspaceCommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const onOpenEvent = () => setOpen(true);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    };
  }, []);

  const runNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const runDemoSession = () => {
    setOpen(false);
    startGuidedDemoSession({ autoPlayVoice: true });
  };

  const runQaEvidence = async () => {
    setOpen(false);
    const { openQaEvidencePanel } = await import('@/qa-evidence/QaEvidencePanel');
    openQaEvidencePanel();
  };

  const runTouchAudit = async () => {
    setOpen(false);
    const { openIpadTouchAuditHud } = await import('@/touch-audit/IpadTouchAuditHud');
    openIpadTouchAuditHud();
  };

  const runSignOut = () => {
    setOpen(false);
    void signOut().then(() => navigate('/auth', { replace: true }));
  };

  const runVoiceTour = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent(OPEN_VOICE_TOUR_EVENT, { detail: { autoPlay: true } }));
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search routes, tools, tutorials…" />
      <CommandList>
        <CommandEmpty>No matching workspace command.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {getNavigableRoutes().map((route) => {
            const Icon = route.icon;
            return (
              <CommandItem
                key={route.path}
                value={`${route.name} ${route.path} workspace navigate sidebar`}
                onSelect={() => runNavigate(route.path)}
              >
                <Icon />
                <span>{route.name}</span>
                <CommandShortcut>{route.path}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Learn">
          {__VISH_QA_TOOLS_ENABLED__ ? (
            <>
              <CommandItem
                value="ipad touch audit hud tester tap target overflow blocked controls"
                onSelect={() => void runTouchAudit()}
              >
                <Tablet />
                <span>iPad Touch Audit HUD</span>
                <CommandShortcut>iPad</CommandShortcut>
              </CommandItem>
              <CommandItem
                value="qa evidence proof checklist ipad pwa smoke testing"
                onSelect={() => void runQaEvidence()}
              >
                <ClipboardCheck />
                <span>QA Evidence mode</span>
                <CommandShortcut>Proof</CommandShortcut>
              </CommandItem>
            </>
          ) : null}
          <CommandItem value="start demo session sample grid voice tour guided first run" onSelect={runDemoSession}>
            <Sparkles />
            <span>Start demo session</span>
            <CommandShortcut>Demo</CommandShortcut>
          </CommandItem>
          <CommandItem value="voice tour audio guided walkthrough browser speech mp3 full software" onSelect={runVoiceTour}>
            <Volume2 />
            <span>Start voice guided tour</span>
            <CommandShortcut>Voice</CommandShortcut>
          </CommandItem>
          <CommandItem value="tutorials help hub guided videos learn onboarding" onSelect={() => { setOpen(false); openTutorialHub(); }}>
            <CircleHelp />
            <span>Tutorial hub</span>
            <CommandShortcut>Help</CommandShortcut>
          </CommandItem>
          {TUTORIAL_TRACKS.map((track) => (
            <CommandItem
              key={track.id}
              value={`tutorial learn help ${track.title} ${track.id} ${track.description} ${track.defaultRoute}`}
              onSelect={() => {
                setOpen(false);
                navigate(`${track.defaultRoute}?tutorial=${track.id}`);
              }}
            >
              <CircleHelp />
              <span>{track.title}</span>
              <CommandShortcut>~{track.estMinutes}m</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Session">
          <CommandItem value="sign out logout" onSelect={runSignOut}>
            <LogOut />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
