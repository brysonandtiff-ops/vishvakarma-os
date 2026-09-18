import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppLayout, { useGovernanceNav } from '@/components/layouts/AppLayout';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    profile: { full_name: 'Test User' },
    mode: 'local',
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useBilling', () => ({
  useBilling: () => ({ plan: 'Free' }),
}));

/**
 * Regression guard for the dead "Open workspace navigation" control.
 *
 * EditorTopBar renders an "Open workspace navigation" button wired to
 * useGovernanceNav().openNav(). AppLayout owned the `mobileOpen` state but
 * never passed it to the nav <Sheet>, which stayed uncontrolled — so openNav()
 * set state nothing read and the button did nothing when clicked.
 */
function GovernanceNavProbe() {
  const { openNav } = useGovernanceNav();
  return (
    <button type="button" data-testid="probe-open-nav" onClick={openNav}>
      open nav
    </button>
  );
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/editor']}>
      <Routes>
        <Route
          path="/editor"
          element={
            <AppLayout immersive>
              <GovernanceNavProbe />
            </AppLayout>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('workspace navigation drawer', () => {
  it('stays closed until navigation is requested', () => {
    renderShell();

    expect(screen.queryByTestId('workspace-nav-drawer')).not.toBeInTheDocument();
  });

  it('opens the workspace nav drawer when openNav() is invoked', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId('probe-open-nav'));

    await waitFor(() => {
      expect(screen.getByTestId('workspace-nav-drawer')).toBeInTheDocument();
    });
  });

  it('exposes the workspace routes inside the opened drawer', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId('probe-open-nav'));

    const drawer = await screen.findByTestId('workspace-nav-drawer');
    const links = drawer.querySelectorAll('a[href]');
    expect(links.length).toBeGreaterThan(0);
  });
});
