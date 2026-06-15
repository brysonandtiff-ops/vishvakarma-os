import {
  Database,
  FileText,
  FolderOpen,
  GitPullRequest,
  History,
  Package,
  PenTool,
  Sparkles,
  Trophy,
  User,
  type LucideIcon,
} from 'lucide-react';

export type NavGroup = 'EDITOR' | 'GOVERNANCE' | 'SYSTEM';

export interface RouteNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  group: NavGroup;
}

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  EDITOR: 'Editor',
  GOVERNANCE: 'Governance',
  SYSTEM: 'System',
};

export const NAV_GROUPS: NavGroup[] = ['EDITOR', 'GOVERNANCE', 'SYSTEM'];

/** Single source of truth for sidebar nav and command palette icons. */
export const WORKSPACE_NAV: RouteNavItem[] = [
  { name: 'Blueprint Editor', path: '/editor', icon: PenTool, group: 'EDITOR' },
  { name: 'Projects', path: '/projects', icon: FolderOpen, group: 'EDITOR' },
  { name: 'Design Optimization', path: '/optimization', icon: Sparkles, group: 'EDITOR' },
  { name: 'Profile', path: '/profile', icon: User, group: 'EDITOR' },
  { name: 'Spec Center', path: '/spec-center', icon: FileText, group: 'GOVERNANCE' },
  { name: 'Registry', path: '/registry', icon: Database, group: 'GOVERNANCE' },
  { name: 'Change Requests', path: '/change-requests', icon: GitPullRequest, group: 'GOVERNANCE' },
  { name: 'Release Center', path: '/releases', icon: Package, group: 'GOVERNANCE' },
  { name: 'World Records', path: '/world-records', icon: Trophy, group: 'GOVERNANCE' },
  { name: 'Audit Log', path: '/audit', icon: History, group: 'SYSTEM' },
];

export const ROUTE_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  WORKSPACE_NAV.map((item) => [item.path, item.icon]),
);

export type PageWidth = 'narrow' | 'standard' | 'wide';

export type RouteLayoutKind =
  | 'marketing'
  | 'auth'
  | 'cast'
  | 'workspace-immersive'
  | 'workspace-document'
  | 'workspace-governance'
  | 'workspace-document-narrow'
  | 'none';

export interface RouteLayoutMeta {
  path: string;
  layout: RouteLayoutKind;
  pageWidth?: PageWidth;
}

/** Layout assignment per route — used by AppRoutes and layout polish tests. */
export const ROUTE_LAYOUT_META: RouteLayoutMeta[] = [
  { path: '/', layout: 'marketing' },
  { path: '/features', layout: 'marketing' },
  { path: '/pricing', layout: 'marketing' },
  { path: '/auth', layout: 'auth' },
  { path: '/reset-password', layout: 'auth' },
  { path: '/cast/:token', layout: 'cast' },
  { path: '/404', layout: 'marketing' },
  { path: '/editor', layout: 'workspace-immersive' },
  { path: '/projects', layout: 'workspace-document', pageWidth: 'standard' },
  { path: '/optimization', layout: 'workspace-governance', pageWidth: 'wide' },
  { path: '/profile', layout: 'workspace-document-narrow', pageWidth: 'narrow' },
  { path: '/spec-center', layout: 'workspace-governance', pageWidth: 'wide' },
  { path: '/registry', layout: 'workspace-governance', pageWidth: 'wide' },
  { path: '/change-requests', layout: 'workspace-governance', pageWidth: 'wide' },
  { path: '/releases', layout: 'workspace-governance', pageWidth: 'wide' },
  { path: '/world-records', layout: 'workspace-governance', pageWidth: 'wide' },
  { path: '/audit', layout: 'workspace-governance', pageWidth: 'wide' },
];

export function getRouteLayoutKind(path: string): RouteLayoutKind {
  const exact = ROUTE_LAYOUT_META.find((entry) => entry.path === path);
  if (exact) return exact.layout;
  if (path.startsWith('/cast/')) return 'cast';
  return 'none';
}
