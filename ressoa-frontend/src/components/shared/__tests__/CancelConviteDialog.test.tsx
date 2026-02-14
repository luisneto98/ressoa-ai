import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { CancelConviteDialog } from '../CancelConviteDialog';
import { apiClient } from '@/api/axios';

vi.mock('@/api/axios');

const mockConvite = {
  id: 'convite-uuid-1',
  email: 'professor@escola.com',
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderDialog = (
  props: Partial<Parameters<typeof CancelConviteDialog>[0]> = {},
) => {
  const queryClient = createTestQueryClient();
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    convite: mockConvite,
    ...props,
  };
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <CancelConviteDialog {...defaultProps} />
      </QueryClientProvider>,
    ),
    onOpenChange: defaultProps.onOpenChange,
  };
};

describe('CancelConviteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with convite email in confirmation message', () => {
    renderDialog();

    expect(screen.getByText('Cancelar Convite', { selector: 'h2' })).toBeInTheDocument();
    expect(
      screen.getByText((_, el) =>
        el?.tagName === 'P' && (el?.textContent?.includes('professor@escola.com') ?? false),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar Convite' })).toBeInTheDocument();
  });

  it('should close dialog when Voltar button is clicked', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    const voltarButton = screen.getByRole('button', { name: 'Voltar' });
    await user.click(voltarButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should close dialog on successful cancellation', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { message: 'Convite cancelado com sucesso' },
    });

    const { onOpenChange } = renderDialog();

    const confirmButton = screen.getByRole('button', { name: 'Cancelar Convite' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      `/convites/${mockConvite.id}/cancelar`,
    );
  });

  it('should not close dialog on 400 error (already accepted)', async () => {
    const user = userEvent.setup();
    const axiosError = new AxiosError(
      'Bad Request',
      '400',
      undefined,
      undefined,
      { status: 400, data: { message: 'Convite já aceito' }, statusText: 'Bad Request', headers: {}, config: { headers: new AxiosHeaders() } },
    );
    vi.mocked(apiClient.patch).mockRejectedValue(axiosError);

    const { onOpenChange } = renderDialog();

    const confirmButton = screen.getByRole('button', { name: 'Cancelar Convite' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  it('should not close dialog on 409 error (already cancelled)', async () => {
    const user = userEvent.setup();
    const axiosError = new AxiosError(
      'Conflict',
      '409',
      undefined,
      undefined,
      { status: 409, data: { message: 'Convite já cancelado' }, statusText: 'Conflict', headers: {}, config: { headers: new AxiosHeaders() } },
    );
    vi.mocked(apiClient.patch).mockRejectedValue(axiosError);

    const { onOpenChange } = renderDialog();

    const confirmButton = screen.getByRole('button', { name: 'Cancelar Convite' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  it('should show loading state and disable buttons during request', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.patch).mockImplementation(
      () => new Promise(() => {}), // never resolves - keeps loading
    );

    renderDialog();

    const confirmButton = screen.getByRole('button', { name: 'Cancelar Convite' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Cancelando...')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled();
  });
});
