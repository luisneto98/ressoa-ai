import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { ReenviarConviteDialog } from '../ReenviarConviteDialog';
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
  props: Partial<Parameters<typeof ReenviarConviteDialog>[0]> = {},
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
        <ReenviarConviteDialog {...defaultProps} />
      </QueryClientProvider>,
    ),
    onOpenChange: defaultProps.onOpenChange,
  };
};

describe('ReenviarConviteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with convite email in confirmation message', () => {
    renderDialog();

    expect(screen.getByText('Reenviar Convite', { selector: 'h2' })).toBeInTheDocument();
    expect(
      screen.getByText((_, el) =>
        el?.tagName === 'P' && (el?.textContent?.includes('professor@escola.com') ?? false),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reenviar Convite' })).toBeInTheDocument();
  });

  it('should call mutation on confirm and close dialog on success', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { message: 'Convite reenviado para professor@escola.com' },
    });

    const { onOpenChange } = renderDialog();

    const confirmButton = screen.getByRole('button', { name: 'Reenviar Convite' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      `/convites/${mockConvite.id}/reenviar`,
    );
  });

  it('should show loading state and disable buttons during request', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.post).mockImplementation(
      () => new Promise(() => {}), // never resolves - keeps loading
    );

    renderDialog();

    const confirmButton = screen.getByRole('button', { name: 'Reenviar Convite' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Reenviando...')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled();
  });

  it('should handle 400 error (already accepted) and close dialog', async () => {
    const user = userEvent.setup();
    const axiosError = new AxiosError(
      'Bad Request',
      '400',
      undefined,
      undefined,
      { status: 400, data: { message: 'Convite já aceito' }, statusText: 'Bad Request', headers: {}, config: { headers: new AxiosHeaders() } },
    );
    vi.mocked(apiClient.post).mockRejectedValue(axiosError);

    const { onOpenChange } = renderDialog();

    const confirmButton = screen.getByRole('button', { name: 'Reenviar Convite' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should handle 403 error (no permission) and close dialog', async () => {
    const user = userEvent.setup();
    const axiosError = new AxiosError(
      'Forbidden',
      '403',
      undefined,
      undefined,
      { status: 403, data: { message: 'Sem permissão' }, statusText: 'Forbidden', headers: {}, config: { headers: new AxiosHeaders() } },
    );
    vi.mocked(apiClient.post).mockRejectedValue(axiosError);

    const { onOpenChange } = renderDialog();

    const confirmButton = screen.getByRole('button', { name: 'Reenviar Convite' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should handle 404 error (not found) and close dialog', async () => {
    const user = userEvent.setup();
    const axiosError = new AxiosError(
      'Not Found',
      '404',
      undefined,
      undefined,
      { status: 404, data: { message: 'Convite não encontrado' }, statusText: 'Not Found', headers: {}, config: { headers: new AxiosHeaders() } },
    );
    vi.mocked(apiClient.post).mockRejectedValue(axiosError);

    const { onOpenChange } = renderDialog();

    const confirmButton = screen.getByRole('button', { name: 'Reenviar Convite' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
