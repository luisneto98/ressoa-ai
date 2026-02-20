import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Step1DadosGerais } from './Step1DadosGerais';
import { usePlanejamentoWizard } from '../hooks/usePlanejamentoWizard';
import { useTurmas } from '../hooks/useTurmas';

// Mock hooks
vi.mock('../hooks/usePlanejamentoWizard');
vi.mock('../hooks/useTurmas');

const mockUsePlanejamentoWizard = vi.mocked(usePlanejamentoWizard);
const mockUseTurmas = vi.mocked(useTurmas);

describe('Step1DadosGerais - Story 16.1: campo descricao', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const mockSetFormData = vi.fn();
  const mockNextStep = vi.fn();

  const defaultWizardState = {
    currentStep: 1 as const,
    formData: {
      turma_id: '',
      bimestre: 1,
      ano_letivo: 2026,
    },
    selectedHabilidades: [],
    setCurrentStep: vi.fn(),
    nextStep: mockNextStep,
    prevStep: vi.fn(),
    setFormData: mockSetFormData,
    toggleHabilidade: vi.fn(),
    removeHabilidade: vi.fn(),
    reset: vi.fn(),
  };

  const mockTurmas = [
    {
      id: 'turma-1',
      nome: '6º Ano A',
      disciplina: 'MATEMATICA',
      serie: 'SEXTO_ANO',
      ano_letivo: 2026,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlanejamentoWizard.mockReturnValue(defaultWizardState);
    mockUseTurmas.mockReturnValue({
      data: mockTurmas,
      isLoading: false,
    } as any);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Step1DadosGerais />
      </QueryClientProvider>,
    );

  it('✅ AC5 (Story 16.1): deve renderizar Textarea de descrição', () => {
    renderComponent();

    const textarea = screen.getByRole('textbox', { name: /descrição do planejamento/i });
    expect(textarea).toBeInTheDocument();
  });

  it('✅ AC5 (Story 16.1): deve exibir label "Descrição do Planejamento (opcional)"', () => {
    renderComponent();

    expect(
      screen.getByText(/Descrição do Planejamento \(opcional\)/i),
    ).toBeInTheDocument();
  });

  it('✅ AC5 (Story 16.1): contador de caracteres começa em 0/2000', () => {
    renderComponent();

    expect(screen.getByText('0/2000')).toBeInTheDocument();
  });

  it('✅ AC5 (Story 16.1): contador de caracteres atualiza conforme digitação', () => {
    renderComponent();

    const textarea = screen.getByRole('textbox', { name: /descrição do planejamento/i });
    fireEvent.change(textarea, { target: { value: 'Texto de exemplo' } });

    expect(screen.getByText('16/2000')).toBeInTheDocument();
  });

  it('✅ AC5 (Story 16.1): textarea tem placeholder correto', () => {
    renderComponent();

    const textarea = screen.getByPlaceholderText(/material concreto/i);
    expect(textarea).toBeInTheDocument();
  });

  it('✅ AC5 (Story 16.1): textarea tem maxLength=2000', () => {
    renderComponent();

    const textarea = screen.getByRole('textbox', { name: /descrição do planejamento/i });
    expect(textarea).toHaveAttribute('maxLength', '2000');
  });
});
