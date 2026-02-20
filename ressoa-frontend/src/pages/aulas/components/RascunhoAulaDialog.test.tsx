import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RascunhoAulaDialog } from './RascunhoAulaDialog';
import * as useCreateRascunhoModule from '@/hooks/useCreateRascunho';

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockImplementation(({ queryKey }) => {
    if (queryKey[0] === 'turmas') {
      return {
        data: [
          { id: 'turma-1', nome: '6A', ano: '6', disciplina: 'MATEMATICA' },
          { id: 'turma-2', nome: '7B', ano: '7', disciplina: 'LINGUA_PORTUGUESA' },
        ],
        isLoading: false,
      };
    }
    return { data: [], isLoading: false };
  }),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/hooks/useCreateRascunho', () => ({
  useCreateRascunho: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const mockOnOpenChange = vi.fn();

describe('RascunhoAulaDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateRascunhoModule.useCreateRascunho).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it('deve renderizar o formulário quando aberto', () => {
    render(<RascunhoAulaDialog open={true} onOpenChange={mockOnOpenChange} />);

    // Title appears in the dialog header
    expect(screen.getAllByText('Planejar Aula').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Turma *')).toBeInTheDocument();
    expect(screen.getByText('Data da Aula *')).toBeInTheDocument();
    expect(screen.getByText('Objetivo da Aula (opcional)')).toBeInTheDocument();
  });

  it('não deve renderizar quando fechado', () => {
    const { container } = render(
      <RascunhoAulaDialog open={false} onOpenChange={mockOnOpenChange} />,
    );
    // Dialog should not show content when closed
    expect(screen.queryByText('Turma *')).not.toBeInTheDocument();
  });

  it('deve mostrar contador de caracteres para descrição', () => {
    render(<RascunhoAulaDialog open={true} onOpenChange={mockOnOpenChange} />);
    // Initial counter should show 0/2000
    expect(screen.getByText('0/2000')).toBeInTheDocument();
  });

  it('deve atualizar contador ao digitar na descrição', async () => {
    render(<RascunhoAulaDialog open={true} onOpenChange={mockOnOpenChange} />);

    const textarea = screen.getByPlaceholderText(/revisar frações decimais/i);
    fireEvent.change(textarea, { target: { value: 'Objetivo de teste' } });

    await waitFor(() => {
      expect(screen.getByText('17/2000')).toBeInTheDocument();
    });
  });

  it('deve exibir lista de turmas no select', () => {
    render(<RascunhoAulaDialog open={true} onOpenChange={mockOnOpenChange} />);

    // The turmas select should be available
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('deve ter botão "Planejar Aula" para submit', () => {
    render(<RascunhoAulaDialog open={true} onOpenChange={mockOnOpenChange} />);
    const submitButton = screen.getByRole('button', { name: /Planejar Aula/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('deve ter botão "Cancelar"', () => {
    render(<RascunhoAulaDialog open={true} onOpenChange={mockOnOpenChange} />);
    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    expect(cancelButton).toBeInTheDocument();
  });

  it('botão Cancelar deve chamar onOpenChange(false)', () => {
    render(<RascunhoAulaDialog open={true} onOpenChange={mockOnOpenChange} />);
    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelButton);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('deve exibir estado "Salvando..." quando isPending=true', () => {
    vi.mocked(useCreateRascunhoModule.useCreateRascunho).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    render(<RascunhoAulaDialog open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByRole('button', { name: /Salvando.../i })).toBeInTheDocument();
  });
});
