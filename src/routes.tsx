import EditorPage from './pages/EditorPage';
import SpecCenterPage from './pages/SpecCenterPage';
import RegistryPage from './pages/RegistryPage';
import ChangeRequestsPage from './pages/ChangeRequestsPage';
import ReleasesPage from './pages/ReleasesPage';
import AuditLogPage from './pages/AuditLogPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Blueprint Editor',
    path: '/',
    element: <EditorPage />,
    visible: true,
  },
  {
    name: 'Spec Center',
    path: '/spec-center',
    element: <SpecCenterPage />,
    visible: true,
  },
  {
    name: 'Registry Center',
    path: '/registry',
    element: <RegistryPage />,
    visible: true,
  },
  {
    name: 'Change Requests',
    path: '/change-requests',
    element: <ChangeRequestsPage />,
    visible: true,
  },
  {
    name: 'Release Center',
    path: '/releases',
    element: <ReleasesPage />,
    visible: true,
  },
  {
    name: 'Audit Log',
    path: '/audit',
    element: <AuditLogPage />,
    visible: true,
  },
];

export default routes;
