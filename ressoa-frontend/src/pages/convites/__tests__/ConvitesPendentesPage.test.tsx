import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvitesPendentesPage } from '../ConvitesPendentesPage';
import * as convitesApi from '@/api/convites';

vi.mock('@/api/convites');

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderPage = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ConvitesPendentesPage />
    </QueryClientProvider>,
  );
};

const mockConvites: convitesApi.ConviteListItem[] = [
  {
    id: 'conv-1',
    email: 'prof@escola.com',
    nome_completo: 'Professor Teste',
    tipo_usuario: 'professor',
    escola_id: 'escola-1',
    escola_nome: 'Escola A',
    status: 'pendente',
    expira_em: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12h from now
    criado_em: '2026-02-14T10:00:00Z',
    aceito_em: null,
    dados_extras: null,
  },
  {
    id: 'conv-2',
    email: 'coord@escola.com',
    nome_completo: 'Coordenador Teste',
    tipo_usuario: 'coordenador',
    escola_id: 'escola-1',
    escola_nome: 'Escola A',
    status: 'aceito',
    expira_em: '2026-02-13T10:00:00Z',
    criado_em: '2026-02-12T10:00:00Z',
    aceito_em: '2026-02-12T15:00:00Z',
    dados_extras: null,
  },
  {
    id: 'conv-3',
    email: 'expired@escola.com',
    nome_completo: 'Expirado Teste',
    tipo_usuario: 'professor',
    escola_id: 'escola-1',
    escola_nome: 'Escola A',
    status: 'expirado',
    expira_em: '2026-02-10T10:00:00Z',
    criado_em: '2026-02-09T10:00:00Z',
    aceito_em: null,
    dados_extras: null,
  },
];

describe('ConvitesPendentesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title and convites table with data', async () => {
    vi.mocked(convitesApi.fetchConvites).mockResolvedValue({
      data: mockConvites,
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });

    renderPage();

    // Title renders immediately
    expect(screen.getByText('Convites Pendentes')).toBeInTheDocument();

    // Data renders after async fetch
    expect(await screen.findByText('prof@escola.com')).toBeInTheDocument();
    expect(screen.getByText('coord@escola.com')).toBeInTheDocument();

    // Badges
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Aceito')).toBeInTheDocument();
    expect(screen.getAllByText('Professor').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Coordenador')).toBeInTheDocument();
    expect(screen.getAllByText('Expirado').length).toBeGreaterThanOrEqual(1);
  });

  it('should show empty state when no convites exist', async () => {
    vi.mocked(convitesApi.fetchConvites).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });

    renderPage();

    expect(await screen.findByText('Nenhum convite encontrado')).toBeInTheDocument();
  });

  it('should enable Reenviar button for expired invites', async () => {
    vi.mocked(convitesApi.fetchConvites).mockResolvedValue({
      data: mockConvites,
      pagination: { page: 1, limit: 20, total: 3, pages: 1 },
    });

    renderPage();

    await screen.findByText('expired@escola.com');

    // Get all Reenviar buttons
    const reenviarButtons = screen.getAllByRole('button', { name: 'Reenviar' });

    // The expired invite button (conv-3) should be enabled
    // The accepted invite button (conv-2) should be disabled
    const expiredRowButton = reenviarButtons[2]; // conv-3 is last
    const acceptedRowButton = reenviarButtons[1]; // conv-2 is middle

    expect(expiredRowButton).not.toBeDisabled();
    expect(acceptedRowButton).toBeDisabled();
  });

  it('should disable Reenviar button for accepted invites', async () => {
    vi.mocked(convitesApi.fetchConvites).mockResolvedValue({
      data: [mockConvites[1]], // only aceito convite
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });

    renderPage();

    await screen.findByText('coord@escola.com');

    const reenviarButton = screen.getByRole('button', { name: 'Reenviar' });
    expect(reenviarButton).toBeDisabled();
  });
});
