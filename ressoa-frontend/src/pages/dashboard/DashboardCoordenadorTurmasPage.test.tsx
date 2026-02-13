import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardCoordenadorTurmasPage } from './DashboardCoordenadorTurmasPage';
import api from '@/lib/api';

// Mock API
vi.mock('@/lib/api');

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('DashboardCoordenadorTurmasPage - Story 10.7 Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar filtro de tipo de ensino (AC #1)', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        metricas: [],
        classificacao: { criticas: 0, atencao: 0, no_ritmo: 0 },
        turmas_priorizadas: [],
      },
    });

    renderWithClient(<DashboardCoordenadorTurmasPage />);

    await waitFor(() => {
      expect(screen.getByText(/Tipo de Ensino/i)).toBeInTheDocument();
      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getByText('Ensino Fundamental')).toBeInTheDocument();
      expect(screen.getByText('Ensino Médio')).toBeInTheDocument();
    });
  });

  it('deve atualizar query ao selecionar filtro tipo_ensino (AC #2)', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        metricas: [],
        classificacao: { criticas: 0, atencao: 0, no_ritmo: 0 },
        turmas_priorizadas: [],
      },
    });

    const user = userEvent.setup();
    renderWithClient(<DashboardCoordenadorTurmasPage />);

    await waitFor(() => screen.getByText(/Dashboard - Turmas/i));

    // Verificar que API foi chamada sem filtro inicial
    expect(api.get).toHaveBeenCalledWith(
      '/dashboard/coordenador/turmas',
      expect.objectContaining({
        params: expect.objectContaining({ tipo_ensino: undefined }),
      })
    );

    // Simular seleção de "Ensino Médio"
    const select = screen.getAllByRole('combobox')[0]; // Primeiro select (tipo_ensino)
    await user.click(select);
    const optionEM = await screen.findByText('Ensino Médio');
    await user.click(optionEM);

    // Verificar que API foi chamada com tipo_ensino=MEDIO
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/dashboard/coordenador/turmas',
        expect.objectContaining({
          params: expect.objectContaining({ tipo_ensino: 'MEDIO' }),
        })
      );
    });
  });

  it('deve exibir empty state customizado por filtro (AC #8 - Issue #9 fix)', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        metricas: [],
        classificacao: { criticas: 0, atencao: 0, no_ritmo: 0 },
        turmas_priorizadas: [],
      },
    });

    renderWithClient(<DashboardCoordenadorTurmasPage />);

    await waitFor(() => {
      expect(screen.getByText(/Não há turmas de Ensino Médio cadastradas neste filtro/i)).toBeInTheDocument();
    });
  });

  it('deve exibir loading state durante fetch (AC #8)', () => {
    vi.mocked(api.get).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderWithClient(<DashboardCoordenadorTurmasPage />);

    expect(screen.getByText(/Carregando métricas das turmas/i)).toBeInTheDocument();
  });

  it('deve limpar filtro ao clicar em "Limpar Filtros"', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        metricas: [],
        classificacao: { criticas: 0, atencao: 0, no_ritmo: 0 },
        turmas_priorizadas: [],
      },
    });

    const user = userEvent.setup();
    renderWithClient(<DashboardCoordenadorTurmasPage />);

    await waitFor(() => screen.getByText(/Limpar Filtros/i));

    const clearButton = screen.getByText(/Limpar Filtros/i);
    await user.click(clearButton);

    // Verificar que filtros foram resetados
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/dashboard/coordenador/turmas',
        expect.objectContaining({
          params: expect.objectContaining({
            tipo_ensino: undefined,
            disciplina: undefined,
            bimestre: undefined,
          }),
        })
      );
    });
  });
});
