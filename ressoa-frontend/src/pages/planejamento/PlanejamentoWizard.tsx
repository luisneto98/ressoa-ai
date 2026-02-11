import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { usePlanejamentoWizard } from './hooks/usePlanejamentoWizard';
import { usePlanejamento } from './hooks/usePlanejamento';
import { WizardNavigation } from './components/WizardNavigation';
import { Step1DadosGerais } from './components/Step1DadosGerais';
import { Step2SelecaoHabilidades } from './components/Step2SelecaoHabilidades';
import { Step3Revisao } from './components/Step3Revisao';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanejamentoWizardProps {
  mode?: 'create' | 'edit';
}

export const PlanejamentoWizard = ({ mode = 'create' }: PlanejamentoWizardProps) => {
  const { id: planejamentoId } = useParams<{ id: string }>();
  const { currentStep, setCurrentStep, reset, setFormData, toggleHabilidade } = usePlanejamentoWizard();

  // VALIDATION: Edit mode requires planejamentoId
  if (mode === 'edit' && !planejamentoId) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro: ID do planejamento não encontrado</h1>
          <p className="text-muted-foreground mb-4">Não foi possível carregar o planejamento para edição.</p>
          <a href="/planejamentos" className="text-tech-blue hover:underline">Voltar para listagem</a>
        </div>
      </div>
    );
  }

  // Fetch planejamento data if in edit mode
  const { data: planejamento, isLoading } = usePlanejamento(mode === 'edit' ? planejamentoId : undefined);

  // Track if wizard has been initialized to prevent re-running effect
  const initializedRef = useRef(false);

  // Pre-fill wizard state in edit mode
  useEffect(() => {
    if (mode === 'edit' && planejamento && !initializedRef.current) {
      // Set form data (cast turma to match wizard type which includes ano_letivo)
      setFormData({
        turma_id: planejamento.turma_id,
        turma: {
          ...planejamento.turma,
          serie: String(planejamento.turma.serie), // Convert number to string for wizard
          ano_letivo: planejamento.ano_letivo,
        },
        bimestre: planejamento.bimestre,
        ano_letivo: planejamento.ano_letivo,
      });

      // Pre-select habilidades
      planejamento.habilidades.forEach((hab: any) => {
        const habilidadeData = {
          id: hab.habilidade_id,
          codigo: hab.habilidade.codigo,
          descricao: hab.habilidade.descricao,
        };
        toggleHabilidade(habilidadeData);
      });

      initializedRef.current = true;
    } else if (mode === 'create' && !initializedRef.current) {
      // Reset wizard for create mode
      reset();
      initializedRef.current = true;
    }
    // ESLint disable: Zustand functions are stable but ESLint doesn't know that
    // Only depend on data (mode, planejamento) to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, planejamento]);

  const handleStepClick = (step: 1 | 2 | 3) => {
    // Only allow going back to previous steps
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  // Show loading skeleton in edit mode while fetching data
  if (mode === 'edit' && isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-deep-navy">
        {mode === 'create' ? 'Novo Planejamento Bimestral' : 'Editar Planejamento Bimestral'}
      </h1>

      <WizardNavigation
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      <div>
        {currentStep === 1 && <Step1DadosGerais mode={mode} planejamentoId={planejamentoId} />}
        {currentStep === 2 && <Step2SelecaoHabilidades />}
        {currentStep === 3 && <Step3Revisao mode={mode} planejamentoId={planejamentoId} />}
      </div>
    </div>
  );
};
