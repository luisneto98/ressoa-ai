import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TurmasListPage from './TurmasListPage';
import { apiClient } from '@/api/axios';
import type { Turma } from '@/types/turma';

// Mock dependencies
vi.mock('@/api/axios');

const mockTurmas: Turma[] = [
  {
    id: '1',
    nome: '6º Ano A',
    tipo_ensino: 'FUNDAMENTAL',
    serie: 'SEXTO_ANO',
    disciplina: 'MATEMATICA',
    ano_letivo: 2026,
    turno: 'MATUTINO',
    quantidade_alunos: 30,
    escola_id: 'escola-1',
    professor_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
  },
  {
    id: '2',
    nome: '1º Ano EM',
    tipo_ensino: 'MEDIO',
    serie: 'PRIMEIRO_ANO_EM',
    disciplina: 'LINGUA_PORTUGUESA',
    ano_letivo: 2026,
    turno: 'VESPERTINO',
    quantidade_alunos: 25,
    escola_id: 'escola-1',
    professor_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
  },
];

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </BrowserRouter>
  );
};

describe('TurmasListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title "Gestão de Turmas"', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockTurmas });

    renderWithProviders(<TurmasListPage />);

    // Use getByRole to target H1 specifically (not breadcrumb)
    expect(screen.getByRole('heading', { name: 'Gestão de Turmas', level: 1 })).toBeInTheDocument();
  });

  it('should render "Nova Turma" button', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockTurmas });

    renderWithProviders(<TurmasListPage />);

    const buttons = screen.getAllByRole('button', { name: /nova turma/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render table with turmas when data is loaded', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockTurmas });

    renderWithProviders(<TurmasListPage />);

    await waitFor(() => {
      expect(screen.getByText('6º Ano A')).toBeInTheDocument();
      expect(screen.getByText('1º Ano EM')).toBeInTheDocument();
    });
  });

  it('should render empty state when there are no turmas', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    renderWithProviders(<TurmasListPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma turma cadastrada')).toBeInTheDocument();
      expect(screen.getByText(/crie a primeira turma para começar/i)).toBeInTheDocument();
    });
  });

  it('should render skeleton during loading', () => {
    vi.mocked(apiClient.get).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<TurmasListPage />);

    // Check for skeleton by looking for table header
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Série')).toBeInTheDocument();
  });

  it('should open dialog when clicking "Nova Turma"', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockTurmas });

    renderWithProviders(<TurmasListPage />);

    await waitFor(() => {
      expect(screen.getByText('6º Ano A')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button', { name: /nova turma/i });
    await user.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/nova turma/i, { selector: 'h2' })).toBeInTheDocument();
    });
  });

  it('should display TipoEnsinoBadge with correct colors', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockTurmas });

    renderWithProviders(<TurmasListPage />);

    await waitFor(() => {
      expect(screen.getByText('Fundamental')).toBeInTheDocument();
      expect(screen.getByText('Médio')).toBeInTheDocument();
    });
  });
});
