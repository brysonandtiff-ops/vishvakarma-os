import {
  Box,
  Database,
  FileText,
  FolderOpen,
  GitPullRequest,
  History,
  Package,
  PenLine,
  PenTool,
  Sparkles,
  Trophy,
  User,
  type LucideIcon,
} from 'lucide-react';
import {
  getAppRouteManifest,
  getManifestRoutePaths,
  getNavRouteManifestEntries,
  getPrivateRoutePaths,
  getPublicRoutePaths,
  getRouteLayoutMeta,
  type NavGroup,
  type PageWidth,
  type RouteLayoutKind,
  type RouteNavIconKey,
} from '@/config/routeManifest';

export type { NavGroup, PageWidth, RouteLayoutKind };

export interface RouteNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  group: NavGroup;
  showInTopNav: boolean;
}

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  EDITOR: 'Design workspace',
  TOOLS: 'More design tools',
  GOVERNANCE: 'Governance',
  SYSTEM: 'System',
};

export const NAV_GROUPS: NavGroup[] = ['EDITOR', 'TOOLS', 'GOVERNANCE', 'SYSTEM'];

const NAV_ICON_MAP: Record<RouteNavIconKey, LucideIcon> = {
  Box,
  PenLine,
  PenTool,
  FolderOpen,
  Sparkles,
  User,
  FileText,
  Database,
  GitPullRequest,
  Package,
  Trophy,
  History,
};

/** Sidebar nav derived from the canonical route manifest. */
export const WORKSPACE_NAV: RouteNavItem[] = getNavRouteManifestEntries().map((entry) => ({
  name: entry.navLabel ?? entry.name,
  path: entry.path,
  icon: NAV_ICON_MAP[entry.navIcon!],
  group: entry.navGroup!,
  showInTopNav: entry.primaryNavOrder !== undefined,
}));

export const ROUTE_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  WORKSPACE_NAV.map((item) => [item.path, item.icon]),
);

export interface RouteLayoutMeta {
  path: string;
  layout: RouteLayoutKind;
  pageWidth?: PageWidth;
}

/** Layout assignment per route — derived from route manifest. */
export const ROUTE_LAYOUT_META: RouteLayoutMeta[] = getRouteLayoutMeta();

export function getRouteLayoutKind(path: string): RouteLayoutKind {
  const exact = ROUTE_LAYOUT_META.find((entry) => entry.path === path);
  if (exact) return exact.layout;
  if (path.startsWith('/cast/')) return 'cast';
  return 'none';
}

/** Re-export for tests that need full manifest access without React route elements. */
export { getAppRouteManifest, getManifestRoutePaths, getPrivateRoutePaths, getPublicRoutePaths };
