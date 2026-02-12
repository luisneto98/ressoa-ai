import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useIsTablet } from '@/hooks/useMediaQuery';
import * as navigationConfig from './navigation-config';

// Mock hooks
vi.mock('@/stores/auth.store');
vi.mock('@/stores/ui.store');
vi.mock('@/hooks/useMediaQuery');

describe('Sidebar', () => {
  const mockAutoCollapseSidebar = vi.fn();
  const mockToggleSidebar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Spy on real navigation config
    vi.spyOn(navigationConfig, 'getNavigationForRole');

    // Default auth state - Zustand selector pattern
    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const state = {
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
      };
      return selector ? selector(state) : state;
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

    // Items from real navigation config for PROFESSOR
    expect(screen.getByText('Minhas Aulas')).toBeInTheDocument();
    expect(screen.getByText('Nova Aula')).toBeInTheDocument();
    expect(screen.getByText('Planejamentos')).toBeInTheDocument();
    expect(screen.getByText('Minha Cobertura')).toBeInTheDocument();
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

  describe('CTA Button (Story 9.4)', () => {
    it('should render CTA as second navigation item (after Minhas Aulas)', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
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
        };
        return selector ? selector(state) : state;
      });

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const allLinks = screen.getAllByRole('link');
      // Index 0 is logo link (if exists), or first nav item
      // Verify "Nova Aula" appears before "Planejamentos"
      const novaAulaIndex = allLinks.findIndex((link) => link.textContent === 'Nova Aula');
      const planejamentosIndex = allLinks.findIndex((link) => link.textContent === 'Planejamentos');

      expect(novaAulaIndex).toBeGreaterThan(-1);
      expect(novaAulaIndex).toBeLessThan(planejamentosIndex);
    });

    it('should render CTA button "Nova Aula" for PROFESSOR role with orange background', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
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
        };
        return selector ? selector(state) : state;
      });

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      // Verificar que "Nova Aula" está presente
      const ctaButton = screen.getByRole('link', { name: /nova aula/i });
      expect(ctaButton).toBeInTheDocument();

      // Verificar que tem estilo CTA (classe bg-focus-orange)
      expect(ctaButton).toHaveClass('bg-focus-orange');
      expect(ctaButton).toHaveClass('text-white');
      expect(ctaButton).toHaveClass('shadow-lg');
    });

    it('should NOT render CTA button for COORDENADOR role', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          user: {
            id: 'test-id',
            email: 'test@test.com',
            nome: 'Test User',
            role: 'COORDENADOR',
            escola_id: 'escola-1',
          },
          accessToken: 'token',
          refreshToken: 'refresh',
          login: vi.fn(),
          logout: vi.fn(),
        };
        return selector ? selector(state) : state;
      });

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      // Verificar que "Nova Aula" NÃO está presente
      expect(screen.queryByRole('link', { name: /nova aula/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Nova Aula')).not.toBeInTheDocument();
    });

    it('should NOT render CTA button for DIRETOR role', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          user: {
            id: 'test-id',
            email: 'test@test.com',
            nome: 'Test User',
            role: 'DIRETOR',
            escola_id: 'escola-1',
          },
          accessToken: 'token',
          refreshToken: 'refresh',
          login: vi.fn(),
          logout: vi.fn(),
        };
        return selector ? selector(state) : state;
      });

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      // Verificar que "Nova Aula" NÃO está presente
      expect(screen.queryByRole('link', { name: /nova aula/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Nova Aula')).not.toBeInTheDocument();
    });

    it('should NOT render CTA button for ADMIN role', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          user: {
            id: 'test-id',
            email: 'test@test.com',
            nome: 'Test User',
            role: 'ADMIN',
            escola_id: 'escola-1',
          },
          accessToken: 'token',
          refreshToken: 'refresh',
          login: vi.fn(),
          logout: vi.fn(),
        };
        return selector ? selector(state) : state;
      });

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      // Verificar que "Nova Aula" NÃO está presente
      expect(screen.queryByRole('link', { name: /nova aula/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Nova Aula')).not.toBeInTheDocument();
    });
  });
});
