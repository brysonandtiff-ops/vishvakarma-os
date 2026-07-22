import { Outlet } from 'react-router-dom';
import WorkspacePageShell from '@/components/layouts/WorkspacePageShell';

export function WorkspaceDocumentLayout() {
  return (
    <WorkspacePageShell width="standard">
      <Outlet />
    </WorkspacePageShell>
  );
}

export function WorkspaceDocumentNarrowLayout() {
  return (
    <WorkspacePageShell width="narrow">
      <Outlet />
    </WorkspacePageShell>
  );
}

export default WorkspaceDocumentLayout;
