import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Step2SelecaoHabilidades } from './Step2SelecaoHabilidades';
import { usePlanejamentoWizard } from '../hooks/usePlanejamentoWizard';
import { useHabilidades } from '../hooks/useHabilidades';
import type { Turma, Habilidade } from '../hooks/usePlanejamentoWizard';

// Mock hooks
vi.mock('../hooks/usePlanejamentoWizard');
vi.mock('../hooks/useHabilidades');
vi.mock('../../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}));

const mockUsePlanejamentoWizard = vi.mocked(usePlanejamentoWizard);
const mockUseHabilidades = vi.mocked(useHabilidades);

describe('Step2SelecaoHabilidades - Story 10.5: Ensino Médio Support', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const mockTurmaFundamental: Turma = {
    id: 'turma-1',
    nome: '6º Ano A',
    disciplina: 'MATEMATICA',
    serie: 'SEXTO_ANO',
    ano_letivo: 2026,
    tipo_ensino: 'FUNDAMENTAL',
  };

  const mockTurmaMedio: Turma = {
    id: 'turma-2',
    nome: '1º Ano EM',
    disciplina: 'MATEMATICA',
    serie: 'PRIMEIRO_ANO_EM',
    ano_letivo: 2026,
    tipo_ensino: 'MEDIO',
  };

  const mockHabilidadesEF: Habilidade[] = [
    {
      id: 'hab-1',
      codigo: 'EF06MA01',
      descricao: 'Comparar números naturais...',
      unidade_tematica: 'Números',
    },
  ];

  const mockHabilidadesEM: Habilidade[] = [
    {
      id: 'hab-em-1',
      codigo: 'EM13MAT101',
      descricao: 'Interpretar situações econômicas...',
      competencia_especifica: 'Competência Específica 1',
      metadata: {
        area_conhecimento: 'Matemática e suas Tecnologias',
      },
    },
  ];

  const defaultWizardState = {
    currentStep: 2 as const,
    formData: {
      turma_id: 'turma-1',
      turma: mockTurmaFundamental,
      bimestre: 1,
      ano_letivo: 2026,
    },
    selectedHabilidades: [],
    setCurrentStep: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    setFormData: vi.fn(),
    toggleHabilidade: vi.fn(),
    removeHabilidade: vi.fn(),
    reset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Default wizard state
    mockUsePlanejamentoWizard.mockReturnValue(defaultWizardState);

    // Default habilidades hook (successful query)
    mockUseHabilidades.mockReturnValue({
      data: mockHabilidadesEF,
      isLoading: false,
      error: null,
      isError: false,
      refetch: vi.fn(),
      // Add other React Query props as needed
    } as any);
  });

  describe('AC4: tipo_ensino detection and query params', () => {
    it('should pass tipo_ensino=MEDIO to useHabilidades when turma is EM', () => {
      // Arrange
      mockUsePlanejamentoWizard.mockReturnValue({
        ...defaultWizardState,
        formData: {
          ...defaultWizardState.formData,
          turma: mockTurmaMedio,
        },
      });

      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      expect(mockUseHabilidades).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_ensino: 'MEDIO',
          disciplina: 'MATEMATICA',
        })
      );
    });

    it('should pass tipo_ensino=FUNDAMENTAL to useHabilidades when turma is EF', () => {
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      expect(mockUseHabilidades).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_ensino: 'FUNDAMENTAL',
          disciplina: 'MATEMATICA',
          serie: 6, // SEXTO_ANO mapped to 6
        })
      );
    });

    it('should assume tipo_ensino=FUNDAMENTAL when turma has no tipo_ensino (backward compat)', () => {
      // Arrange
      const turmaWithoutTipoEnsino: Turma = {
        ...mockTurmaFundamental,
        tipo_ensino: undefined,
      };

      mockUsePlanejamentoWizard.mockReturnValue({
        ...defaultWizardState,
        formData: {
          ...defaultWizardState.formData,
          turma: turmaWithoutTipoEnsino,
        },
      });

      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      expect(mockUseHabilidades).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_ensino: 'FUNDAMENTAL', // Default when undefined
        })
      );
    });

    it('should NOT pass serie when tipo_ensino=MEDIO (EM is transversal)', () => {
      // Arrange
      mockUsePlanejamentoWizard.mockReturnValue({
        ...defaultWizardState,
        formData: {
          ...defaultWizardState.formData,
          turma: mockTurmaMedio,
        },
      });

      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      expect(mockUseHabilidades).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_ensino: 'MEDIO',
          serie: undefined, // Serie NOT passed for EM
        })
      );
    });

    it('should pass serie when tipo_ensino=FUNDAMENTAL', () => {
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      expect(mockUseHabilidades).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_ensino: 'FUNDAMENTAL',
          serie: 6, // SEXTO_ANO → 6
        })
      );
    });
  });

  describe('AC5 & AC10: UI adaptation for Ensino Médio', () => {
    it('should render info card when tipo_ensino=MEDIO', () => {
      // Arrange
      mockUsePlanejamentoWizard.mockReturnValue({
        ...defaultWizardState,
        formData: {
          ...defaultWizardState.formData,
          turma: mockTurmaMedio,
        },
      });

      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      expect(
        screen.getByText(/📚 Habilidades do Ensino Médio/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /As habilidades do Ensino Médio \(BNCC\) são organizadas por áreas de conhecimento/
        )
      ).toBeInTheDocument();
    });

    it('should NOT render info card when tipo_ensino=FUNDAMENTAL', () => {
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      expect(
        screen.queryByText(/📚 Habilidades do Ensino Médio/)
      ).not.toBeInTheDocument();
    });

    it('should display "Área de Conhecimento" label when tipo_ensino=MEDIO', () => {
      // Arrange
      mockUsePlanejamentoWizard.mockReturnValue({
        ...defaultWizardState,
        formData: {
          ...defaultWizardState.formData,
          turma: mockTurmaMedio,
        },
      });

      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      expect(screen.getByLabelText(/Área de Conhecimento/)).toBeInTheDocument();
    });

    it('should display "Disciplina" label when tipo_ensino=FUNDAMENTAL', () => {
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      expect(screen.getByLabelText(/^Disciplina$/)).toBeInTheDocument();
    });

    it('should display EM area name for MATEMATICA when tipo_ensino=MEDIO', () => {
      // Arrange
      mockUsePlanejamentoWizard.mockReturnValue({
        ...defaultWizardState,
        formData: {
          ...defaultWizardState.formData,
          turma: mockTurmaMedio,
        },
      });

      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      const disciplinaInput = screen.getByDisplayValue(
        /Matemática e suas Tecnologias/
      );
      expect(disciplinaInput).toBeInTheDocument();
    });

    it('should display plain disciplina name when tipo_ensino=FUNDAMENTAL', () => {
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <Step2SelecaoHabilidades />
        </QueryClientProvider>
      );

      // Assert
      const disciplinaInput = screen.getByDisplayValue('MATEMATICA');
      expect(disciplinaInput).toBeInTheDocument();
    });
  });
});
