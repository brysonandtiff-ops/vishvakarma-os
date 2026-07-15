import { PRICING_PAGE_ENABLED } from '@/config/marketingFeatures';

export type RouteAccess = 'public' | 'private';

export type NavGroup = 'EDITOR' | 'GOVERNANCE' | 'SYSTEM';

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

/** Icon keys resolved in RouteNavConfig — keeps manifest free of lucide imports. */
export type RouteNavIconKey =
  | 'PenTool'
  | 'FolderOpen'
  | 'Sparkles'
  | 'User'
  | 'FileText'
  | 'Database'
  | 'GitPullRequest'
  | 'Package'
  | 'Trophy'
  | 'History';

export interface RouteManifestEntry {
  path: string;
  name: string;
  access: RouteAccess;
  /** When false, excluded from command palette navigation. */
  visible?: boolean;
  layout: RouteLayoutKind;
  pageWidth?: PageWidth;
  navGroup?: NavGroup;
  showInNav?: boolean;
  navIcon?: RouteNavIconKey;
}

const CORE_ROUTE_MANIFEST: RouteManifestEntry[] = [
  { path: '/', name: 'Landing', access: 'public', visible: false, layout: 'marketing' },
  { path: '/features', name: 'Features', access: 'public', visible: false, layout: 'marketing' },
  { path: '/auth', name: 'Account Access', access: 'public', visible: false, layout: 'auth' },
  { path: '/reset-password', name: 'Reset Password', access: 'public', visible: false, layout: 'auth' },
  { path: '/cast/:token', name: 'Akasha Cast Viewer', access: 'public', visible: false, layout: 'cast' },
  { path: '/404', name: 'Not Found', access: 'public', visible: false, layout: 'marketing' },
  { path: '/terms', name: 'Terms of Service', access: 'public', visible: false, layout: 'marketing' },
  { path: '/privacy', name: 'Privacy Policy', access: 'public', visible: false, layout: 'marketing' },
  {
    path: '/editor',
    name: 'Blueprint Editor',
    access: 'private',
    visible: true,
    layout: 'workspace-immersive',
    navGroup: 'EDITOR',
    showInNav: true,
    navIcon: 'PenTool',
  },
  {
    path: '/editor-lite',
    name: 'Lite Editor',
    access: 'private',
    visible: true,
    layout: 'workspace-immersive',
    navGroup: 'EDITOR',
    showInNav: true,
    navIcon: 'PenTool',
  },
  {
    path: '/3d-room',
    name: '3D Room',
    access: 'private',
    visible: false,
    layout: 'workspace-immersive',
  },
  {
    path: '/projects',
    name: 'Projects',
    access: 'private',
    visible: true,
    layout: 'workspace-document',
    pageWidth: 'standard',
    navGroup: 'EDITOR',
    showInNav: true,
    navIcon: 'FolderOpen',
  },
  {
    path: '/optimization',
    name: 'Design Optimization',
    access: 'private',
    visible: true,
    layout: 'workspace-governance',
    pageWidth: 'wide',
    navGroup: 'EDITOR',
    showInNav: true,
    navIcon: 'Sparkles',
  },
  {
    path: '/profile',
    name: 'Profile',
    access: 'private',
    visible: true,
    layout: 'workspace-document-narrow',
    pageWidth: 'narrow',
    navGroup: 'EDITOR',
    showInNav: true,
    navIcon: 'User',
  },
  {
    path: '/spec-center',
    name: 'Spec Center',
    access: 'private',
    visible: true,
    layout: 'workspace-governance',
    pageWidth: 'wide',
    navGroup: 'GOVERNANCE',
    showInNav: true,
    navIcon: 'FileText',
  },
  {
    path: '/registry',
    name: 'Registry Center',
    access: 'private',
    visible: true,
    layout: 'workspace-governance',
    pageWidth: 'wide',
    navGroup: 'GOVERNANCE',
    showInNav: true,
    navIcon: 'Database',
  },
  {
    path: '/change-requests',
    name: 'Change Requests',
    access: 'private',
    visible: true,
    layout: 'workspace-governance',
    pageWidth: 'wide',
    navGroup: 'GOVERNANCE',
    showInNav: true,
    navIcon: 'GitPullRequest',
  },
  {
    path: '/releases',
    name: 'Release Center',
    access: 'private',
    visible: true,
    layout: 'workspace-governance',
    pageWidth: 'wide',
    navGroup: 'GOVERNANCE',
    showInNav: true,
    navIcon: 'Package',
  },
  {
    path: '/world-records',
    name: 'World Records',
    access: 'private',
    visible: true,
    layout: 'workspace-governance',
    pageWidth: 'wide',
    navGroup: 'GOVERNANCE',
    showInNav: true,
    navIcon: 'Trophy',
  },
  {
    path: '/audit',
    name: 'Audit Log',
    access: 'private',
    visible: true,
    layout: 'workspace-governance',
    pageWidth: 'wide',
    navGroup: 'SYSTEM',
    showInNav: true,
    navIcon: 'History',
  },
];

const PRICING_ROUTE: RouteManifestEntry = {
  path: '/pricing',
  name: 'Pricing',
  access: 'public',
  visible: false,
  layout: 'marketing',
};

/** Canonical route manifest — single source for guards, nav, layout meta, and parity tests. */
export function getAppRouteManifest(): RouteManifestEntry[] {
  const manifest = [...CORE_ROUTE_MANIFEST];
  if (PRICING_PAGE_ENABLED) {
    manifest.splice(2, 0, PRICING_ROUTE);
  }
  return manifest;
}

export function getManifestRoutePaths(): string[] {
  return getAppRouteManifest().map((entry) => entry.path);
}

export function getPrivateRoutePaths(): string[] {
  return getAppRouteManifest()
    .filter((entry) => entry.access === 'private')
    .map((entry) => entry.path);
}

export function getPublicRoutePaths(): string[] {
  return getAppRouteManifest()
    .filter((entry) => entry.access === 'public')
    .map((entry) => entry.path);
}

export function getNavRouteManifestEntries(): RouteManifestEntry[] {
  return getAppRouteManifest().filter((entry) => entry.showInNav && entry.navGroup && entry.navIcon);
}

export function getRouteLayoutMeta(): Array<Pick<RouteManifestEntry, 'path' | 'layout' | 'pageWidth'>> {
  return getAppRouteManifest().map(({ path, layout, pageWidth }) => ({ path, layout, pageWidth }));
}
