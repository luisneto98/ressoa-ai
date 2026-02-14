import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UsuariosTable } from './UsuariosTable';
import { apiClient } from '@/api/axios';

vi.mock('@/api/axios');

const mockUsuariosResponse = {
  data: [
    {
      id: '1',
      nome: 'Maria Silva',
      email: 'maria@escola.com',
      role: 'PROFESSOR',
      created_at: '2026-02-01T10:00:00Z',
    },
    {
      id: '2',
      nome: 'João Santos',
      email: 'joao@escola.com',
      role: 'COORDENADOR',
      created_at: '2026-01-15T08:30:00Z',
    },
    {
      id: '3',
      nome: 'Ana Costa',
      email: 'ana@escola.com',
      role: 'PROFESSOR',
      created_at: '2026-01-10T14:00:00Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 3,
    pages: 1,
  },
};

const emptyResponse = {
  data: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
};

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
};

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </BrowserRouter>,
  );
};

describe('UsuariosTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC14 Test 1: Renderiza tabela com dados mockados
  it('should render table with mocked data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockUsuariosResponse });

    renderWithProviders(<UsuariosTable showRole roleFilterOptions={['PROFESSOR', 'COORDENADOR']} />);

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
      expect(screen.getByText('maria@escola.com')).toBeInTheDocument();
      expect(screen.getByText('João Santos')).toBeInTheDocument();
      expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    });
  });

  // AC14 Test 2: Busca com debounce atualiza queryKey
  it('should debounce search and trigger new query', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockUsuariosResponse });

    renderWithProviders(<UsuariosTable showRole />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Buscar usuários por nome ou email');
    await userEvent.type(searchInput, 'maria');

    // After debounce, a new query should fire
    await waitFor(
      () => {
        const calls = vi.mocked(apiClient.get).mock.calls;
        const lastCall = calls[calls.length - 1][0] as string;
        expect(lastCall).toContain('search=maria');
      },
      { timeout: 1000 },
    );
  });

  // AC14 Test 3: Filtro de role renderiza Select e role filter options
  it('should render role filter select with correct options', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockUsuariosResponse });

    renderWithProviders(
      <UsuariosTable showRole roleFilterOptions={['PROFESSOR', 'COORDENADOR']} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    // Verify the select trigger renders with proper aria-label
    const selectTrigger = screen.getByLabelText('Filtrar por perfil');
    expect(selectTrigger).toBeInTheDocument();

    // Verify role badges are rendered in the table (2 professors, 1 coordenador)
    const professorBadges = screen.getAllByText('Professor');
    expect(professorBadges).toHaveLength(2);
    expect(screen.getByText('Coordenador')).toBeInTheDocument();

    // Verify the initial API call does NOT include role filter
    const initialCall = vi.mocked(apiClient.get).mock.calls[0][0] as string;
    expect(initialCall).not.toContain('role=');
  });

  // AC14 Test 4: Paginação funciona (next/previous)
  it('should support pagination navigation', async () => {
    const paginatedResponse = {
      data: mockUsuariosResponse.data.slice(0, 2),
      pagination: { page: 1, limit: 2, total: 5, pages: 3 },
    };

    vi.mocked(apiClient.get).mockResolvedValue({ data: paginatedResponse });

    renderWithProviders(<UsuariosTable />);

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    // Pagination should be visible
    const nextButton = screen.getByLabelText('Go to next page');
    expect(nextButton).toBeInTheDocument();

    await userEvent.click(nextButton);

    await waitFor(() => {
      const calls = vi.mocked(apiClient.get).mock.calls;
      const lastCall = calls[calls.length - 1][0] as string;
      expect(lastCall).toContain('page=2');
    });
  });

  // AC14 Test 5: Skeleton loading exibido durante fetch
  it('should show skeleton loading during fetch', async () => {
    // Delay the response to simulate loading
    vi.mocked(apiClient.get).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: mockUsuariosResponse }), 100)),
    );

    renderWithProviders(<UsuariosTable showRole roleFilterOptions={['PROFESSOR']} />);

    // Skeletons should be visible while loading
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);

    // After loading, data should appear
    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });
  });

  // AC14 Test 6: Estado vazio exibido quando lista está vazia
  it('should show empty state when no users found', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: emptyResponse });

    renderWithProviders(<UsuariosTable />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum usuário encontrado')).toBeInTheDocument();
    });
  });
});
