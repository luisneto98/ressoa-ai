import { useEffect } from 'react';
import { usePlanejamentoWizard } from './hooks/usePlanejamentoWizard';
import { WizardNavigation } from './components/WizardNavigation';
import { Step1DadosGerais } from './components/Step1DadosGerais';
import { Step2SelecaoHabilidades } from './components/Step2SelecaoHabilidades';
import { Step3Revisao } from './components/Step3Revisao';

export const PlanejamentoWizard = () => {
  const { currentStep, setCurrentStep, reset } = usePlanejamentoWizard();

  // Reset wizard on mount
  useEffect(() => {
    reset();
  }, [reset]);

  const handleStepClick = (step: 1 | 2 | 3) => {
    // Only allow going back to previous steps
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-deep-navy">
        Novo Planejamento Bimestral
      </h1>

      <WizardNavigation
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      <div>
        {currentStep === 1 && <Step1DadosGerais />}
        {currentStep === 2 && <Step2SelecaoHabilidades />}
        {currentStep === 3 && <Step3Revisao />}
      </div>
    </div>
  );
};
