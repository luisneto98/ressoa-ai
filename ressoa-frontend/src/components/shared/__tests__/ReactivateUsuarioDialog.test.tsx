import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { ReactivateUsuarioDialog } from '../ReactivateUsuarioDialog';
import { apiClient } from '@/api/axios';

vi.mock('@/api/axios');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUsuario = {
  id: 'user-uuid-1',
  nome: 'Professor Teste',
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderDialog = (
  props: Partial<Parameters<typeof ReactivateUsuarioDialog>[0]> = {},
) => {
  const queryClient = createTestQueryClient();
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    usuario: mockUsuario,
    ...props,
  };
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ReactivateUsuarioDialog {...defaultProps} />
      </QueryClientProvider>,
    ),
    onOpenChange: defaultProps.onOpenChange,
  };
};

describe('ReactivateUsuarioDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Dialog renderiza com nome do usuário
  it('should render dialog with user name in confirmation message', () => {
    renderDialog();

    expect(screen.getByText('Reativar Usuário')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) =>
        el?.textContent === 'Tem certeza que deseja reativar Professor Teste? O usuário terá acesso ao sistema restaurado.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reativar' })).toBeInTheDocument();
  });

  // Test 2: Botão cancelar fecha dialog
  it('should close dialog when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // Test 3: Confirmação com sucesso
  it('should close dialog on successful reactivation', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: {
        id: mockUsuario.id,
        nome: mockUsuario.nome,
        email: 'prof@escola.com',
        role: 'PROFESSOR',
        deleted_at: null,
        created_at: '2026-02-01T10:00:00Z',
        updated_at: '2026-02-14T10:00:00Z',
      },
    });

    const { onOpenChange } = renderDialog();

    const reactivateButton = screen.getByRole('button', { name: 'Reativar' });
    await user.click(reactivateButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      `/usuarios/${mockUsuario.id}/reativar`,
    );
    expect(toast.success).toHaveBeenCalledWith('Usuário reativado com sucesso');
  });

  // Test 4: Erro 403
  it('should show error toast for 403 permission error', async () => {
    const user = userEvent.setup();
    const axiosError = new AxiosError(
      'Forbidden',
      '403',
      undefined,
      undefined,
      { status: 403, data: { message: 'Sem permissão' }, statusText: 'Forbidden', headers: {}, config: { headers: new AxiosHeaders() } },
    );
    vi.mocked(apiClient.patch).mockRejectedValue(axiosError);

    const { onOpenChange } = renderDialog();

    const reactivateButton = screen.getByRole('button', { name: 'Reativar' });
    await user.click(reactivateButton);

    await waitFor(() => {
      // Dialog should NOT close on error
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
    expect(toast.error).toHaveBeenCalledWith('Sem permissão para reativar este usuário');
  });

  // Test 5: Erro 409
  it('should handle 409 conflict error (already active)', async () => {
    const user = userEvent.setup();
    const axiosError = new AxiosError(
      'Conflict',
      '409',
      undefined,
      undefined,
      { status: 409, data: { message: 'Usuário já está ativo' }, statusText: 'Conflict', headers: {}, config: { headers: new AxiosHeaders() } },
    );
    vi.mocked(apiClient.patch).mockRejectedValue(axiosError);

    const { onOpenChange } = renderDialog();

    const reactivateButton = screen.getByRole('button', { name: 'Reativar' });
    await user.click(reactivateButton);

    await waitFor(() => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
    expect(toast.error).toHaveBeenCalledWith('Usuário já está ativo');
  });

  // Test 6: Loading state
  it('should show loading state and disable button during request', async () => {
    const user = userEvent.setup();
    // Mock a delayed response to observe loading state
    vi.mocked(apiClient.patch).mockImplementation(
      () => new Promise(() => {}), // never resolves - keeps loading
    );

    renderDialog();

    const reactivateButton = screen.getByRole('button', { name: 'Reativar' });
    await user.click(reactivateButton);

    await waitFor(() => {
      expect(screen.getByText('Reativando...')).toBeInTheDocument();
    });

    // Cancel button should be disabled during loading
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
