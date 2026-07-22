import { Outlet } from 'react-router-dom';
import WorkspacePageShell, { WorkspacePageScroll } from '@/components/layouts/WorkspacePageShell';

export function WorkspaceGovernanceLayout() {
  return (
    <WorkspacePageShell variant="governance">
      <Outlet />
    </WorkspacePageShell>
  );
}

export function WorkspaceGovernanceScrollLayout() {
  return (
    <WorkspaceGovernanceLayout />
  );
}

/** Governance pages that need scroll wrapper use WorkspacePageScroll in-page or this layout. */
export function WorkspaceGovernancePageLayout() {
  return (
    <WorkspacePageShell variant="governance">
      <WorkspacePageScroll>
        <Outlet />
      </WorkspacePageScroll>
    </WorkspacePageShell>
  );
}

export default WorkspaceGovernanceLayout;
