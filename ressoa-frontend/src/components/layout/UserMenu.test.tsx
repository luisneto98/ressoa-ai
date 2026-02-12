import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { useAuthStore } from '@/stores/auth.store';

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UserMenu', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogout.mockClear();

    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const state = {
        user: {
          id: 'test-user-id',
          email: 'professor@test.com',
          nome: 'João Silva',
          role: 'PROFESSOR' as const,
          escola_id: 'test-escola-id',
        },
        logout: mockLogout,
      };
      return selector ? selector(state) : state;
    });
  });

  it('should return null when user is not logged in', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const state = { user: null, logout: mockLogout };
      return selector ? selector(state) : state;
    });

    const { container } = render(
      <BrowserRouter>
        <UserMenu />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display user name', () => {
    render(
      <BrowserRouter>
        <UserMenu />
      </BrowserRouter>
    );

    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('should display user initials in avatar', () => {
    render(
      <BrowserRouter>
        <UserMenu />
      </BrowserRouter>
    );

    // Avatar fallback should show user initials (JS)
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should show logout option in dropdown menu', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <UserMenu />
      </BrowserRouter>
    );

    // Open dropdown
    const trigger = screen.getByRole('button', { name: /menu do usuário/i });
    await user.click(trigger);

    // Check for logout option
    expect(screen.getByText('Sair')).toBeInTheDocument();
  });

  it('should call logout and navigate to login when logout is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <UserMenu />
      </BrowserRouter>
    );

    // Open dropdown
    const trigger = screen.getByRole('button', { name: /menu do usuário/i });
    await user.click(trigger);

    // Click logout
    const logoutButton = screen.getByText('Sair');
    await user.click(logoutButton);

    // Verify logout was called
    expect(mockLogout).toHaveBeenCalledTimes(1);

    // Verify navigation to login
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('should have proper accessibility attributes', () => {
    render(
      <BrowserRouter>
        <UserMenu />
      </BrowserRouter>
    );

    const trigger = screen.getByRole('button', { name: /menu do usuário/i });
    expect(trigger).toHaveAttribute('aria-label', 'Menu do usuário');
  });

  it('should display initials correctly for multi-word names', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const state = {
        user: {
          id: 'test-user-id',
          email: 'prof@test.com',
          nome: 'Maria Santos Oliveira',
          role: 'PROFESSOR' as const,
          escola_id: 'test-escola-id',
        },
        logout: mockLogout,
      };
      return selector ? selector(state) : state;
    });

    render(
      <BrowserRouter>
        <UserMenu />
      </BrowserRouter>
    );

    // Should show first and second name initials (MS)
    expect(screen.getByText('MS')).toBeInTheDocument();
  });

  it('should display initials correctly for single-word names', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const state = {
        user: {
          id: 'test-user-id',
          email: 'admin@test.com',
          nome: 'Admin',
          role: 'ADMIN' as const,
          escola_id: 'test-escola-id',
        },
        logout: mockLogout,
      };
      return selector ? selector(state) : state;
    });

    render(
      <BrowserRouter>
        <UserMenu />
      </BrowserRouter>
    );

    // Should show first letter only (A)
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
