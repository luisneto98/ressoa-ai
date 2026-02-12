import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { useAuthStore } from '@/stores/auth.store';
import { useIsMobile } from '@/hooks/useMediaQuery';

// Mock the child components
vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Component</div>,
}));

vi.mock('./Header', () => ({
  Header: ({ showMenuButton }: { showMenuButton?: boolean }) => (
    <div data-testid="header">
      Header Component {showMenuButton && '(with menu button)'}
    </div>
  ),
}));

vi.mock('./MobileSidebar', () => ({
  MobileSidebar: () => <div data-testid="mobile-sidebar">Mobile Sidebar Component</div>,
}));

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock UI store
vi.mock('@/stores/ui.store', () => ({
  useUIStore: vi.fn((selector) => {
    const state = {
      sidebarCollapsed: false,
      toggleSidebar: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock useMediaQuery hook
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false), // Default to desktop
}));

describe('AppLayout', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'test@test.com',
        nome: 'Test User',
        role: 'PROFESSOR',
        escola_id: 'test-escola-id',
      },
      accessToken: 'test-token',
      refreshToken: 'test-refresh-token',
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('should render sidebar component', () => {
    render(
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should render header component', () => {
    render(
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should have a main content area with outlet', () => {
    render(
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'overflow-y-auto', 'bg-ghost-white', 'p-6');
  });

  it('should render with correct layout structure', () => {
    const { container } = render(
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    );

    // Check root div has flex layout
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass('flex', 'h-screen', 'overflow-hidden');
  });

  describe('responsive rendering', () => {
    it('should render desktop Sidebar when isMobile is false', () => {
      vi.mocked(useIsMobile).mockReturnValue(false);

      render(
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-sidebar')).not.toBeInTheDocument();
    });

    it('should render MobileSidebar when isMobile is true', () => {
      vi.mocked(useIsMobile).mockReturnValue(true);

      render(
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      );

      expect(screen.getByTestId('mobile-sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });

    it('should pass showMenuButton=true to Header on mobile', () => {
      vi.mocked(useIsMobile).mockReturnValue(true);

      render(
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      );

      const header = screen.getByTestId('header');
      expect(header.textContent).toContain('(with menu button)');
    });

    it('should pass showMenuButton=false to Header on desktop', () => {
      vi.mocked(useIsMobile).mockReturnValue(false);

      render(
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      );

      const header = screen.getByTestId('header');
      expect(header.textContent).not.toContain('(with menu button)');
    });
  });
});
