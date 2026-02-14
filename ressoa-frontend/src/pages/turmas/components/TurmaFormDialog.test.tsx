import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TurmaFormDialog } from './TurmaFormDialog';
import type { Turma } from '@/types/turma';

vi.mock('@/api/turmas', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/turmas')>();
  return {
    ...actual,
    fetchProfessores: vi.fn().mockResolvedValue([
      { id: 'prof-1', nome: 'Maria Silva', email: 'maria@test.com' },
    ]),
  };
});

/**
 * NOTE: Tests for Radix UI Select interactions are skipped due to JSDOM limitation
 * (pointer capture API not available in JSDOM). These interactions are verified via:
 * 1. Manual testing in real browser (Chrome/Firefox) ✅ PASSING
 * 2. Playwright E2E tests (Epic 10.9) - TO BE IMPLEMENTED
 *
 * See: ressoa-frontend/TESTING_NOTES_RADIX_SELECT.md for details
 */

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('TurmaFormDialog', () => {
  const mockOnSubmit = vi.fn();
  const mockOnOpenChange = vi.fn();

  const mockTurma: Turma = {
    id: '1',
    nome: '6º Ano A',
    tipo_ensino: 'FUNDAMENTAL',
    serie: 'SEXTO_ANO',
    disciplina: 'MATEMATICA',
    ano_letivo: 2026,
    turno: 'MATUTINO',
    escola_id: 'escola-1',
    professor_id: 'prof-1',
    professor: { id: 'prof-1', nome: 'Maria Silva', email: 'maria@test.com' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('should render with title "Nova Turma" in create mode', () => {
    renderWithProviders(
      <TurmaFormDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        mode="create"
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Nova Turma', { selector: 'h2' })).toBeInTheDocument();
  });

  it('should render with title "Editar Turma" in edit mode', () => {
    renderWithProviders(
      <TurmaFormDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        mode="edit"
        defaultValues={mockTurma}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Editar Turma', { selector: 'h2' })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <TurmaFormDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        mode="create"
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', { name: /criar turma/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate minimum name length', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <TurmaFormDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        mode="create"
        onSubmit={mockOnSubmit}
      />
    );

    const nameInput = screen.getByLabelText(/nome da turma/i);
    await user.type(nameInput, 'AB'); // Less than 3 characters

    const submitButton = screen.getByRole('button', { name: /criar turma/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/nome deve ter ao menos 3 caracteres/i)).toBeInTheDocument();
    });
  });

  // SKIPPED: JSDOM limitation (Radix Select pointer capture)
  // See TESTING_NOTES_RADIX_SELECT.md - Deferred to Playwright E2E (Epic 10.9)
  it.skip('should change Serie options when tipo_ensino changes', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <TurmaFormDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        mode="create"
        onSubmit={mockOnSubmit}
      />
    );

    // Default tipo_ensino is FUNDAMENTAL, check for Fundamental series
    const serieSelect = screen.getByLabelText(/série/i);
    await user.click(serieSelect);

    // Should show Fundamental series
    await waitFor(() => {
      expect(screen.getByText('6º Ano')).toBeInTheDocument();
    });

    // Close the select
    await user.keyboard('{Escape}');

    // Change to MEDIO
    const tipoEnsinoSelect = screen.getByLabelText(/tipo de ensino/i);
    await user.click(tipoEnsinoSelect);

    await waitFor(() => {
      expect(screen.getByText('Médio')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Médio'));

    // Open serie select again
    await user.click(serieSelect);

    // Should now show Médio series
    await waitFor(() => {
      expect(screen.getByText('1º Ano (EM)')).toBeInTheDocument();
    });
  });

  it('should pre-fill form in edit mode', () => {
    renderWithProviders(
      <TurmaFormDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        mode="edit"
        defaultValues={mockTurma}
        onSubmit={mockOnSubmit}
      />
    );

    const nameInput = screen.getByLabelText(/nome da turma/i) as HTMLInputElement;
    expect(nameInput.value).toBe('6º Ano A');

    const anoLetivoInput = screen.getByLabelText(/ano letivo/i) as HTMLInputElement;
    expect(anoLetivoInput.value).toBe('2026');
  });

  // SKIPPED: JSDOM limitation (Radix Select pointer capture)
  // See TESTING_NOTES_RADIX_SELECT.md - Deferred to Playwright E2E (Epic 10.9)
  it.skip('should call onSubmit with correct data', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <TurmaFormDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        mode="create"
        onSubmit={mockOnSubmit}
      />
    );

    // Fill form
    const nameInput = screen.getByLabelText(/nome da turma/i);
    await user.type(nameInput, '6º Ano B');

    const anoLetivoInput = screen.getByLabelText(/ano letivo/i);
    await user.clear(anoLetivoInput);
    await user.type(anoLetivoInput, '2026');

    // Select disciplina
    const disciplinaSelect = screen.getByLabelText(/disciplina/i);
    await user.click(disciplinaSelect);
    await waitFor(() => {
      expect(screen.getByText('Matemática')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Matemática'));

    // Submit
    const submitButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    const submittedData = mockOnSubmit.mock.calls[0][0];
    expect(submittedData.nome).toBe('6º Ano B');
    expect(submittedData.ano_letivo).toBe(2026);
    expect(submittedData.disciplina).toBe('MATEMATICA');
  });

  it('should display loading state when isLoading is true', () => {
    renderWithProviders(
      <TurmaFormDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        mode="create"
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /criando/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
  });

  // ===== Story 11.5: Contexto Pedagógico Tests =====

  describe('Contexto Pedagógico - Story 11.5', () => {
    it('should render curriculo tipo radio group with BNCC and CUSTOM options', () => {
      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Tipo de Currículo *')).toBeInTheDocument();
      expect(screen.getByLabelText(/BNCC/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Curso Customizado/i)).toBeInTheDocument();
    });

    it('should have BNCC selected by default', () => {
      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const bnccRadio = screen.getByRole('radio', { name: /BNCC/i });
      expect(bnccRadio).toBeChecked();
    });

    it('should hide contexto pedagogico fields when curriculo_tipo = BNCC', () => {
      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByText('Contexto Pedagógico')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Objetivo Geral do Curso/i)).not.toBeInTheDocument();
    });

    it('should show contexto pedagogico fields when curriculo_tipo = CUSTOM', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const customRadio = screen.getByRole('radio', { name: /Curso Customizado/i });
      await user.click(customRadio);

      await waitFor(() => {
        expect(screen.getByText('Contexto Pedagógico')).toBeInTheDocument();
        // Use getAllByLabelText since FormFieldWithTooltip may create multiple labels
        expect(screen.getAllByLabelText(/Objetivo Geral do Curso/i).length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText(/Público-Alvo/i).length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText(/Metodologia de Ensino/i).length).toBeGreaterThan(0);
        expect(screen.getByLabelText(/Carga Horária Total/i)).toBeInTheDocument();
      });
    });

    it('should hide contexto when switching from CUSTOM to BNCC', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const customRadio = screen.getByRole('radio', { name: /Curso Customizado/i });
      await user.click(customRadio);

      await waitFor(() => {
        expect(screen.getByText('Contexto Pedagógico')).toBeInTheDocument();
      });

      const bnccRadio = screen.getByRole('radio', { name: /BNCC/i });
      await user.click(bnccRadio);

      await waitFor(() => {
        expect(screen.queryByText('Contexto Pedagógico')).not.toBeInTheDocument();
      });
    });

    it('should validate objetivo_geral min/max length', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByRole('radio', { name: /Curso Customizado/i }));

      await waitFor(() => {
        expect(screen.getAllByLabelText(/Objetivo Geral do Curso/i).length).toBeGreaterThan(0);
      });

      // Get the textarea element (there may be multiple label elements due to tooltip)
      const objetivoInput = screen.getAllByLabelText(/Objetivo Geral do Curso/i)[0] as HTMLTextAreaElement;

      // Test min (less than 100)
      await user.type(objetivoInput, 'Texto curto');
      const submitButton = screen.getByRole('button', { name: /criar turma/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/no mínimo 100 caracteres/i)).toBeInTheDocument();
      });
    });

    it('should show character counter for objetivo_geral', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByRole('radio', { name: /Curso Customizado/i }));

      await waitFor(() => {
        expect(screen.getByText(/0\/500 caracteres/i)).toBeInTheDocument();
      });

      // Use getByRole to target the textarea specifically (not the tooltip icon)
      const objetivoInput = screen.getByRole('textbox', { name: /Objetivo Geral do Curso/i });
      await user.type(objetivoInput, 'Teste');

      await waitFor(() => {
        expect(screen.getByText(/5\/500 caracteres/i)).toBeInTheDocument();
      });
    });

    it('should validate carga_horaria_total range (8-1000)', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByRole('radio', { name: /Curso Customizado/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Carga Horária Total/i)).toBeInTheDocument();
      });

      const cargaInput = screen.getByLabelText(/Carga Horária Total/i) as HTMLInputElement;

      // Verify input has min/max attributes
      expect(cargaInput).toHaveAttribute('min', '8');
      expect(cargaInput).toHaveAttribute('max', '1000');
      expect(cargaInput.type).toBe('number');

      // Verify helper text is present
      expect(screen.getByText(/min: 8h, max: 1000h/i)).toBeInTheDocument();
    });

    it('should NOT validate contexto if curriculo_tipo = BNCC', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // BNCC is selected by default
      const nameInput = screen.getByLabelText(/nome da turma/i);
      await user.type(nameInput, 'Matemática 6º A');

      // Contexto should not be visible or validated
      expect(screen.queryByText('Contexto Pedagógico')).not.toBeInTheDocument();
    });

    it('should prefill contexto pedagogico when editing CUSTOM turma', () => {
      const mockCustomTurma: Turma = {
        ...mockTurma,
        curriculo_tipo: 'CUSTOM',
        contexto_pedagogico: {
          objetivo_geral: 'Preparar candidatos para PM-SP 2026',
          publico_alvo: 'Jovens 18-25 anos',
          metodologia: 'Simulados semanais',
          carga_horaria_total: 120,
        },
      };

      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="edit"
          defaultValues={mockCustomTurma}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('radio', { name: /Curso Customizado/i })).toBeChecked();
      expect(screen.getByDisplayValue('Preparar candidatos para PM-SP 2026')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jovens 18-25 anos')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Simulados semanais')).toBeInTheDocument();
      expect(screen.getByDisplayValue('120')).toBeInTheDocument();
    });

    it('should allow switching from CUSTOM to BNCC and hide contexto (AC7)', async () => {
      const user = userEvent.setup();
      const mockCustomTurma: Turma = {
        ...mockTurma,
        curriculo_tipo: 'CUSTOM',
        contexto_pedagogico: {
          objetivo_geral: 'Preparar candidatos para PM-SP 2026',
          publico_alvo: 'Jovens 18-25 anos',
          metodologia: 'Simulados semanais',
          carga_horaria_total: 120,
        },
      };

      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="edit"
          defaultValues={mockCustomTurma}
          onSubmit={mockOnSubmit}
        />
      );

      // Verify CUSTOM is selected and contexto is visible
      expect(screen.getByRole('radio', { name: /Curso Customizado/i })).toBeChecked();
      expect(screen.getByText('Contexto Pedagógico')).toBeInTheDocument();

      // Switch to BNCC
      const bnccRadio = screen.getByRole('radio', { name: /BNCC/i });
      await user.click(bnccRadio);

      // Verify contexto is hidden
      await waitFor(() => {
        expect(screen.queryByText('Contexto Pedagógico')).not.toBeInTheDocument();
      });

      // Verify BNCC is selected
      expect(bnccRadio).toBeChecked();
    });

    it('should show character counter at max length (maxLength attribute prevents exceeding)', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TurmaFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByRole('radio', { name: /Curso Customizado/i }));

      await waitFor(() => {
        expect(screen.getAllByLabelText(/Objetivo Geral do Curso/i).length).toBeGreaterThan(0);
      });

      // Get the textarea element (there may be multiple label elements due to tooltip)
      const objetivoInput = screen.getAllByLabelText(/Objetivo Geral do Curso/i)[0] as HTMLTextAreaElement;

      // Type text up to 500 characters (maxLength prevents exceeding)
      // Note: HTML textarea maxLength attribute prevents typing beyond limit
      const longText = 'a'.repeat(500);
      await user.type(objetivoInput, longText);

      await waitFor(() => {
        // Counter shows 500/500 (maxLength prevents exceeding)
        const counter = screen.getByText(/500\/500 caracteres/i);
        expect(counter).toBeInTheDocument();
        // At exactly maxLength, counter should still be gray (not exceeding)
        expect(counter).toHaveClass('text-gray-500');
      });
    });
  });
});
