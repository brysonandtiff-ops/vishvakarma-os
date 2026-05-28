import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Database,
  FileText,
  GitPullRequest,
  History,
  LogOut,
  Package,
  PenTool,
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
import { useAuth } from '@/contexts/AuthContext';
import routes from '@/routes';

export const OPEN_COMMAND_PALETTE_EVENT = 'vish:open-command-palette';

const ROUTE_ICONS: Record<string, LucideIcon> = {
  '/': PenTool,
  '/spec-center': FileText,
  '/registry': Database,
  '/change-requests': GitPullRequest,
  '/releases': Package,
  '/audit': History,
};

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

  const runSignOut = () => {
    setOpen(false);
    void signOut();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a workspace center…" />
      <CommandList>
        <CommandEmpty>No matching workspace command.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {getNavigableRoutes().map((route) => {
            const Icon = route.icon;
            return (
              <CommandItem
                key={route.path}
                value={`${route.name} ${route.path}`}
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
