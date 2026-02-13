import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CoberturaPessoalPage } from './CoberturaPessoalPage';
import api from '@/lib/api';

/**
 * Simplified tests for CoberturaPessoalPage - Story 11.8
 * Note: Radix UI Select interactions are limited in JSDOM (see TESTING_NOTES_RADIX_SELECT.md)
 * This suite focuses on rendering and data display validation
 */

// Mock API
vi.mock('@/lib/api');

const mockApiGet = vi.mocked(api.get);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('CoberturaPessoalPage - Story 11.8 Simplified Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCoberturaBNCC = [
    {
      turma_id: 'turma-1',
      turma_nome: '6A',
      curriculo_tipo: 'BNCC',
      disciplina: 'MATEMATICA',
      bimestre: 1,
      habilidades_planejadas: 30,
      habilidades_trabalhadas: 21,
      percentual_cobertura: 70,
    },
  ];

  const mockCoberturaCustom = [
    {
      turma_id: 'turma-2',
      turma_nome: 'Prep Enem - Matemática',
      curriculo_tipo: 'CUSTOM',
      disciplina: 'MATEMATICA',
      bimestre: 1,
      habilidades_planejadas: 25,
      habilidades_trabalhadas: 20,
      percentual_cobertura: 80,
    },
  ];

  const mockCoberturaAll = [...mockCoberturaBNCC, ...mockCoberturaCustom];

  it('Test 1: Renderiza filtro de tipo de currículo com valor padrão "Todos" (AC1)', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        cobertura: mockCoberturaBNCC,
        stats: { total_turmas: 1, media_cobertura: 70, turmas_abaixo_meta: 0 },
      },
    });

    render(<CoberturaPessoalPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Minha Cobertura Curricular')).toBeInTheDocument();
    });

    // Verify curriculo tipo filter exists by checking default value "Todos"
    const todosButtons = screen.getAllByText('Todos');
    expect(todosButtons.length).toBeGreaterThan(0); // At least one "Todos" button exists
  });

  it('Test 2: Renderiza badge BNCC com cor azul (AC2)', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        cobertura: mockCoberturaBNCC,
        stats: { total_turmas: 1, media_cobertura: 70, turmas_abaixo_meta: 0 },
      },
    });

    render(<CoberturaPessoalPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('6A')).toBeInTheDocument();
    });

    // Check BNCC badge
    const bnccBadge = screen.getByText('BNCC');
    expect(bnccBadge).toBeInTheDocument();
    expect(bnccBadge).toHaveClass('bg-tech-blue');
  });

  it('Test 3: Renderiza badge CUSTOM com cor roxa (AC2)', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        cobertura: mockCoberturaCustom,
        stats: { total_turmas: 1, media_cobertura: 80, turmas_abaixo_meta: 0 },
      },
    });

    render(<CoberturaPessoalPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Prep Enem - Matemática')).toBeInTheDocument();
    });

    // Check CUSTOM badge
    const customBadge = screen.getByText('Curso Customizado');
    expect(customBadge).toBeInTheDocument();
    expect(customBadge).toHaveClass('bg-purple-600');
  });

  it('Test 4: Exibe label "% Cobertura Geral" quando filtro é TODOS (AC3)', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        cobertura: mockCoberturaAll,
        stats: { total_turmas: 2, media_cobertura: 75, turmas_abaixo_meta: 0 },
      },
    });

    render(<CoberturaPessoalPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('% Cobertura Geral')).toBeInTheDocument();
    });
  });

  it('Test 5: Renderiza ambas turmas (BNCC + CUSTOM) quando filtro é TODOS (AC7)', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        cobertura: mockCoberturaAll,
        stats: { total_turmas: 2, media_cobertura: 75, turmas_abaixo_meta: 0 },
      },
    });

    render(<CoberturaPessoalPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('6A')).toBeInTheDocument();
      expect(screen.getByText('Prep Enem - Matemática')).toBeInTheDocument();
    });

    // Verify both badges are present
    expect(screen.getByText('BNCC')).toBeInTheDocument();
    expect(screen.getByText('Curso Customizado')).toBeInTheDocument();
  });

  it('Test 6: Renderiza stats agregados corretamente', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        cobertura: mockCoberturaAll,
        stats: {
          total_turmas: 2,
          media_cobertura: 75,
          turmas_abaixo_meta: 0,
        },
      },
    });

    render(<CoberturaPessoalPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total de Turmas')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('Turmas Abaixo da Meta')).toBeInTheDocument();
    });
  });

  it('Test 7: Exibe mensagem quando não há turmas', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        cobertura: [],
        stats: { total_turmas: 0, media_cobertura: 0, turmas_abaixo_meta: 0 },
      },
    });

    render(<CoberturaPessoalPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText('Nenhuma turma encontrada para os filtros selecionados.')
      ).toBeInTheDocument();
    });
  });

  it('Test 8: API é chamada sem curriculo_tipo quando filtro é TODOS', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        cobertura: mockCoberturaAll,
        stats: { total_turmas: 2, media_cobertura: 75, turmas_abaixo_meta: 0 },
      },
    });

    render(<CoberturaPessoalPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(
        '/professores/me/cobertura',
        expect.objectContaining({
          params: expect.objectContaining({
            curriculo_tipo: undefined, // TODOS should not send filter
          }),
        })
      );
    });
  });
});
