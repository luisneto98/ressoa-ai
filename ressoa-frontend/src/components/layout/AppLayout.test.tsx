import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { useAuthStore } from '@/stores/auth.store';

// Mock the child components
vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Component</div>,
}));

vi.mock('./Header', () => ({
  Header: () => <div data-testid="header">Header Component</div>,
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
});
