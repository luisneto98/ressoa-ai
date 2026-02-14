import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { EditUsuarioDialog } from '../EditUsuarioDialog';
import { apiClient } from '@/api/axios';

vi.mock('@/api/axios');

const mockUsuario = {
  id: 'user-uuid-1',
  nome: 'Professor Teste',
  email: 'prof@escola.com',
  role: 'PROFESSOR',
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderDialog = (
  props: Partial<Parameters<typeof EditUsuarioDialog>[0]> = {},
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
        <EditUsuarioDialog {...defaultProps} />
      </QueryClientProvider>,
    ),
    onOpenChange: defaultProps.onOpenChange,
  };
};

describe('EditUsuarioDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC12 Test 1: Renderiza dialog com dados pré-preenchidos
  it('should render dialog with pre-filled user data', () => {
    renderDialog();

    expect(screen.getByText('Editar Usuário')).toBeInTheDocument();

    const nomeInput = screen.getByLabelText('Nome') as HTMLInputElement;
    expect(nomeInput.value).toBe('Professor Teste');

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(emailInput.value).toBe('prof@escola.com');

    expect(
      screen.getByText((_, el) => el?.textContent === 'Altere os dados do usuário Professor Teste.'),
    ).toBeInTheDocument();
  });

  // AC12 Test 2: Validação inline em campo nome (mínimo 3 chars)
  it('should show inline validation error when nome is too short', async () => {
    const user = userEvent.setup();
    renderDialog();

    const nomeInput = screen.getByLabelText('Nome');

    await user.clear(nomeInput);
    await user.type(nomeInput, 'AB');
    // Trigger blur to ensure validation fires
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Mínimo 3 caracteres')).toBeInTheDocument();
    });
  });

  // AC12 Test 3: Validação inline em campo email (formato inválido)
  it('should show inline validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderDialog();

    const emailInput = screen.getByLabelText('Email');

    await user.clear(emailInput);
    await user.type(emailInput, 'not-an-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
  });

  // AC12 Test 4: Botão "Salvar" desabilitado sem alterações
  it('should have Save button disabled when no changes are made', () => {
    renderDialog();

    const saveButton = screen.getByRole('button', { name: 'Salvar' });
    expect(saveButton).toBeDisabled();
  });

  // AC12 Test 5: Submit com sucesso fecha dialog e mostra toast
  it('should close dialog on successful submit', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: {
        id: mockUsuario.id,
        nome: 'Professor Atualizado',
        email: mockUsuario.email,
        role: 'PROFESSOR',
        created_at: '2026-02-01T10:00:00Z',
        updated_at: '2026-02-14T10:00:00Z',
      },
    });

    const { onOpenChange } = renderDialog();

    const nomeInput = screen.getByLabelText('Nome');
    await user.clear(nomeInput);
    await user.type(nomeInput, 'Professor Atualizado');

    const saveButton = screen.getByRole('button', { name: 'Salvar' });
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      `/usuarios/${mockUsuario.id}`,
      expect.objectContaining({ nome: 'Professor Atualizado' }),
    );
  });

  // AC12 Test 6: Erro 409 mostra mensagem inline no campo email
  it('should show inline error on email field when server returns 409', async () => {
    const user = userEvent.setup();
    const axiosError = new AxiosError(
      'Conflict',
      '409',
      undefined,
      undefined,
      { status: 409, data: { message: 'Email já cadastrado nesta escola' }, statusText: 'Conflict', headers: {}, config: { headers: new AxiosHeaders() } },
    );
    vi.mocked(apiClient.patch).mockRejectedValue(axiosError);

    renderDialog();

    const emailInput = screen.getByLabelText('Email');
    await user.clear(emailInput);
    await user.type(emailInput, 'outro@escola.com');

    const saveButton = screen.getByRole('button', { name: 'Salvar' });
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Email já cadastrado nesta escola'),
      ).toBeInTheDocument();
    });
  });
});
