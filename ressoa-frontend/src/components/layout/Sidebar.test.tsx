import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useIsTablet } from '@/hooks/useMediaQuery';

// Mock hooks
vi.mock('@/stores/auth.store');
vi.mock('@/stores/ui.store');
vi.mock('@/hooks/useMediaQuery');

// Mock navigation config
vi.mock('./navigation-config', () => ({
  getNavigationForRole: vi.fn(() => [
    { path: '/dashboard', label: 'Dashboard', icon: () => null },
    { path: '/aulas', label: 'Aulas', icon: () => null },
  ]),
}));

describe('Sidebar', () => {
  const mockAutoCollapseSidebar = vi.fn();
  const mockToggleSidebar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth state
    vi.mocked(useAuthStore).mockReturnValue({
      user: {
        id: 'test-id',
        email: 'test@test.com',
        nome: 'Test User',
        role: 'PROFESSOR',
        escola_id: 'escola-1',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
      login: vi.fn(),
      logout: vi.fn(),
    });

    // Default UI store state
    vi.mocked(useUIStore).mockImplementation((selector: any) => {
      const state = {
        sidebarCollapsed: false,
        manuallyToggled: false,
        toggleSidebar: mockToggleSidebar,
        autoCollapseSidebar: mockAutoCollapseSidebar,
      };
      return selector ? selector(state) : state;
    });

    // Default to desktop
    vi.mocked(useIsTablet).mockReturnValue(false);
  });

  it('should render sidebar with logo', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    expect(screen.getByText('Ressoa AI')).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Aulas')).toBeInTheDocument();
  });

  describe('auto-collapse on tablet', () => {
    it('should NOT auto-collapse on desktop', () => {
      vi.mocked(useIsTablet).mockReturnValue(false);

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(mockAutoCollapseSidebar).not.toHaveBeenCalled();
    });

    it('should auto-collapse when on tablet and sidebar is expanded and not manually toggled', () => {
      vi.mocked(useIsTablet).mockReturnValue(true);
      vi.mocked(useUIStore).mockImplementation((selector: any) => {
        const state = {
          sidebarCollapsed: false, // Expanded
          manuallyToggled: false, // Not manually toggled
          toggleSidebar: mockToggleSidebar,
          autoCollapseSidebar: mockAutoCollapseSidebar,
        };
        return selector ? selector(state) : state;
      });

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(mockAutoCollapseSidebar).toHaveBeenCalled();
    });

    it('should NOT auto-collapse when sidebar is already collapsed', () => {
      vi.mocked(useIsTablet).mockReturnValue(true);
      vi.mocked(useUIStore).mockImplementation((selector: any) => {
        const state = {
          sidebarCollapsed: true, // Already collapsed
          manuallyToggled: false,
          toggleSidebar: mockToggleSidebar,
          autoCollapseSidebar: mockAutoCollapseSidebar,
        };
        return selector ? selector(state) : state;
      });

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(mockAutoCollapseSidebar).not.toHaveBeenCalled();
    });

    it('should NOT auto-collapse when user manually toggled sidebar', () => {
      vi.mocked(useIsTablet).mockReturnValue(true);
      vi.mocked(useUIStore).mockImplementation((selector: any) => {
        const state = {
          sidebarCollapsed: false, // Expanded
          manuallyToggled: true, // User manually expanded it
          toggleSidebar: mockToggleSidebar,
          autoCollapseSidebar: mockAutoCollapseSidebar,
        };
        return selector ? selector(state) : state;
      });

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      expect(mockAutoCollapseSidebar).not.toHaveBeenCalled();
    });
  });
});
