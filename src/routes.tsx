import EditorPage from './pages/EditorPage';
import SpecCenterPage from './pages/SpecCenterPage';
import RegistryPage from './pages/RegistryPage';
import ChangeRequestsPage from './pages/ChangeRequestsPage';
import ReleasesPage from './pages/ReleasesPage';
import AuditLogPage from './pages/AuditLogPage';
import WorldRecordsPage from './pages/WorldRecordsPage';
import AuthPage from './pages/AuthPage';
import type { ReactNode } from 'react';

export type RouteAccess = 'public' | 'private';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  access: RouteAccess;
}

const routes: RouteConfig[] = [
  {
    name: 'Account Access',
    path: '/auth',
    element: <AuthPage />,
    visible: false,
    access: 'public',
  },
  {
    name: 'Blueprint Editor',
    path: '/',
    element: <EditorPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Spec Center',
    path: '/spec-center',
    element: <SpecCenterPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Registry Center',
    path: '/registry',
    element: <RegistryPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Change Requests',
    path: '/change-requests',
    element: <ChangeRequestsPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Release Center',
    path: '/releases',
    element: <ReleasesPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'World Records',
    path: '/world-records',
    element: <WorldRecordsPage />,
    visible: true,
    access: 'private',
  },
  {
    name: 'Audit Log',
    path: '/audit',
    element: <AuditLogPage />,
    visible: true,
    access: 'private',
  },
];

export default routes;
